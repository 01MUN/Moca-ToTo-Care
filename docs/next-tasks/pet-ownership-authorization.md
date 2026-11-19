# 다음 작업: 반려동물 소유권(인가) 검사

> **상태 (2026-11-19): 소유권 검사 완료.** `feat/pet-ownership`에서 구현했습니다 (`src/server/authorization.ts`, 테스트 `src/server/ownership.test.ts`).
> 아래 "검사가 필요한 라우트" 표는 모두 처리되었습니다. 단, `family/join`의 초대 코드 만료와 추측 가능한 코드 형식은 아직 남아 있습니다.
> 남은 작업은 "이번 작업 중 발견한 기존 문제", "보안 리뷰에서 남은 LOW 항목", 맨 아래 "코드 리뷰 MEDIUM 이하"입니다.

> 다음 세션에서 이렇게 시작하면 됩니다:
> `/ecc:plan docs/next-tasks/pet-ownership-authorization.md`
>
> 작성: 2026-11-19, `feat/jwt-auth-validation` 브랜치 작업 직후.
> JWT 인증(누가 요청했는가)은 끝났지만, 인가(이 사용자가 이 반려동물을 다뤄도 되는가)는 아직 없습니다.

## 현재 상태

- 모든 보호 라우트는 유효한 JWT를 요구하고, `getAuthUser(res)`로 요청한 사용자를 알 수 있습니다 (`src/server/auth.ts`).
- 하지만 `petId`를 받는 라우트는 **그 반려동물이 요청자의 것인지 확인하지 않습니다**. 로그인만 하면 누구든 남의 반려동물을 조회하거나 수정할 수 있습니다.
- 소유 관계 데이터는 이미 있습니다: `UserRecord.ownedPetIds`, `UserRecord.sharedPetIds` (`src/server/store.ts`).

## 검사가 필요한 라우트

| 라우트 | 현재 동작 | 필요한 검사 |
|---|---|---|
| `GET /pets` | 사용자 반려동물이 0마리면 **`petsDb.slice(0, 2)`(u1의 모카/토토)를 반환** | 빈 배열 반환. 이건 정보 노출이라 최우선 |
| `PATCH /pets/:petId` | 아무 반려동물이나 수정 가능 | owner만(또는 owner + co_parent 중 허용 필드만) |
| `GET /pets/:petId/dashboard` | 없는 petId면 `petsDb[0]`을 반환 | 접근 권한 확인 + 없으면 404 |
| `POST /pets/:petId/happiness` | 누구나 가능 | owned 또는 shared |
| `GET /records/daily`, `/records/health` | `petId`가 없으면 **전체 사용자 기록** 반환 | 내 반려동물 기록만 필터링, 남의 `petId`면 403 |
| `POST /records/daily`, `/records/health` | `petId`가 없으면 `'p1'`이 기본값 | `petId` 필수 + 권한 확인 |
| `POST /walks/start`, `/walks/end`, `/walks/:walkId/shapeify` | `petId`가 없으면 `'p1'`, walk 소유자 확인 없음 | 산책 기록에 userId 저장, 소유자 확인 |
| `GET /ai/history/:petId`, `POST /ai/doctor-analyze` | 누구나 조회 가능, `petId`가 없으면 `'p1'` | owned 또는 shared |
| `POST /auth/family/invite` | **남의 petId로도 초대 코드 발급 가능** | owner만 |
| `POST /auth/family/join` | 초대 코드만 맞으면 됨. `expiresAt`은 확인하지 않음 | 만료 확인. 코드 형식(`이름-4자리`)이 추측 가능하니 랜덤 코드로 교체 검토 |

## 제안 방향 (계획 단계에서 확정)

- `src/server/authorization.ts`에 `canAccessPet(user, petId, level: 'read' | 'write' | 'owner')`와 미들웨어 `requirePetAccess(level, from: 'params' | 'query' | 'body')`를 둡니다.
- 거부할 때 응답: `403 { success:false, message }`. 존재 여부를 숨기려면 404로 통일할지도 결정합니다.
- 공동 양육자(co_parent) 권한 범위(기록 작성 O, 반려동물 프로필 수정 X 등)는 사용자 확인이 필요합니다.
- 테스트: `src/server/app.test.ts` 패턴(`createApp({ jwtSecret, store })` + `startTestServer`)을 따릅니다. u3 토큰으로 p1에 접근하면 403이어야 합니다.

## 이번 작업 중 발견한 기존 문제 (같이 다루거나 별도 작업으로)

1. **클라이언트와 서버의 필드명 불일치**: 클라이언트는 `HealthRecord`를 `{ date, weightKg, memo }`로, `WalkSession`을 `{ durationMinutes, stepCount, rawPath }`로 보내고, 서버는 `visitDate`, `weightAtVisit`, `durationSeconds`, `steps`, `coordinates`를 기대합니다. 지금은 schema가 모르는 필드를 제거하고 서버 기본값이 들어가서, **사용자가 입력한 날짜와 체중이 저장되지 않습니다**.
2. **회원가입 화면의 역할 선택**: `AuthModal`에서 "공동 양육자"를 고를 수 있지만, 서버는 이제 항상 `owner`로 가입시킵니다. 공동 양육은 초대 코드로만 가능하므로 UI 선택지를 없애거나 문구를 바꿔야 합니다.
3. **새 사용자의 빈 반려동물 목록**: 반려동물이 없는 신규 가입자에게는 `App.tsx` 초기값(`INITIAL_PETS`)이 그대로 보입니다. 화면 곳곳이 `pets[0]`이 있다고 가정하고 있어서, "첫 반려동물 등록" 빈 상태 화면이 필요합니다.
4. **오프라인 데모 모드 상실**: 로그인 없이 목업 데이터로 둘러보던 흐름은 의도적으로 없앴습니다. 데모가 필요하면 "데모 계정으로 둘러보기" 버튼(실제 로그인)으로 대체를 검토합니다.
5. **보안 후속 과제**: 로그인 rate limiting(brute-force 방지), refresh token과 로그아웃 시 토큰 폐기, 비밀번호 변경 시 기존 토큰 무효화(`tokenVersion` 클레임).

## 보안 리뷰에서 남은 LOW 항목 (2026-11-19 security-reviewer)

MEDIUM(사용자 ID 충돌, 지금은 `u_<uuid>`로 해결), 공개 auth 라우트 본문 제한(16kb), 최종 JSON 500 핸들러는 이 브랜치에서 이미 고쳤습니다. 아래는 아직 남아 있습니다.

- **회원가입으로 이메일 존재 여부 노출**: 이미 가입된 이메일이면 409를 bcrypt 없이 바로 반환합니다(상태 코드와 응답 시간 차이). 일반적으로 감수하는 트레이드오프이지만, 줄이려면 해싱을 중복 확인보다 먼저 하거나 이메일 인증 흐름을 도입합니다.
- **AI 라우트 500 응답이 내부 메시지를 노출**: `src/server/routes/ai.ts`가 `error: err.message`(Gemini SDK 에러)를 그대로 반환합니다. 고정 메시지와 `message` 필드로 바꾸고, 상세 내용은 서버 로그에만 남깁니다.
- **JWT_SECRET 강도는 길이로만 검사**: `aaaa…`(32자)도 통과합니다. 최소 엔트로피(고유 문자 수 등) 검사를 추가할지 검토합니다.

## 코드 리뷰 MEDIUM 이하 (2026-11-19 code-reviewer, feat/jwt-auth-validation 대상)

CRITICAL/HIGH는 없었습니다. 아래는 고치지 않고 목록만 남깁니다.

| 심각도 | 위치 | 내용 | 제안 |
|---|---|---|---|
| MEDIUM | `src/App.tsx` `applySession` | 계정이 바뀌어도(401 후 재로그인) 이전 사용자의 `pets`/기록/`currentPetId`가 화면에 남음. 로그아웃 UI도 없음 | 401과 로그인 시 상태 초기화, 로그아웃 버튼 추가 |
| MEDIUM | `src/services/api.ts` `handleSessionExpired` | 옛 토큰으로 보낸 요청의 늦은 401이 새로 로그인한 토큰까지 지움 | 요청 시점 토큰과 현재 토큰이 같을 때만 세션 만료 처리 |
| MEDIUM | `src/server/app.ts` | 로그인 사용자가 없는 `/api/v1/*` 경로를 호출하면 JSON이 아닌 HTML 404(운영에선 index.html 200) | `/api/v1` JSON 404 핸들러 추가 |
| MEDIUM | 테스트 | `App.tsx` 로그인 게이트/세션 만료 전환에 대한 UI 테스트 없음 | jsdom + Testing Library 테스트 |
| LOW | `src/components/AuthModal.tsx` | 로그인 성공 후 500ms `setTimeout`에 정리(cleanup) 없음 | `onLoginSuccess` 즉시 호출 |
| LOW | `src/services/api.ts` `signup` | 서버가 무시하는 `role`을 계속 전송 | 시그니처에서 제거 |
| LOW | `src/services/api.ts` | 401 메시지를 서버 문구로 덮어씀 (현재 동일 문구라 무해) | — |
