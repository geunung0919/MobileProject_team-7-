const {createPlacesService} = require("./placesService");

const INPUT_ERRORS = [
  "입력해주세요",
  "선택해주세요",
  "지원하지 않는",
  "이상",
  "여야 합니다",
];

/**
 * 기존 지도 API 요청을 처리하고 JSON 응답을 반환한다.
 * @param {object} req HTTP 요청
 * @param {object} res HTTP 응답
 * @param {string} apiKey Google Places API 키
 * @return {Promise<*>} HTTP 응답 처리 결과
 */
async function handlePlacesRequest(req, res, apiKey) {
  const pathname = req.path;
  const url = new URL(
      req.originalUrl || req.url,
      "http://localhost",
  );

  const routes = [
    "/places/nearby",
    "/places/search",
    "/places/details",
    "/places/address-search",
  ];

  if (req.method !== "GET" || !routes.includes(pathname)) {
    return res.status(404).json({
      error: "요청한 주소가 없습니다.",
    });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: "Places API 키가 설정되지 않았습니다.",
    });
  }

  const service = createPlacesService(apiKey);

  if (pathname === "/places/address-search") {
    const query = (
      url.searchParams.get("query") || ""
    ).trim();

    if (query.length < 2 || query.length > 100) {
      return res.status(400).json({
        error: "주소는 2자 이상 100자 이하로 입력해주세요.",
      });
    }

    try {
      const addresses = await service.searchAddresses(query);
      return res.status(200).json({addresses});
    } catch (error) {
      console.error("주소 검색 실패:", error.message);
      return res.status(502).json({
        error: "주소 검색에 실패했습니다. API 설정과 서버 로그를 확인해주세요.",
      });
    }
  }

  try {
    if (pathname === "/places/details") {
      const placeId = url.searchParams.get("id");

      if (!placeId || !/^[A-Za-z0-9_-]+$/.test(placeId)) {
        return res.status(400).json({
          error: "올바른 장소 ID를 입력해주세요.",
        });
      }

      const place = await service.getPlaceDetails(placeId);
      return res.status(200).json({place});
    }

    const {latitude, longitude} = service.parseCoordinates(url);
    const filters = service.parseFilters(url);

    let places;
    let query;
    let category;

    if (pathname === "/places/search") {
      query = (url.searchParams.get("query") || "").trim();

      if (query.length < 2 || query.length > 100) {
        throw new Error(
            "검색어는 2자 이상 100자 이하로 입력해주세요.",
        );
      }

      places = await service.searchPlacesByText(
          latitude,
          longitude,
          query,
          filters,
      );
    } else {
      category = url.searchParams.get("category") || "restaurant";

      if (!service.CATEGORY_TYPES[category]) {
        throw new Error("지원하지 않는 카테고리입니다.");
      }

      places = await service.searchNearbyPlaces(
          latitude,
          longitude,
          category,
          filters,
      );
    }

    return res.status(200).json({
      ...(query !== undefined ? {query} : {category}),
      count: places.length,
      radius: filters.radius,
      filters,
      places,
    });
  } catch (error) {
    console.error("지도 API 오류:", error.message);

    const isInputError = INPUT_ERRORS.some(
        (message) => error.message.includes(message),
    );

    return res.status(isInputError ? 400 : 500).json({
      error: isInputError ?
        error.message :
        "장소 정보를 불러오지 못했습니다.",
    });
  }
}

module.exports = {handlePlacesRequest};
