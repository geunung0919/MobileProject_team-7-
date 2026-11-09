
export const emergencyGuides = {
  // 1. 화재·연기
  fire: {
    summary:
      '공동주택 화재는 불이 난 위치와 연기 유입 여부에 따라 대처 방법이 달라져요. 안전한 대피 경로가 있는지 먼저 확인하세요.',

    call: {
      number: '119',
      label: '화재 신고·구조 요청',
    },

    steps: [
      {
        title: '화재 사실 알리기',
        body:
          '불이나 연기를 발견하면 주변에 알리고 비상벨을 눌러요.',
      },
      {
        title: '우리 집에서 불이 났고 대피할 수 있다면',
        body:
          '낮은 자세로 계단을 이용해 지상층이나 옥상 등 안전한 장소로 대피해요. 나갈 때 출입문을 닫고 엘리베이터는 이용하지 않아요.',
      },
      {
        title: '우리 집에서 불이 났지만 대피하기 어렵다면',
        body:
          '대피공간이나 경량칸막이 등 설치된 피난시설을 이용해요. 이용할 수 없다면 화염과 연기에서 먼 곳으로 이동해 문을 닫고 틈새를 막은 뒤, 119에 위치를 알리고 구조를 요청해요.',
      },
      {
        title: '다른 곳에서 불이 났고 우리 집에 연기가 들어오지 않는다면',
        body:
          '집 안에서 대기하며 창문을 닫고 화재 상황을 확인해요. 119에 신고하고 안내방송과 소방당국의 지시에 따라 행동해요.',
      },
      {
        title: '다른 곳에서 불이 났고 우리 집에 연기가 들어온다면',
        body:
          '복도와 계단에 화염이나 연기가 없어 안전하게 나갈 수 있다면 낮은 자세로 계단을 이용해 대피해요. 대피가 어렵다면 피난시설을 이용하거나 연기를 피해 문을 닫고 119에 구조를 요청해요.',
      },
    ],

    donts: [
      '화재 발생 시 엘리베이터 이용하기',
      '연기가 가득한 복도나 계단으로 무리하게 대피하기',
      '대피한 뒤 물건을 챙기러 다시 들어가기',
      '다른 곳에서 불이 났다는 이유만으로 상황 확인 없이 무조건 밖으로 나가기',
    ],

    source: {
      organization: '행정안전부',
      title: '화재 시 행동요령',
      url: 'https://www.mois.go.kr/frt/bbs/type002/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000216&nttId=127232',
      verifiedAt: '2026-11-07',
    },
  },

  // 2. 범죄·신변 위협
  crime: {
    summary:
      '범죄나 신변 위협을 느끼면 직접 맞서지 말고 안전을 확보하세요. 긴급한 상황에서는 112에 신고하고 경찰의 안내를 따르세요.',

    call: {
      number: '112',
      label: '범죄·신변 위협 신고',
    },

    steps: [
      {
        title: '위험한 장소에서 벗어나기',
        body:
          '가능하다면 위협하는 사람과 거리를 두고 주변에 도움을 요청하세요. 사람이 있는 가게나 안전한 장소로 이동하세요.',
      },
      {
        title: '112에 신고하기',
        body:
          '현재 위치와 발생한 상황, 위협하는 사람의 특징 등을 가능한 범위에서 알리세요. 정확한 주소를 모르면 주변 건물이나 눈에 띄는 장소를 설명하세요.',
      },
      {
        title: '말하기 어렵다면 문자 신고하기',
        body:
          '112로 현재 위치와 상황을 문자로 보낼 수 있어요. 112신고앱에서는 문자·녹음·영상 신고도 지원해요.',
      },
      {
        title: '집 안에서 위협받는 경우',
        body:
          '안전하게 대피할 수 없다면 문을 잠그고 위협하는 사람과 거리를 두세요. 112에 현재 상황을 알리고 경찰의 지시를 따르세요.',
      },
      {
        title: '안전이 확보되면 증거 보관하기',
        body:
          '협박 문자, 통화 기록, 사진 등 관련 자료를 삭제하지 말고 보관하세요. 증거를 확보하기 위해 위험한 장소에 머물지는 마세요.',
      },
    ],

    donts: [
      '위협하는 사람에게 직접 맞서거나 뒤쫓기',
      '신고를 미루고 혼자 해결하려 하기',
      '증거를 남기려고 위험한 장소에 머물기',
      '안전 확인 없이 문을 열어 주기',
    ],

    sources: [
      {
        organization: '경찰청',
        title: '112신고포털',
        description: '112 신고 방법 및 신고 서비스 안내',
        url: 'https://112.go.kr/',
        verifiedAt: null,
      },
      {
        organization: '경찰청',
        title: '말 없는 112 신고 안내',
        description:
          '말하기 어려운 상황에서 112 신고를 진행하는 방법',
        url: 'https://www.police.go.kr/user/bbs/BD_selectBbs.do?q_bbsCode=1007&q_bbscttSn=20220927145508336',
        verifiedAt: null,
      },
      {
        organization: '법제처 찾기쉬운 생활법령정보',
        title: '범죄 발생 시 대처',
        description: '범죄 피해 신고 및 관련 법률 안내',
        url: 'https://www.easylaw.go.kr/CSP/CnpClsMainBtr.laf?ccfNo=2&cciNo=1&cnpClsNo=1&csmSeq=734&menuType=cnpcls&popMenu=ov',
        verifiedAt: null,
      },
    ],
  },

  // 3. 지진·재난 — 최종 보완
  disaster: {
    summary:
      '지진이 발생하면 흔들리는 동안 몸을 보호하고, 멈춘 뒤 안전하게 대피하세요. 태풍·호우가 발생했다면 침수 위험지역을 피하고 재난 안내를 확인하세요.',

    call: {
      number: '119',
      label: '재난 구조·구급 요청',
    },

    steps: [
      {
        title: '지진 발생 중에는 머리와 몸 보호하기',
        body:
          '실내에서 흔들림이 느껴지면 튼튼한 탁자 아래로 들어가 탁자 다리를 잡고 몸을 보호하세요. 유리창과 넘어질 수 있는 가구에서 떨어지세요.',
      },
      {
        title: '흔들림이 멈추면 출구 확보하기',
        body:
          '흔들림이 멈춘 후 안전하게 접근할 수 있다면 전기와 가스를 차단하고 문을 열어 출구를 확보하세요. 위험한 설비를 무리하게 조작하지 마세요.',
      },
      {
        title: '계단을 이용해 안전하게 대피하기',
        body:
          '건물 밖으로 나갈 때는 엘리베이터 대신 계단을 이용하세요. 가방이나 손으로 머리를 보호하고 건물 외벽과 유리창, 떨어지는 물건에 주의하세요.',
      },
      {
        title: '넓고 안전한 장소로 이동하기',
        body:
          '건물에서 떨어진 운동장이나 공원 등 넓은 공간으로 이동하세요. 대피 후에는 여진과 주변 시설물의 손상에 주의하세요.',
      },
      {
        title: '태풍·호우 시 침수 위험지역 피하기',
        body:
          '강한 비나 태풍이 발생하면 하천변, 지하차도, 지하주차장, 저지대 등 위험지역에 접근하지 마세요. 건물에 물이 차오르면 안전한 높은 장소나 지정된 대피장소로 이동하세요.',
      },
      {
        title: '재난문자와 공식 안내 확인하기',
        body:
          '휴대전화 재난문자와 TV·라디오, 국민안전24 등 공공기관의 안내를 확인하세요. 대피 명령이 내려지면 안내에 따라 이동하세요.',
      },
      {
        title: '부상자나 고립자가 있다면 119 신고하기',
        body:
          '부상자나 고립된 사람이 있다면 119에 위치와 상황을 알리세요. 구조를 위해 위험한 건물이나 침수지역에 무리하게 진입하지 마세요.',
      },
    ],

    donts: [
      '지진으로 흔들리는 도중 무작정 건물 밖으로 뛰어나가기',
      '지진 발생 후 엘리베이터 이용하기',
      '건물 외벽이나 유리창, 전신주 가까이에 머물기',
      '침수된 도로나 지하차도에 진입하기',
      '젖은 손으로 전기설비나 차단기 만지기',
      '공식 안내를 확인하지 않고 위험한 장소로 돌아가기',
    ],

    sources: [
      {
        organization: '행정안전부 국민안전24',
        title: '지진 발생 시 행동요령',
        description:
          '지진 발생 시 신체 보호, 대피 및 지진 발생 후 행동요령',
        url: 'https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=earthQuake&menuSn=4',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '행정안전부 국민안전24',
        title: '태풍 행동요령',
        description:
          '태풍 예보와 특보 중 대처, 강풍·침수 위험지역 회피 및 대피 방법',
        url: 'https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=typhoon&menuSn=4',
        verifiedAt: null,
      },
      {
        organization: '행정안전부 국민안전24',
        title: '호우 행동요령',
        description:
          '집중호우 대비, 침수지역 접근 금지, 대피 및 피해 발생 후 안전수칙',
        url: 'https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=heavyRain&menuSn=4',
        verifiedAt: null,
      },
    ],
  },

  // 4. 응급환자·부상 — 최종 보완
  patient: {
    summary:
      '응급환자가 발생하면 현장의 안전을 확인하고 반응을 살펴보세요. 반응이 없거나 정상적으로 숨을 쉬지 않는다면 즉시 119에 신고하고 안내에 따라 심폐소생술을 시행하세요.',

    call: {
      number: '119',
      label: '응급 구조·구급 요청',
    },

    steps: [
      {
        title: '현장 안전과 환자 반응 확인하기',
        body:
          '먼저 주변에 교통사고, 화재, 감전 등 위험이 없는지 확인하세요. 안전하다면 환자의 어깨를 가볍게 두드리며 큰 소리로 불러 반응이 있는지 확인하세요.',
      },
      {
        title: '반응이 없다면 119에 신고하기',
        body:
          '환자가 반응하지 않으면 즉시 119에 신고하고 주변 사람에게 자동심장충격기(AED)를 가져오도록 요청하세요. 휴대전화는 스피커폰으로 전환하고 119 상담원의 안내를 따르세요.',
      },
      {
        title: '정상 호흡 확인하기',
        body:
          '119 신고 후 환자의 호흡을 10초 이내로 확인하세요. 숨을 쉬지 않거나 헐떡이는 등 정상 호흡이 아니라면 심장정지로 판단하고 즉시 심폐소생술을 시작하세요.',
      },
      {
        title: '가슴압박 심폐소생술 시행하기',
        body:
          '성인 환자를 단단하고 평평한 바닥에 눕히고 가슴 중앙의 아래쪽 절반을 분당 100~120회, 약 5~6cm 깊이로 강하고 빠르게 압박하세요. 일반인은 119의 지시에 따라 가슴압박만 시행할 수 있어요.',
      },
      {
        title: '자동심장충격기(AED) 사용하기',
        body:
          'AED가 도착하면 전원을 켜고 음성 안내에 따라 패드를 부착하세요. 심장 리듬 분석이나 전기충격 중에는 환자에게 손대지 마세요. 안내에 따라 즉시 가슴압박을 다시 시작하세요.',
      },
      {
        title: '화상 발생 시 흐르는 물로 식히기',
        body:
          '열에 의한 화상은 안전한 장소로 이동한 후 화상 부위를 시원한 흐르는 물로 약 20분 이상 식히세요. 물집은 터뜨리지 말고 얼음을 직접 대지 마세요. 화상이 심하거나 넓으면 119에 신고하거나 신속히 진료를 받으세요.',
      },
      {
        title: '구급대 도착까지 상태 확인하기',
        body:
          '환자의 상태를 계속 살피고 119의 안내에 따라 응급처치를 이어가세요. 현장에 위험이 있거나 생명을 구하기 위해 꼭 필요한 경우가 아니라면 심각한 부상이 의심되는 환자를 함부로 움직이지 마세요.',
      },
    ],

    donts: [
      '현장의 위험을 확인하지 않고 환자에게 접근하기',
      '반응이 없고 정상 호흡도 없는 환자에게 심폐소생술을 미루기',
      'AED가 심장 리듬을 분석하거나 전기충격을 가할 때 환자 만지기',
      '심각한 부상이 의심되는 환자를 불필요하게 움직이기',
      '화상 부위에 얼음이나 얼음물을 직접 대기',
      '화상 물집을 임의로 터뜨리기',
      '119 상담원의 안내를 무시하고 임의로 응급처치를 중단하기',
    ],

    sources: [
      {
        organization: '대한심폐소생협회',
        title: '2025년 한국 심폐소생술 가이드라인',
        description:
          '심장정지 확인, 119 신고, 가슴압박 심폐소생술, 자동심장충격기 사용에 관한 전문 지침 PDF',
        url: 'https://www.kacpr.org/download/2025%EB%85%84%20%ED%95%9C%EA%B5%AD%20%EC%8B%AC%ED%8F%90%EC%86%8C%EC%83%9D%EC%88%A0%20%EA%B0%80%EC%9D%B4%EB%93%9C%EB%9D%BC%EC%9D%B8.pdf',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '대한심폐소생협회',
        title: '일반인 심폐소생술 교육 안내',
        description:
          '일반인을 위한 심폐소생술 교육과정 및 교육기관 안내',
        url: 'https://www.kacpr.org/',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '질병관리청 국가건강정보포털',
        title: '화상',
        description:
          '화상의 종류, 흐르는 물을 이용한 응급처치, 물집 관리 및 병원 치료 안내',
        url: 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6584',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '질병관리청',
        title: '다양한 화상의 응급처치',
        description:
          '열·전기·화학 화상의 응급처치와 주의사항에 관한 자료 PDF',
        url: 'https://www.kdca.go.kr/bbs/kdca/46/244502/download.do',
        verifiedAt: '2026-11-07',
      },
    ],
  },

  // 5. 누수·단수
  leak: {
    summary:
      '누수·단수가 발생하면 먼저 안전을 확인하세요. 물이 전기설비에 닿았거나 침수가 진행 중이라면 접근하지 마세요.',

    call: null,

    steps: [
      {
        title: '누수인지 단수인지 확인하기',
        body:
          '수도꼭지에서 물이 나오지 않는지, 배관이나 천장에서 물이 새는지 확인해요. 위험한 곳에는 접근하지 않아요.',
      },
      {
        title: '전기 위험이 있는지 확인하기',
        body:
          '물이 콘센트, 전선, 차단기 주변에 있다면 전기설비를 만지지 않아요. 차단기가 젖었거나 접근 경로가 젖어 있다면 직접 조작하지 말고 전문가에게 연락해요.',
      },
      {
        title: '안전한 경우 수도 밸브 잠그기',
        body:
          '배관에서 물이 새고 밸브에 안전하게 접근할 수 있다면 해당 수도 밸브나 집 전체 수도 밸브를 잠가요.',
      },
      {
        title: '관리실·집주인에게 연락하기',
        body:
          '누수 위치와 피해 상황을 알리고 점검을 요청해요. 단수라면 건물 전체 문제인지 확인하고 관리실이나 관할 수도사업자에 문의해요.',
      },
      {
        title: '피해 상황 기록하기',
        body:
          '안전이 확보된 후 누수 위치와 피해 상태를 사진이나 영상으로 남겨요. 감전이나 붕괴 위험이 있는 장소에는 들어가지 않아요.',
      },
      {
        title: '침수가 심해지면 대피하기',
        body:
          '물이 빠르게 차오르거나 안전한 이동이 어려워질 수 있다면 즉시 안전한 곳으로 대피해요. 구조가 필요하면 119에 신고해요.',
      },
    ],

    donts: [
      '젖은 손으로 콘센트나 전기설비 만지기',
      '물에 잠긴 차단기를 직접 조작하기',
      '감전 위험이 있는 곳에 들어가 누수 확인하기',
      '안전 확인 없이 침수된 전기제품 다시 사용하기',
    ],

    sources: [
      {
        organization: '행정안전부 국민안전24',
        title: '전기·가스 사고 행동요령',
        description:
          '젖은 손으로 전기설비를 만지지 않는 등 감전사고 예방 수칙. 누수 자체의 수리 방법을 다루는 자료는 아니에요.',
        url: 'https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=electircGasAccident&menuSn=4',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '행정안전부 국민안전24',
        title: '침수 시 행동요령',
        description:
          '침수 지역 이동 시 주의사항과 전기시설물 접근 위험 등 침수 안전수칙',
        url: 'https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=inundation&menuSn=4',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '행정안전부 국민안전24',
        title: '홍수 시 행동요령',
        description:
          '침수된 주택의 전기·가스 안전점검과 안전한 복귀 관련 안내',
        url: 'https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=flood&menuSn=4',
        verifiedAt: '2026-11-07',
      },
    ],
  },

  // 6. 정전·차단기
  power: {
    summary:
      '정전이 발생하면 우리 집만 정전인지 먼저 확인하세요. 누전이나 감전 위험이 의심되면 전기설비를 직접 조작하지 마세요.',

    call: {
      number: '123',
      label: '한국전력 정전 신고·상담',
    },

    steps: [
      {
        title: '정전 범위 확인하기',
        body:
          '복도와 주변 건물에도 전기가 끊겼는지 확인해요. 건물 전체가 정전됐다면 관리실에 연락해요.',
      },
      {
        title: '전기제품 사용 중단하기',
        body:
          '안전하게 접근할 수 있는 전기제품의 전원을 끄고 플러그를 뽑아요. 정전 복구 시 갑작스러운 작동을 예방할 수 있어요.',
      },
      {
        title: '차단기 상태 확인하기',
        body:
          '우리 집만 정전됐다면 분전반의 차단기 상태를 눈으로 확인해요. 물기, 타는 냄새, 연기, 손상 흔적이 있다면 만지지 말고 전문가에게 연락해요.',
      },
      {
        title: '차단기가 반복해서 내려가면 점검 요청하기',
        body:
          '차단기가 다시 내려가거나 정상적으로 작동하지 않으면 무리하게 복구하지 말고 관리실이나 전기 전문가에게 점검을 요청해요.',
      },
      {
        title: '한국전력에 정전 문의하기',
        body:
          '주변 지역까지 정전됐거나 공급 문제로 의심된다면 국번 없이 123으로 문의해요.',
      },
      {
        title: '정전 중 안전하게 기다리기',
        body:
          '휴대전화 조명이나 손전등을 사용하고, 냉장고 문은 불필요하게 열지 않아요. 안내방송과 정전 복구 정보를 확인해요.',
      },
    ],

    donts: [
      '젖은 손으로 플러그나 차단기 만지기',
      '침수되거나 손상된 분전반 직접 조작하기',
      '반복해서 내려가는 차단기를 계속 올리기',
      '전선을 직접 만지거나 수리하기',
      '정전 중 엘리베이터 이용하기',
    ],

    sources: [
      {
        organization: '한국전력공사',
        title: '정전복구 절차',
        description:
          '정전 신고 전화 123과 한국전력의 정전복구 절차 안내',
        url: 'https://www.kepco.co.kr/home/customer/power-outage/outage-recovery/conts.do',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '행정안전부 국민안전24',
        title: '전기·가스 사고 행동요령',
        description:
          '젖은 손으로 전기설비를 만지지 않는 등 전기 안전수칙',
        url: 'https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=electircGasAccident&menuSn=4',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '부여군청',
        title: '전기사고 행동요령',
        description:
          '전기사고 예방과 안전 행동요령에 관한 지방자치단체 참고 자료',
        url: 'https://www.buyeo.go.kr/html/kr/refo/refo_06060201.html',
        verifiedAt: null,
      },
    ],
  },

  // 7. 벌레·해충
  pest: {
    summary:
      '벌레·해충을 발견하면 종류를 확인하고 음식물, 물기, 유입 경로부터 관리하세요. 모기·빈대·살충제 사용은 각각의 공식 자료를 참고할 수 있어요.',

    call: null,

    steps: [
      {
        title: '해충 종류와 발생 위치 확인하기',
        body:
          '벌레가 나타나는 장소와 빈도를 확인해요. 사진을 남겨 종류를 구분하고 모르는 벌레를 맨손으로 만지지 않아요.',
      },
      {
        title: '음식물과 쓰레기 정리하기',
        body:
          '음식물 쓰레기를 제때 버리고 식재료는 밀폐해 보관해요. 싱크대와 조리대의 음식물 찌꺼기도 제거해요.',
      },
      {
        title: '물기와 유입 경로 관리하기',
        body:
          '배수구 주변의 물기를 관리하고 문틈과 방충망을 점검해요. 모기 예방을 위해 주변에 고인 물도 제거해요.',
      },
      {
        title: '살충제는 승인 여부 확인하기',
        body:
          '해당 해충에 사용할 수 있는 승인 제품인지 확인하고 제품에 표시된 사용법, 사용량, 주의사항을 따라요.',
      },
      {
        title: '빈대가 의심되면 별도로 대응하기',
        body:
          '침대와 매트리스 틈을 확인해요. 빈대가 발견되면 청소기 흡입과 적절한 고온 처리 등 물리적 방제를 우선하고, 침구나 매트리스에 살충제를 임의로 뿌리지 않아요.',
      },
      {
        title: '반복 발생하면 전문가에게 문의하기',
        body:
          '해충이 계속 발생하거나 여러 세대에서 발견된다면 관리실 또는 전문 방제업체에 상담을 요청해요.',
      },
    ],

    donts: [
      '종류를 모르는 벌레를 맨손으로 만지기',
      '음식물 쓰레기를 장기간 방치하기',
      '승인 여부나 용도를 확인하지 않고 살충제 사용하기',
      '살충제를 식품이나 조리도구에 직접 분사하기',
      '빈대 방제를 위해 훈증제나 연막탄을 임의로 사용하기',
      '침구나 매트리스에 살충제를 임의로 뿌리기',
    ],

    sources: [
      {
        organization: '질병관리청',
        title: '모기 물림 예방수칙',
        description:
          '방충망 정비, 모기장 사용, 모기 기피제 등 모기 예방 관련 안내',
        url: 'https://www.kdca.go.kr/kdca/2847/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGa2RjYSUyRjQxJTJGMzExNTI1JTJGYXJ0Y2xWaWV3LmRvJTNGcGFzc3dvcmQlM0QlMjZyZ3NCZ25kZVN0ciUzRCUyNmZpbmRPcG53cmQlM0QlMjZmaW5kV29yZCUzRCUyNmZpbmRUeXBlJTNEJTI2ZmluZENsU2VxJTNEJTI2cGFnZSUzRDElMjY%3D',
        verifiedAt: null,
      },
      {
        organization: '기후에너지환경부',
        title: '승인된 살생물제품 확인방법 안내',
        description:
          '살충제 등 승인된 살생물제품의 확인 방법과 유통 관련 안내',
        url: 'https://me.go.kr/m/mob/board/read.do?boardCategoryId=55&boardId=1873030&boardMasterId=39&maxIndexPages=10&maxPageItems=10&menuId=12&orgCd=&pagerOffset=0&searchKey=&searchValue=',
        verifiedAt: null,
      },
      {
        organization: '질병관리청',
        title: '가정 내 빈대 발견 시 방제 방법',
        description:
          '청소기·고온 처리, 살충제 사용 제한 등 빈대 방제 관련 안내',
        url: 'https://www.kdca.go.kr/bbs/kdca/49/246752/download.do',
        verifiedAt: null,
      },
    ],
  },

  // 8. 분실·도난
  lost: {
    summary:
      '카드, 휴대전화, 신분증, 집 열쇠 등을 잃어버렸다면 금전 피해와 개인정보 유출부터 막으세요. 단순 분실과 도난은 신고 목적이 다르므로 상황에 맞게 대응하세요.',

    call: null,

    steps: [
      {
        title: '카드 분실 시 즉시 사용 정지하기',
        body:
          '신용·체크카드를 잃어버렸다면 해당 카드사 앱이나 고객센터에서 즉시 분실 신고와 이용 정지를 신청하세요. 여러 장을 잃어버렸다면 카드 분실 일괄신고 서비스 이용 가능 여부도 확인하세요.',
      },
      {
        title: '휴대전화 위치 확인과 원격 잠금하기',
        body:
          '다른 기기에서 휴대전화 찾기 기능을 이용해 위치를 확인하고 원격 잠금이나 분실 모드를 설정하세요. 위험한 장소로 직접 찾아가지 말고, 통신사에 분실 신고 및 회선 정지를 문의하세요.',
      },
      {
        title: '신분증 분실 신고하기',
        body:
          '주민등록증을 잃어버렸다면 정부24 또는 주민센터에서 분실 신고를 진행하세요. 운전면허증 등 다른 신분증은 해당 발급기관의 분실 신고와 재발급 절차를 확인하세요.',
      },
      {
        title: '집 열쇠·도어락 보안 조치하기',
        body:
          '집 주소를 알 수 있는 물건과 함께 열쇠를 잃어버렸다면 출입 보안을 신속하게 점검하세요. 도어락 비밀번호를 변경하고 필요하면 열쇠나 잠금장치를 교체하세요. 임대주택이라면 집주인 또는 관리실과 협의하세요.',
      },
      {
        title: 'LOST112에서 습득물 조회하기',
        body:
          '경찰청 LOST112에서 습득물 정보를 검색하세요. 찾는 물건이 없다면 회원가입 후 온라인 분실물 신고를 하거나 가까운 경찰관서에 방문해 신고할 수 있어요.',
      },
      {
        title: '도난이 의심되면 경찰에 신고하기',
        body:
          '누군가 물건을 훔쳤다고 의심되거나 범죄 피해가 발생했다면 112 또는 가까운 경찰관서에 신고하세요. 사건 발생 시간과 장소, 관련 기록을 정리해 전달하세요.',
      },
      {
        title: '계정과 결제 내역 확인하기',
        body:
          '휴대전화나 지갑을 분실했다면 주요 계정의 로그인 기록과 카드 결제 내역을 확인하세요. 의심스러운 사용이 있다면 해당 서비스나 금융회사에 즉시 신고하고 필요한 보안 조치를 진행하세요.',
      },
    ],

    donts: [
      '카드 분실 신고를 미루기',
      '휴대전화 위치를 확인한 뒤 위험한 장소에 혼자 찾아가기',
      '신분증 분실을 장기간 방치하기',
      '집 주소와 함께 열쇠를 잃어버리고도 출입 보안을 점검하지 않기',
      '도난이 의심되는 상황에서 상대방에게 직접 맞서기',
      '분실한 기기의 계정과 결제 내역을 확인하지 않기',
    ],

    sources: [
      {
        organization: '경찰청',
        title: 'LOST112 습득물 조회',
        description:
          '분실한 물건이 경찰청에 습득물로 등록되었는지 검색하는 서비스',
        url: 'https://lost112.go.kr/find/findInfoList.do',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '경찰청',
        title: 'LOST112 분실물 신고절차',
        description:
          '온라인 분실 신고와 경찰관서 방문 신고 절차 안내',
        url: 'https://lost112.go.kr/html.do?html=%2Fprevent%2FlostDeclare&sub=F',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '정부24',
        title: '주민등록증 분실신고(철회)',
        description:
          '주민등록증 분실 신고의 신청 방법과 처리 절차 안내',
        url: 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13100000019&HighCtgCD=A01010&t=',
        verifiedAt: '2026-11-07',
      },
      {
        organization: '경찰청',
        title: '112신고포털',
        description:
          '물건 도난 등 범죄 피해가 발생했을 때 신고할 수 있는 경찰청 서비스',
        url: 'https://112.go.kr/',
        verifiedAt: null,
      },
      {
        organization: '금융감독원 안내 참고',
        title: '신용카드 분실·도난 대응 안내',
        description:
          '카드 분실 신고와 이용 정지에 관한 참고 자료. 신한카드에서 제공하는 PDF예요.',
        url: 'https://www.shinhancard.com/pconts/download/person/20200206605636.pdf',
        verifiedAt: null,
      },
    ],
  },

  // 9. 일반 안내
  general: {
    summary:
      '어떤 상황이든 안전 확인이 먼저예요. 아래 순서를 기억해 두세요.',

    call: {
      number: '119',
      label: '위급하면 먼저 신고',
    },

    steps: [
      {
        title: '나와 주변의 안전 확인하기',
        body: '위험하면 먼저 그 자리를 벗어나요.',
      },
      {
        title: '위급하면 119·112에 신고하기',
        body:
          '정확한 주소와 상황을 침착하게 말해요.',
      },
      {
        title: '관리실이나 집주인에게 알리기',
        body:
          '건물 설비 문제는 혼자 해결하려 하지 않아도 돼요.',
      },
      {
        title: '사진과 기록 남기기',
        body:
          '나중에 수리, 보험, 신고에 도움이 돼요.',
      },
    ],

    donts: [
      '혼자 무리해서 해결하려 하기',
    ],
  },
};

export const guideFooterNote =
  '상황별 안전 안내는 공식 자료와 대조하여 검증해야 합니다. 위급한 상황에서는 앱 안내보다 119·112 신고와 현장 구조대의 지시를 우선하세요.';
