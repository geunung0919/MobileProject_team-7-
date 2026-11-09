
const http = require('http');
const path = require('path');

process.loadEnvFile(path.join(__dirname, '.env'));

const PORT = 3001;
const PLACES_API_KEY = process.env.PLACES_API_KEY;

const DEFAULT_RADIUS = 3000;
const MAX_PLACES = 30;

const CATEGORY_TYPES = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  convenience: 'convenience_store',
  mart: 'supermarket',
  hospital: 'hospital',
  laundry: 'laundry',
};

const SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.currentOpeningHours',
  'places.regularOpeningHours',
].join(',');

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(data));
}

function validCoordinates(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function parseCoordinates(url) {
  const latText = url.searchParams.get('latitude');
  const lngText = url.searchParams.get('longitude');

  if (latText === null || lngText === null) {
    throw new Error('위도와 경도를 입력해주세요.');
  }

  const latitude = Number(latText);
  const longitude = Number(lngText);

  if (!validCoordinates(latitude, longitude)) {
    throw new Error('올바른 위도와 경도를 입력해주세요.');
  }

  return { latitude, longitude };
}

function parseFilters(url) {
  const radiusText = url.searchParams.get('radius');
  const ratingText = url.searchParams.get('minRating');
  const openText = url.searchParams.get('openNow');

  const radius =
    radiusText === null ? DEFAULT_RADIUS : Number(radiusText);

  const minRating =
    ratingText === null ? 0 : Number(ratingText);

  const sort = url.searchParams.get('sort') || 'open';

  if (![1000, 3000, 5000].includes(radius)) {
    throw new Error(
      '검색 반경은 1000, 3000, 5000 중 선택해주세요.'
    );
  }

  if (![0, 3.5, 4].includes(minRating)) {
    throw new Error(
      '최소 평점은 0, 3.5, 4 중 선택해주세요.'
    );
  }

  if (
    openText !== null &&
    openText !== 'true' &&
    openText !== 'false'
  ) {
    throw new Error(
      'openNow는 true 또는 false여야 합니다.'
    );
  }

  if (!['open', 'distance', 'rating'].includes(sort)) {
    throw new Error('지원하지 않는 정렬 방식입니다.');
  }

  return {
    radius,
    minRating,
    openNow: openText === 'true',
    sort,
  };
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = (value) => (value * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

function openRank(value) {
  if (value === true) return 0;
  if (value === null) return 1;
  return 2;
}

function normalizePlaces(
  rawPlaces,
  latitude,
  longitude,
  filters
) {
  const unique = new Map();

  for (const place of rawPlaces) {
    const lat = place.location?.latitude;
    const lng = place.location?.longitude;

    if (!place.id || !validCoordinates(lat, lng)) {
      continue;
    }

    const distance = getDistance(
      latitude,
      longitude,
      lat,
      lng
    );

    if (distance > filters.radius) {
      continue;
    }

    const rating = place.rating ?? null;
    const openNow =
      place.currentOpeningHours?.openNow ?? null;

    if (
      filters.minRating > 0 &&
      (rating === null || rating < filters.minRating)
    ) {
      continue;
    }

    if (filters.openNow && openNow !== true) {
      continue;
    }

    unique.set(place.id, {
      id: place.id,
      name: place.displayName?.text || '이름 없음',
      address: place.formattedAddress || '',
      latitude: lat,
      longitude: lng,
      distance: Math.round(distance),
      rating,
      reviewCount: place.userRatingCount ?? null,
      openNow,
      openingHours:
        place.regularOpeningHours?.weekdayDescriptions || [],
    });
  }

  const results = Array.from(unique.values());

  results.sort((a, b) => {
    if (filters.sort === 'open') {
      const difference =
        openRank(a.openNow) - openRank(b.openNow);

      if (difference !== 0) {
        return difference;
      }

      return a.distance - b.distance;
    }

    if (filters.sort === 'rating') {
      const difference =
        (b.rating ?? -1) - (a.rating ?? -1);

      if (difference !== 0) {
        return difference;
      }

      return a.distance - b.distance;
    }

    return a.distance - b.distance;
  });

  return results.slice(0, MAX_PLACES);
}

async function googleSearch(endpoint, body) {
  const response = await fetch(
    `https://places.googleapis.com/v1/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': SEARCH_FIELDS,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || 'Google Places 검색 실패'
    );
  }

  return data.places || [];
}

// 카테고리별 주변 검색
async function searchNearbyPlaces(
  latitude,
  longitude,
  category,
  filters
) {
  const type = CATEGORY_TYPES[category];

  if (!type) {
    throw new Error('지원하지 않는 카테고리입니다.');
  }

  const offsets = [
    { lat: 0, lng: 0 },
    { lat: 0.018, lng: 0 },
    { lat: -0.018, lng: 0 },
    { lat: 0, lng: 0.022 },
    { lat: 0, lng: -0.022 },
  ];

  const collected = new Map();

  for (const offset of offsets) {
    const searchLat = latitude + offset.lat;
    const searchLng = longitude + offset.lng;

    const results = await googleSearch(
      'places:searchNearby',
      {
        includedTypes: [type],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: searchLat,
              longitude: searchLng,
            },
            radius: 3000,
          },
        },
      }
    );

    for (const place of results) {
      if (place.id) {
        collected.set(place.id, place);
      }
    }
  }

  return normalizePlaces(
    Array.from(collected.values()),
    latitude,
    longitude,
    filters
  );
}

// 검색어 기반 장소 검색
async function searchPlacesByText(
  latitude,
  longitude,
  query,
  filters
) {
  const latitudeDelta = filters.radius / 111320;

  const longitudeDelta =
    filters.radius /
    (
      111320 *
      Math.max(
        Math.abs(
          Math.cos((latitude * Math.PI) / 180)
        ),
        0.01
      )
    );

  const lowLatitude = Math.max(
    -90,
    latitude - latitudeDelta
  );

  const highLatitude = Math.min(
    90,
    latitude + latitudeDelta
  );

  const lowLongitude = Math.max(
    -180,
    longitude - longitudeDelta
  );

  const highLongitude = Math.min(
    180,
    longitude + longitudeDelta
  );

  const body = {
    textQuery: query,
    languageCode: 'ko',
    maxResultCount: 20,
    locationRestriction: {
      rectangle: {
        low: {
          latitude: lowLatitude,
          longitude: lowLongitude,
        },
        high: {
          latitude: highLatitude,
          longitude: highLongitude,
        },
      },
    },
  };

  if (filters.openNow) {
    body.openNow = true;
  }

  if (filters.minRating > 0) {
    body.minRating = filters.minRating;
  }

  const results = await googleSearch(
    'places:searchText',
    body
  );

  return normalizePlaces(
    results,
    latitude,
    longitude,
    filters
  );
}

// 장소 상세정보 + 사용자 리뷰
async function getPlaceDetails(placeId) {
  const fields = [
    'id',
    'displayName',
    'formattedAddress',
    'location',
    'rating',
    'userRatingCount',
    'regularOpeningHours',
    'currentOpeningHours',
    'nationalPhoneNumber',
    'websiteUri',
    'parkingOptions',
    'googleMapsUri',
    'reviews',
  ].join(',');

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': fields,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || '상세정보 조회 실패'
    );
  }

  const reviews = (data.reviews || []).map(
    (review, index) => ({
      id: review.name || `review-${index}`,
      author:
        review.authorAttribution?.displayName ||
        'Google 사용자',
      authorProfileUrl:
        review.authorAttribution?.uri || null,
      authorPhotoUrl:
        review.authorAttribution?.photoUri || null,
      rating: review.rating ?? null,
      text:
        review.text?.text ||
        review.originalText?.text ||
        '',
      relativePublishTime:
        review.relativePublishTimeDescription || '',
      publishTime: review.publishTime || null,
      googleMapsUri:
        review.googleMapsUri || null,
    })
  );

  return {
    id: data.id,
    name: data.displayName?.text || '이름 없음',
    address: data.formattedAddress || '',
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
    rating: data.rating ?? null,
    reviewCount: data.userRatingCount ?? null,
    reviews,
    googleMapsUri: data.googleMapsUri || null,
    openingHours:
      data.regularOpeningHours?.weekdayDescriptions || [],
    openNow:
      data.currentOpeningHours?.openNow ?? null,
    phone: data.nationalPhoneNumber || null,
    website: data.websiteUri || null,
    parking: data.parkingOptions || null,
  };
}

// 주소 또는 건물명 검색
async function searchAddresses(query) {
  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'ko',
        regionCode: 'KR',
        maxResultCount: 10,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || '주소 검색 실패'
    );
  }

  return (data.places || [])
    .filter((place) =>
      validCoordinates(
        place.location?.latitude,
        place.location?.longitude
      )
    )
    .map((place) => ({
      id: place.id,
      name:
        place.displayName?.text ||
        place.formattedAddress ||
        '검색 결과',
      address: place.formattedAddress || '',
      latitude: place.location.latitude,
      longitude: place.location.longitude,
    }));
}

const server = http.createServer(async (req, res) => {
  let url;

  try {
    url = new URL(
      req.url,
      `http://localhost:${PORT}`
    );
  } catch {
    sendJson(res, 400, {
      error: '잘못된 요청입니다.',
    });
    return;
  }

  if (
    req.method === 'GET' &&
    url.pathname === '/health'
  ) {
    sendJson(res, 200, {
      status: 'ok',
      message: '자취생존맵 서버 실행 중',
      placesApiKeyConfigured:
        Boolean(PLACES_API_KEY),
    });
    return;
  }

  if (
    req.method === 'GET' &&
    url.pathname === '/places/address-search'
  ) {
    if (!PLACES_API_KEY) {
      sendJson(res, 500, {
        error:
          'Places API 키가 설정되지 않았습니다.',
      });
      return;
    }

    const query = (
      url.searchParams.get('query') || ''
    ).trim();

    if (
      query.length < 2 ||
      query.length > 100
    ) {
      sendJson(res, 400, {
        error:
          '주소는 2자 이상 100자 이하로 입력해주세요.',
      });
      return;
    }

    try {
      const addresses =
        await searchAddresses(query);

      sendJson(res, 200, { addresses });
    } catch (error) {
      console.error(
        '주소 검색 오류:',
        error.message
      );

      sendJson(res, 502, {
        error:
          '주소 검색에 실패했습니다. API 설정과 서버 로그를 확인해주세요.',
      });
    }

    return;
  }

  if (
    req.method === 'GET' &&
    [
      '/places/nearby',
      '/places/search',
      '/places/details',
    ].includes(url.pathname)
  ) {
    if (!PLACES_API_KEY) {
      sendJson(res, 500, {
        error:
          'Places API 키가 설정되지 않았습니다.',
      });
      return;
    }

    try {
      if (
        url.pathname === '/places/details'
      ) {
        const placeId =
          url.searchParams.get('id');

        if (
          !placeId ||
          !/^[A-Za-z0-9_-]+$/.test(placeId)
        ) {
          sendJson(res, 400, {
            error:
              '올바른 장소 ID를 입력해주세요.',
          });
          return;
        }

        const place =
          await getPlaceDetails(placeId);

        sendJson(res, 200, { place });
        return;
      }

      const {
        latitude,
        longitude,
      } = parseCoordinates(url);

      const filters = parseFilters(url);

      let places;
      let category;
      let query;

      if (
        url.pathname === '/places/search'
      ) {
        query = (
          url.searchParams.get('query') || ''
        ).trim();

        if (
          query.length < 2 ||
          query.length > 100
        ) {
          throw new Error(
            '검색어는 2자 이상 100자 이하로 입력해주세요.'
          );
        }

        console.log(
          '텍스트 검색:',
          query,
          filters
        );

        places = await searchPlacesByText(
          latitude,
          longitude,
          query,
          filters
        );
      } else {
        category =
          url.searchParams.get('category') ||
          'restaurant';

        if (!CATEGORY_TYPES[category]) {
          throw new Error(
            '지원하지 않는 카테고리입니다.'
          );
        }

        console.log(
          '카테고리 검색:',
          category,
          filters
        );

        places = await searchNearbyPlaces(
          latitude,
          longitude,
          category,
          filters
        );
      }

      console.log(
        '검색 완료:',
        places.length,
        '개'
      );

      sendJson(res, 200, {
        ...(query !== undefined
          ? { query }
          : { category }),
        count: places.length,
        radius: filters.radius,
        filters,
        places,
      });
    } catch (error) {
      console.error(
        'API 오류:',
        error.message
      );

      const isInputError =
        error.message.includes('입력해주세요') ||
        error.message.includes('선택해주세요') ||
        error.message.includes('지원하지 않는') ||
        error.message.includes('이상') ||
        error.message.includes('여야 합니다');

      sendJson(
        res,
        isInputError ? 400 : 500,
        {
          error: isInputError
            ? error.message
            : '장소 정보를 불러오지 못했습니다.',
        }
      );
    }

    return;
  }

  sendJson(res, 404, {
    error: '요청한 주소가 없습니다.',
  });
});

server.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `서버 실행 완료: http://localhost:${PORT}`
    );
  }
);
