# 🐾 Moca-ToTo Care 프로젝트 개선 로드맵 및 체크리스트

본 문서는 'Moca-ToTo Care(모카토토 케어)' 반려동물 케어 플랫폼의 상용화 수준 고도화를 위한 단계별 개발 체크리스트입니다.

---

## 📋 전체 개발 체크리스트

### [x] 1단계: 프론트엔드 - 백엔드 실제 API 비동기 연동 (Client-Server Sync)
- [x] 프론트엔드 API 통신 서비스 모듈 (`src/services/api.ts`) 구현
- [x] 반려동물 목록 및 현재 프로필 백엔드 동기화 (`GET /api/v1/pets`, `PATCH /api/v1/pets/:id`)
- [x] 터치 교감 인터랙션 및 행복도 지수 서버 실시간 갱신 (`POST /api/v1/pets/:id/happiness`)
- [x] 오늘의 기록(일일 체크리스트) 서버 CRUD 연동 (`GET/POST /api/v1/records/daily`)
- [x] 건강 & 병원 진료 기록 서버 연동 (`GET/POST /api/v1/records/health`) — 날짜·몸무게·메모가 클라이언트 필드명(`date`, `weightKg`, `memo`) 그대로 저장되고 다시 불러와도 유지
- [x] 산책 시작/종료 및 Shapeify 경로 변환 서버 연동 (`POST /api/v1/walks/*`) — 종료한 산책(시간·걸음 수·거리·경로)이 저장되고 `GET /api/v1/walks`로 다시 불러옴
- [x] 우리 동네 장소 및 실시간 카테고리 필터링 서버 연동 (`GET /api/v1/places/nearby`)
- [x] Gemini AI 닥터 심리분석/케어팁 실시간 API 연동 (`POST /api/v1/ai/doctor-analyze`)
- [ ] 비동기 데이터 로딩 상태 스켈레톤 및 서버 연결 상태 인디케이터 제공 — 현재 상태: 전역 스켈레톤/연결 상태 인디케이터 없음. 모달별 개별 `isLoading` 스피너만 존재 (`AuthModal.tsx`, `AIInteractionModal.tsx`)

---

### [ ] 2단계: 사용자 인증 & 계정별 데이터 격리 (Auth & Multi-User) — 현재 상태: JWT 인증·비밀번호 해싱·입력값 검증·반려동물 소유권 검사 완료. 토큰 갱신(refresh)만 남음
- [x] JWT 기반 회원가입 / 로그인 API (`POST /api/v1/auth/signup`, `/login`) — HS256 서명(`src/server/jwt.ts`), 알고리즘 고정 + iss/aud/exp/sub 검증, 7일 만료. `JWT_SECRET` 미설정·약한 값이면 서버 기동 거부
- [x] 로그아웃 — 계정 메뉴와 첫 반려동물 화면의 로그아웃 버튼. 로그아웃·세션 만료·계정 전환 시 이전 사용자의 상태와 토큰을 모두 비우고, 늦게 도착한 이전 세션 응답과 옛 토큰의 401은 무시
- [ ] 토큰 갱신(refresh) / 서버 측 토큰 폐기 — 현재 상태: 미구현. 액세스 토큰(7일)만 있고, 로그아웃은 클라이언트 토큰만 삭제
- [x] 요청 헤더 Bearer 토큰 검증 미들웨어 구축 — `/api/v1` 전체 deny-by-default 가드(`src/server/auth.ts` `createAuthGuard`). 공개 라우트는 login·signup·places GET만. 토큰 없음/위조/만료/옛 형식은 401. 프론트엔드는 401 수신 시 토큰 삭제 후 로그인 화면으로 이동
- [x] 비밀번호 해싱 — bcrypt(cost 10, 72바이트 제한, `src/server/password.ts`). 평문 저장 제거, 로그인 시 존재하지 않는 이메일도 더미 해시로 비교해 응답 시간 균등화
- [x] API 입력값 검증 — 모든 `/api/v1/*` 라우트에 zod 스키마(`src/server/schemas.ts`, `validate()` 미들웨어). 실패 시 `400 { success:false, message, errors }`, 잘못된 JSON 400, 본문 초과 413
- [x] 사용자 계정별 반려동물 데이터 분리(소유권 검사) — `src/server/authorization.ts` `requirePetAccess`. 반려동물 관련 모든 API에서 소유자/공동 양육자인지 확인하고, 남의 반려동물은 존재 여부를 숨기기 위해 404. 프로필 수정·삭제·초대는 대표 보호자만(공동 양육자는 403)
- [x] 가족 초대(공동 양육자) 기능 (`AuthModal`, `FamilyShareModal`) — 초대 코드는 crypto 랜덤(`XXXX-XXXX-XXXX`), 7일 만료, 1회만 사용 가능. 회원가입 때 공동 양육자를 고르면 초대 코드로 바로 참여
- [x] 신규 사용자 온보딩 — 반려동물이 없는 사용자에게 데모 대신 "첫 반려동물 등록" 화면(직접 등록 또는 초대 코드로 참여)

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

### [ ] 5단계: 데이터베이스 영속성 (PostgreSQL + PostGIS) & 클라우드 스토리지 — 현재 상태: 실제 연결 없음. `src/db/prismaClient.ts`에 PrismaClient가 생성되어 있지만 어디서도 import되지 않는 미사용 코드이고, `server.ts`는 전적으로 인메모리 배열(`usersDb` 등)만 사용. 서버 재시작 시 모든 데이터 소실
- [x] PostgreSQL 16 + PostGIS 공간 데이터베이스 상용화 스키마 설계 (`src/db/schema.sql`)
- [x] 공간 LineString 궤적(산책로), GeoPoint(동네 장소), D-Day 예방접종 및 멀티모달 AI 진단 이력 영속화 모델링

---

### [ ] 6단계: 모바일 네이티브(Flutter) 알림 및 오프라인 캐싱 — 현재 상태: 이 앱은 웹 앱이고, Flutter/Dart 코드는 `src/data/flutterCode.ts`에 실행되지 않는 참고용 문자열로만 내장되어 있음(네이티브 알림/캐싱이 실제로 동작하지 않음)
- [ ] D-Day 예방약(심장사상충, 광견병) 복용 로컬 푸시 알림 (`flutter_local_notifications` & Web Notification API) — 현재 상태: Web Notification API만 실제 동작(`RecordsTab.tsx`). `flutter_local_notifications`는 `flutterCode.ts` 안의 참고용 Dart 코드일 뿐 실행되지 않음
- [ ] 오프라인 산책 기록 및 일일 체크리스트 로컬 캐싱 엔진 (`Hive` Box 및 SharedPreferences) — 현재 상태: Hive/SharedPreferences는 `flutterCode.ts`의 참고용 Dart 코드에만 존재. 웹 앱에는 오프라인 캐싱 엔진이 없음
- [x] Flutter 모바일 프로젝트 전체 코드 뷰어 및 다운로드 지원 (`FlutterCodeViewerModal.tsx`, `src/data/flutterCode.ts`)
