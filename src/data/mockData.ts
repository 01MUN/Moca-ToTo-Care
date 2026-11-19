import { PetProfile, ThemeOption, RecordItem, HealthRecord, WalkSession, CommunityPlace } from '../types';
import mocaImg from '../assets/images/moca_pet_avatar_1785058401579.jpg';
import totoImg from '../assets/images/toto_pet_avatar_1785058414444.jpg';

export const INITIAL_PETS: PetProfile[] = [
  {
    id: 'pet-moca',
    name: '모카 (Moca)',
    breed: '토이푸들 🐾',
    age: '2살 4개월',
    weightKg: 3.8,
    avatarUrl: mocaImg,
    happiness: 88,
    favoriteFood: '연어 고구마 트릿',
    birthday: '2024.03.15',
  },
  {
    id: 'pet-toto',
    name: '토토 (ToTo)',
    breed: '말티즈 🐶',
    age: '3살 1개월',
    weightKg: 2.9,
    avatarUrl: totoImg,
    happiness: 94,
    favoriteFood: '닭가슴살 츄르',
    birthday: '2023.06.20',
  }
];

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'forest',
    name: '🌲 숲속 산책 테마',
    description: '싱그러운 피톤치드와 따스한 햇살 느낌의 초록 테마',
    bgGradient: 'from-[#EBF4EC] via-[#F4F8F3] to-[#FDF8F0]',
    cardBg: 'bg-white/90 shadow-sm border-emerald-100',
    textColor: 'text-[#1E3A2B]',
    subTextColor: 'text-[#476B58]',
    accentColor: '#2E6F40',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    ambientPattern: 'leaves',
  },
  {
    id: 'living',
    name: '🛋️ 아늑한 거실 테마 (기본)',
    description: '따뜻한 모카라운지 온기와 베이지 감성의 시그니처 테마',
    bgGradient: 'from-[#FAF2E8] via-[#FDF8F0] to-[#F5EBE0]',
    cardBg: 'bg-white/95 shadow-sm border-[#EFE3D5]',
    textColor: 'text-[#3D2C1E]',
    subTextColor: 'text-[#7C6350]',
    accentColor: '#8B5E3C',
    badgeBg: 'bg-[#F2E3D5] text-[#8B5E3C]',
    ambientPattern: 'warmth',
  },
  {
    id: 'sunset',
    name: '🌅 몽환의 노을 테마',
    description: '노을빛 로맨틱 오렌지 피치와 감성 가득한 일몰 테마',
    bgGradient: 'from-[#FFF0EC] via-[#FDF3EE] to-[#FFF8F5]',
    cardBg: 'bg-white/90 shadow-sm border-orange-100',
    textColor: 'text-[#4A2619]',
    subTextColor: 'text-[#8C523D]',
    accentColor: '#D96B43',
    badgeBg: 'bg-orange-100 text-orange-800',
    ambientPattern: 'sunset',
  },
  {
    id: 'starry',
    name: '🌌 별빛 밤 테마',
    description: '고요하고 평온하게 꿀잠 자는 밤하늘 감성 테마',
    bgGradient: 'from-[#1A2238] via-[#232D48] to-[#2D3958]',
    cardBg: 'bg-[#25314C]/90 shadow-md border-indigo-900/50 text-slate-100',
    textColor: 'text-slate-100',
    subTextColor: 'text-slate-300',
    accentColor: '#A78BFA',
    badgeBg: 'bg-indigo-950/80 text-indigo-200 border border-indigo-700/40',
    ambientPattern: 'stars',
  },
];

export const INITIAL_DAILY_RECORDS: RecordItem[] = [
  {
    id: 'rec-1',
    time: '오전 08:30',
    category: 'food',
    title: '아침 사료 급여',
    detail: '유기농 연어 사료 60g + 영양제 1스쿱',
    completed: true,
  },
  {
    id: 'rec-2',
    time: '오전 10:15',
    category: 'water',
    title: '음수량 체크',
    detail: '신선한 음수 180ml 섭취 완료',
    completed: true,
  },
  {
    id: 'rec-3',
    time: '오후 01:20',
    category: 'poop',
    title: '배변 상태 확인',
    detail: '황금색 정상 배변 (건강도 매우 좋음 👍)',
    completed: true,
  },
  {
    id: 'rec-4',
    time: '오후 07:00',
    category: 'medication',
    title: '심장사상충 약 복용',
    detail: '하트가드 1정 복용 예정',
    completed: false,
  },
  {
    id: 'rec-5',
    time: '오후 08:30',
    category: 'snack',
    title: '저녁 간식 & 덴탈껌',
    detail: '치석 제거용 덴탈 스틱 1개',
    completed: false,
  },
];

export const INITIAL_HEALTH_RECORDS: HealthRecord[] = [
  {
    id: 'hlth-1',
    date: '2026.07.12',
    hospitalName: '24시 센트럴동물메디컬센터',
    doctorName: '김민준 수의사',
    category: 'checkup',
    diagnosis: '정기 건강검진 및 슬개골 상태점검 (양호)',
    prescription: '슬개골 영양제 30일분',
    weightKg: 3.8,
    cost: 125000,
    memo: '좌측 슬개골 1기 소견 있으나 정상 범위. 미끄럼 방지 매트 사용 권장',
  },
  {
    id: 'hlth-2',
    date: '2026.05.20',
    hospitalName: '아리랑 동네동물병원',
    doctorName: '박서연 원장',
    category: 'vaccine',
    diagnosis: '광견병 예방접종 & 종합백신(DHPP) 5차',
    prescription: '접종 후 30분 관찰 후 귀가',
    weightKg: 3.75,
    cost: 45000,
    memo: '주사 맞을 때 얌전히 잘 참음! 우등생 모카 칭찬받음 🌟',
  },
  {
    id: 'hlth-3',
    date: '2026.02.14',
    hospitalName: '24시 센트럴동물메디컬센터',
    doctorName: '김민준 수의사',
    category: 'dental',
    diagnosis: '치석 스케일링 & 잇몸 관리 케어',
    prescription: '잇몸 소독 가글액',
    weightKg: 3.65,
    cost: 180000,
    memo: '스케일링 깨끗하게 완료. 매일 저녁 치약 칫솔질 지속 권장',
  },
];

export const INITIAL_WALK_SESSIONS: WalkSession[] = [
  {
    id: 'walk-1',
    date: '오늘 오후 04:30',
    timeAgo: '방금 전',
    durationMinutes: 28,
    distanceKm: 1.85,
    calories: 142,
    stepCount: 3420,
    rawPath: [
      { x: 20, y: 80 }, { x: 35, y: 65 }, { x: 50, y: 70 },
      { x: 65, y: 40 }, { x: 80, y: 55 }, { x: 70, y: 85 },
      { x: 45, y: 90 }, { x: 20, y: 80 }
    ],
    shapeType: 'paw',
    weather: '☀️ 24°C 맑음',
    note: '동네 공원 산책길에서 친구 "마루" 만나서 신나게 킁킁 인사함! 🐾',
  },
  {
    id: 'walk-2',
    date: '어제 오전 10:15',
    timeAgo: '1일 전',
    durationMinutes: 35,
    distanceKm: 2.3,
    calories: 178,
    stepCount: 4210,
    rawPath: [
      { x: 30, y: 30 }, { x: 50, y: 20 }, { x: 70, y: 30 },
      { x: 80, y: 60 }, { x: 50, y: 85 }, { x: 20, y: 60 }
    ],
    shapeType: 'heart',
    weather: '⛅ 22°C 구름조금',
    note: '하천변 따라 걸으며 모양 만들기 도전! 예쁜 하트 모양 완성 ❤️',
  },
];

export const INITIAL_COMMUNITY_PLACES: CommunityPlace[] = [
  {
    id: 'place-1',
    name: '24시 센트럴동물메디컬센터',
    category: 'hospital',
    rating: 4.9,
    reviewCount: 238,
    distanceMeter: 320,
    address: '서울 강남구 학동로 142 1~2층',
    phone: '02-540-7582',
    tags: ['24시간응급', '슬개골전문', '주차가능', '친절한원장님'],
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    lat: 38,
    lng: 42,
    is24h: true,
    isOpenNow: true,
    reviews: [
      {
        id: 'rev-1',
        author: '초코마미',
        petName: '초코 (푸들)',
        avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '2026.07.20',
        content: '야간 응급으로 방문했는데 수의사 선생님이 너무 친절하고 꼼꼼하게 설명해주셔서 감동받았습니다. 과잉진료 전혀 없어요!',
        tags: ['24시야간', '과잉진료없음', '친절함']
      },
      {
        id: 'rev-2',
        author: '해피아빠',
        petName: '해피 (골든리트리버)',
        avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '2026.07.15',
        content: '슬개골 수술 전문이라 수소문 끝에 방문했는데 경과가 너무 좋아요. 시설도 청결하고 엑스레이 상세 설명도 명확합니다.',
        tags: ['슬개골전문', '시설깨끗']
      }
    ]
  },
  {
    id: 'place-2',
    name: '카페 퍼피라떼 (Pet-Friendly)',
    category: 'cafe',
    rating: 4.8,
    reviewCount: 174,
    distanceMeter: 480,
    address: '서울 강남구 도산대로 215 1층',
    phone: '02-512-3392',
    tags: ['애견동반', '멍푸치노판매', '잔디테라스', '포토존'],
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    lat: 58,
    lng: 65,
    isOpenNow: true,
    reviews: [
      {
        id: 'rev-3',
        author: '모카보호자',
        petName: '모카 (푸들)',
        avatarUrl: mocaImg,
        rating: 5,
        date: '2026.07.22',
        content: '모카가 멍푸치노 한 그릇 뚝딱 원샷했어요! 잔디 마당이 잘 갖춰져 있어 안심하고 줄 놓아줄 수 있어요.',
        tags: ['멍푸치노맛집', '잔디마당']
      }
    ]
  },
  {
    id: 'place-3',
    name: '도산공원 반려견 쉼터 산책로',
    category: 'park',
    rating: 4.9,
    reviewCount: 412,
    distanceMeter: 650,
    address: '서울 강남구 도산대로45길 20',
    phone: '02-3423-6250',
    tags: ['배변봉투수거함', '음수대', '넓은산책로', '멍친구많음'],
    imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
    lat: 25,
    lng: 78,
    isOpenNow: true,
    reviews: [
      {
        id: 'rev-4',
        author: '보리누나',
        petName: '보리 (비숑)',
        avatarUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '2026.07.24',
        content: '저녁 시간에 동네 강아지 친구들이 많이 나와서 사회성 키우기 딱 좋아요! 조명도 밝아 안심 산책 가능.',
        tags: ['동네멍친구', '야간산책기분짱']
      }
    ]
  },
  {
    id: 'place-4',
    name: '몽몽스파 펫아틀리에 (프리미엄 미용)',
    category: 'grooming',
    rating: 4.7,
    reviewCount: 95,
    distanceMeter: 820,
    address: '서울 강남구 압구정로 310',
    phone: '02-544-9008',
    tags: ['탄산스파', '가위컷전문', '스트레스최소화', 'CCTV공개'],
    imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80',
    lat: 72,
    lng: 30,
    isOpenNow: true,
    reviews: [
      {
        id: 'rev-5',
        author: '두부맘',
        petName: '두부 (말티푸)',
        avatarUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '2026.07.18',
        content: '가위컷 섬세하게 너무 예쁘게 해주시고, 스트레스 안 받게 중간중간 놀아주셔서 미용 후에도 밝았어요!',
        tags: ['곰돌이컷명가', '친절보스']
      }
    ]
  }
];
