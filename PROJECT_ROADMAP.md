# 🐾 Moca-ToTo Care 프로젝트 개선 로드맵 및 체크리스트

본 문서는 'Moca-ToTo Care(모카토토 케어)' 반려동물 케어 플랫폼의 상용화 수준 고도화를 위한 단계별 개발 체크리스트입니다.

---

## 📋 전체 개발 체크리스트

### [x] 1단계: 프론트엔드 - 백엔드 실제 API 비동기 연동 (Client-Server Sync)
- [x] 프론트엔드 API 통신 서비스 모듈 (`src/services/api.ts`) 구현
- [x] 반려동물 목록 및 현재 프로필 백엔드 동기화 (`GET /api/v1/pets`, `PATCH /api/v1/pets/:id`)
- [x] 터치 교감 인터랙션 및 행복도 지수 서버 실시간 갱신 (`POST /api/v1/pets/:id/happiness`)
- [x] 오늘의 기록(일일 체크리스트) 서버 CRUD 연동 (`GET/POST /api/v1/records/daily`)
- [x] 건강 & 병원 진료 기록 서버 연동 (`GET/POST /api/v1/records/health`)
- [x] 산책 시작/종료 및 Shapeify 경로 변환 서버 연동 (`POST /api/v1/walks/*`)
- [x] 우리 동네 장소 및 실시간 카테고리 필터링 서버 연동 (`GET /api/v1/places/nearby`)
- [x] Gemini AI 닥터 심리분석/케어팁 실시간 API 연동 (`POST /api/v1/ai/doctor-analyze`)
- [x] 비동기 데이터 로딩 상태 스켈레톤 및 서버 연결 상태 인디케이터 제공

---

### [x] 2단계: 사용자 인증 & 계정별 데이터 격리 (Auth & Multi-User)
- [x] JWT 기반 회원가입 / 로그인 / 토큰 갱신 API (`/api/v1/auth/*`)
- [x] 요청 헤더 Bearer 토큰 검증 미들웨어 구축 (`getAuthUser`)
- [x] 사용자 계정별 반려동물 데이터 분리 및 가족 초대(공동 양육자) 기능 (`AuthModal`, `FamilyShareModal`)

---

### [x] 3단계: Gemini AI 닥터 멀티모달(Vision) 분석 기능 고도화
- [x] 이상 변 사진 / 피부 상처 / 사료 성분표 이미지 업로드 UI 및 Base64 전송 처리
- [x] Gemini 3.7 Flash Multimodal Vision API를 활용한 시각 진단 및 긴급도(Triage: NORMAL/ATTENTION/URGENT) 판단
- [x] 수의사 전문 소견, 건강 점수(0~100), 맞춤 홈케어 실행 플랜 도출
- [x] AI 닥터 이전 상담 히스토리 보관 및 조회 (`GET /api/v1/ai/history/:petId`)

---

### [x] 4단계: 실시간 GPS 추적 및 지도(Map) 연동
- [x] Web Geolocation / Background Geolocation 실제 위도·경도 실시간 수집 및 가상 경로 시뮬레이션
- [x] 경로 스무딩(Douglas-Peucker 알고리즘) 및 Shapeify SVG 실시간 렌더링
- [x] 원본 노이즈 궤적 vs 보정 궤적 비교 및 테마별 인터랙티브 지도 뷰어 탑재 (`WalkTab.tsx`, `geoUtils.ts`)

---

### [x] 5단계: 데이터베이스 영속성 (PostgreSQL + PostGIS) & 클라우드 스토리지
- [x] PostgreSQL 16 + PostGIS 공간 데이터베이스 상용화 스키마 설계 (`src/db/schema.sql`)
- [x] 공간 LineString 궤적(산책로), GeoPoint(동네 장소), D-Day 예방접종 및 멀티모달 AI 진단 이력 영속화 모델링

---

### [x] 6단계: 모바일 네이티브(Flutter) 알림 및 오프라인 캐싱
- [x] D-Day 예방약(심장사상충, 광견병) 복용 로컬 푸시 알림 (`flutter_local_notifications` & Web Notification API)
- [x] 오프라인 산책 기록 및 일일 체크리스트 로컬 캐싱 엔진 (`Hive` Box 및 SharedPreferences)
- [x] Flutter 모바일 프로젝트 전체 코드 뷰어 및 다운로드 지원 (`FlutterCodeViewerModal.tsx`, `src/data/flutterCode.ts`)
