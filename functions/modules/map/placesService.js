/* eslint require-jsdoc: "off" */
function createPlacesService(apiKey) {
  const PLACES_API_KEY = apiKey;
  const DEFAULT_RADIUS = 3000;
  const MAX_PLACES = 30;

  const CATEGORY_TYPES = {
    restaurant: "restaurant",
    cafe: "cafe",
    convenience: "convenience_store",
    mart: "supermarket",
    hospital: "hospital",
    laundry: "laundry",
  };

  const SEARCH_FIELDS = [
    "places.id",
    "places.displayName",
    "places.location",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.currentOpeningHours",
    "places.regularOpeningHours",
  ].join(",");


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
    const latText = url.searchParams.get("latitude");
    const lngText = url.searchParams.get("longitude");

    if (latText === null || lngText === null) {
      throw new Error("위도와 경도를 입력해주세요.");
    }

    const latitude = Number(latText);
    const longitude = Number(lngText);

    if (!validCoordinates(latitude, longitude)) {
      throw new Error("올바른 위도와 경도를 입력해주세요.");
    }

    return {latitude, longitude};
  }

  function parseFilters(url) {
    const radiusText = url.searchParams.get("radius");
    const ratingText = url.searchParams.get("minRating");
    const openText = url.searchParams.get("openNow");

    const radius =
    radiusText === null ? DEFAULT_RADIUS : Number(radiusText);

    const minRating =
    ratingText === null ? 0 : Number(ratingText);

    const sort = url.searchParams.get("sort") || "open";

    if (![1000, 3000, 5000].includes(radius)) {
      throw new Error(
          "검색 반경은 1000, 3000, 5000 중 선택해주세요.",
      );
    }

    if (![0, 3.5, 4].includes(minRating)) {
      throw new Error(
          "최소 평점은 0, 3.5, 4 중 선택해주세요.",
      );
    }

    if (
      openText !== null &&
    openText !== "true" &&
    openText !== "false"
    ) {
      throw new Error(
          "openNow는 true 또는 false여야 합니다.",
      );
    }

    if (!["open", "distance", "rating"].includes(sort)) {
      throw new Error("지원하지 않는 정렬 방식입니다.");
    }

    return {
      radius,
      minRating,
      openNow: openText === "true",
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
        Math.sqrt(1 - a),
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
      filters,
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
          lng,
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
        name: place.displayName?.text || "이름 없음",
        address: place.formattedAddress || "",
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
      if (filters.sort === "open") {
        const difference =
        openRank(a.openNow) - openRank(b.openNow);

        if (difference !== 0) {
          return difference;
        }

        return a.distance - b.distance;
      }

      if (filters.sort === "rating") {
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": PLACES_API_KEY,
            "X-Goog-FieldMask": SEARCH_FIELDS,
          },
          body: JSON.stringify(body),
        },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
          data.error?.message || "Google Places 검색 실패",
      );
    }

    return data.places || [];
  }

  // 카테고리별 주변 검색
  async function searchNearbyPlaces(
      latitude,
      longitude,
      category,
      filters,
  ) {
    const type = CATEGORY_TYPES[category];

    if (!type) {
      throw new Error("지원하지 않는 카테고리입니다.");
    }

    const offsets = [
      {lat: 0, lng: 0},
      {lat: 0.018, lng: 0},
      {lat: -0.018, lng: 0},
      {lat: 0, lng: 0.022},
      {lat: 0, lng: -0.022},
    ];

    const collected = new Map();

    for (const offset of offsets) {
      const searchLat = latitude + offset.lat;
      const searchLng = longitude + offset.lng;

      const results = await googleSearch(
          "places:searchNearby",
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
          },
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
        filters,
    );
  }

  // 검색어 기반 장소 검색
  async function searchPlacesByText(
      latitude,
      longitude,
      query,
      filters,
  ) {
    const latitudeDelta = filters.radius / 111320;

    const longitudeDelta =
    filters.radius /
    (
      111320 *
      Math.max(
          Math.abs(
              Math.cos((latitude * Math.PI) / 180),
          ),
          0.01,
      )
    );

    const lowLatitude = Math.max(
        -90,
        latitude - latitudeDelta,
    );

    const highLatitude = Math.min(
        90,
        latitude + latitudeDelta,
    );

    const lowLongitude = Math.max(
        -180,
        longitude - longitudeDelta,
    );

    const highLongitude = Math.min(
        180,
        longitude + longitudeDelta,
    );

    const body = {
      textQuery: query,
      languageCode: "ko",
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
        "places:searchText",
        body,
    );

    return normalizePlaces(
        results,
        latitude,
        longitude,
        filters,
    );
  }

  // 장소 상세정보 + 사용자 리뷰
  async function getPlaceDetails(placeId) {
    const fields = [
      "id",
      "displayName",
      "formattedAddress",
      "location",
      "rating",
      "userRatingCount",
      "regularOpeningHours",
      "currentOpeningHours",
      "nationalPhoneNumber",
      "websiteUri",
      "parkingOptions",
      "googleMapsUri",
      "reviews",
    ].join(",");

    const response = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          headers: {
            "X-Goog-Api-Key": PLACES_API_KEY,
            "X-Goog-FieldMask": fields,
          },
        },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
          data.error?.message || "상세정보 조회 실패",
      );
    }

    const reviews = (data.reviews || []).map(
        (review, index) => ({
          id: review.name || `review-${index}`,
          author:
        review.authorAttribution?.displayName ||
        "Google 사용자",
          authorProfileUrl:
        review.authorAttribution?.uri || null,
          authorPhotoUrl:
        review.authorAttribution?.photoUri || null,
          rating: review.rating ?? null,
          text:
        review.text?.text ||
        review.originalText?.text ||
        "",
          relativePublishTime:
        review.relativePublishTimeDescription || "",
          publishTime: review.publishTime || null,
          googleMapsUri:
        review.googleMapsUri || null,
        }),
    );

    return {
      id: data.id,
      name: data.displayName?.text || "이름 없음",
      address: data.formattedAddress || "",
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
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": PLACES_API_KEY,
            "X-Goog-FieldMask": [
              "places.id",
              "places.displayName",
              "places.formattedAddress",
              "places.location",
            ].join(","),
          },
          body: JSON.stringify({
            textQuery: query,
            languageCode: "ko",
            regionCode: "KR",
            maxResultCount: 10,
          }),
        },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
          data.error?.message || "주소 검색 실패",
      );
    }

    return (data.places || [])
        .filter((place) =>
          validCoordinates(
              place.location?.latitude,
              place.location?.longitude,
          ),
        )
        .map((place) => ({
          id: place.id,
          name:
        place.displayName?.text ||
        place.formattedAddress ||
        "검색 결과",
          address: place.formattedAddress || "",
          latitude: place.location.latitude,
          longitude: place.location.longitude,
        }));
  }


  return {
    parseCoordinates,
    parseFilters,
    searchNearbyPlaces,
    searchPlacesByText,
    getPlaceDetails,
    searchAddresses,
    CATEGORY_TYPES,
  };
}

module.exports = {createPlacesService};
