# Fluffy Days(모카토토 케어) 디자인 방향 분석

이 문서는 현재 코드베이스 상태를 근거로 앞으로 이 프로젝트에 어떤 디자인 접근과 도구가 필요한지 정리한 자료입니다.

## 1. 프로젝트 성격 요약 (근거)

- **목적**: 반려동물(주로 소형견) 케어를 위한 AI 동반 앱. 데일리 체크리스트, 건강/병원 기록, 산책 GPS 트래킹, AI 사진 진단, 동네 장소 지도, 가족 공동육아 공유 기능을 제공 ([metadata.json](metadata.json), [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md)).
- **타겟 사용자**: 반려견 보호자 및 공동 양육자(가족). UI 문구가 전량 한국어이고 "모카맘", "코코아빠" 같은 실제 가정을 연상시키는 목데이터를 사용 — 감성적/양육 커뮤니티 톤 ([server.ts:39-73](server.ts#L39-L73)).
- **플랫폼**: 현재는 **모바일 프레임을 시뮬레이션하는 웹 앱**입니다. `MobileFrameWrapper.tsx`가 전체 화면을 아이폰/안드로이드 목업 프레임 안에 렌더링하고, 실제 네이티브 Flutter 소스는 문자열 데이터로만 존재해 뷰어로 보여줄 뿐입니다 ([src/components/MobileFrameWrapper.tsx](src/components/MobileFrameWrapper.tsx), [src/data/flutterCode.ts](src/data/flutterCode.ts)). 즉, 지금 당장은 **웹(모바일 웹 우선) 프로덕트**이고, Flutter 네이티브 포팅은 로드맵상의 미래 단계입니다.
- **현재 UI 상태**: 4종 "무드 테마"(숲속/거실/노을/별빛)가 존재하지만, 색상 값이 `ThemeOption` 객체 하나에 하드코딩된 헥스 코드와 Tailwind 임의값(`bg-[#181825]`, `text-[#3D2C1E]` 등)으로 컴포넌트별로 흩어져 있습니다 ([src/data/mockData.ts:30-70](src/data/mockData.ts#L30), [src/types.ts](src/types.ts)). 별도의 디자인 토큰 파일이나 `tailwind.config`의 theme 확장은 없고, `@import "tailwindcss";` 한 줄만 존재합니다 ([src/index.css](src/index.css)). 접근성(대비, 포커스 상태, ARIA)에 대한 명시적 처리도 코드에서 보이지 않습니다.
- **비주얼 자산**: 픽셀아트 펫 생성 엔진(`pixelEngine.ts`, `kawaiiPixelEngine.ts`)과 캔버스 컨페티 등 캐주얼/귀여운 톤의 마이크로 인터랙션이 이미 구현되어 있습니다.

## 2. 필요한 디자인 접근 방식

**"감성 중심 모바일 라이프스타일 앱" 디자인** 접근이 적합합니다. 데이터 중심 대시보드나 브랜드 마케팅 페이지가 아니라, 다음 성격을 동시에 가진 하이브리드입니다.

- **모바일 네이티브급 UI/UX**: `MobileFrameWrapper`로 모바일 폼팩터를 강제하고 있으므로, 터치 타겟 크기, 하단 탭바 내비게이션(`BottomNav.tsx`), 제스처/애니메이션 디테일 등 네이티브 앱 수준의 완성도가 필요합니다.
- **테마/감성 기반 비주얼 시스템**: 4개의 무드 테마가 핵심 차별화 요소이므로, 색상·타이포·일러스트(픽셀아트 펫)가 일관되게 확장 가능한 구조로 정리되어야 합니다.
- **가벼운 데이터 표시**: 건강기록, 산책 통계, D-Day 알림 등 정보성 화면이 있지만 복잡한 분석 대시보드는 아니므로, "정보형 카드 UI" 수준의 접근이면 충분합니다.

## 3. 적합한 디자인 도구·플러그인 후보

| 후보 | 필요 이유 | 근거 |
|---|---|---|
| **디자인 토큰/테마 관리 (Tailwind theme 확장 또는 별도 tokens.ts)** | 현재 색상값이 컴포넌트마다 하드코딩되어 있어 4개 테마를 늘리거나 다크모드를 추가하기 어렵습니다. 토큰화하면 테마 추가·유지보수 비용이 크게 줄어듭니다. | [src/data/mockData.ts](src/data/mockData.ts), `tailwind.config` 부재 |
| **Figma 연동 (Figma MCP/Dev Mode 등)** | 디자이너가 있다면 4개 테마 무드보드·픽셀아트 스타일 가이드를 Figma에서 관리하고 코드로 동기화하는 게 효율적입니다. 다만 현재 저장소에 Figma 파일/링크 흔적이 전혀 없어, 디자이너 협업 여부부터 확인이 필요합니다. | 저장소 내 Figma 관련 파일/설정 없음 (확인 필요) |
| **접근성 감사 도구 (axe-core, Lighthouse a11y, eslint-plugin-jsx-a11y)** | 반려동물 보호자 중에는 다양한 연령대가 있고, 하드코딩된 커스텀 색상 조합이 많아 명도 대비 문제가 발생하기 쉽습니다. 현재 ARIA/포커스 처리가 코드에서 확인되지 않아 우선 점검이 필요합니다. | ESLint 설정 자체가 없음, `.eslintrc` 부재 |
| **아이콘/일러스트 관리 (lucide-react는 이미 사용 중, 픽셀아트 에셋 파이프라인 정리)** | 현재 아이콘은 `lucide-react`로 통일되어 있어 양호하지만, 픽셀아트 펫 이미지(`src/assets/images/*.jpg`)는 소스가 낱개 파일로만 존재해 생성 규칙/네이밍이 불명확합니다. 에셋 생성 파이프라인 문서화가 필요합니다. | [src/assets/images/](src/assets/images/), `pixelEngine.ts` |
| **디자인 시스템 컴포넌트 문서화 (Storybook 등)** | 모달이 6종(Auth, FamilyShare, AI Interaction, PixelPet, ThemeSelector, FlutterCodeViewer), 탭이 4종으로 이미 화면 수가 많아, 컴포넌트를 독립적으로 확인/재사용할 도구가 있으면 향후 확장(테마 추가, 신규 탭)이 수월합니다. | [src/components/](src/components/) 내 모달/탭 개수 |
| **Flutter 디자인 동기화 도구** | 로드맵 6단계가 실제 Flutter 네이티브 앱 전환을 목표로 하므로, 장기적으로는 웹과 Flutter 간 디자인 토큰을 공유할 방법(예: Style Dictionary)이 필요합니다. | [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) 6단계, [src/data/flutterCode.ts](src/data/flutterCode.ts) |

## 4. 우선순위

### 지금 당장 (Now)
1. **색상/테마 토큰화** — 4개 테마의 하드코딩된 값을 중앙 토큰(Tailwind `theme.extend` 또는 `tokens.ts`)으로 옮기기. 지금 컴포넌트 수가 적을 때 정리해야 비용이 낮습니다.
2. **접근성 기초 점검** — 명도 대비, 포커스 스타일, 폼(로그인/가족초대) 라벨링 등 최소한의 a11y 린트(`eslint-plugin-jsx-a11y`)와 Lighthouse 점검. 현재 ESLint 자체가 없어 진입장벽이 낮은 항목부터 시작 권장.
3. **에셋 파이프라인/네이밍 규칙 정리** — 픽셀아트 생성 결과물과 아바타 이미지의 저장 규칙 문서화.

### 나중에 고려 (Later)
1. **Figma 연동** — 실제 디자이너가 합류하거나 비주얼 리뉴얼이 계획될 때 도입. 지금은 코드가 곧 디자인 소스인 상태라 우선순위가 낮습니다.
2. **Storybook 등 컴포넌트 문서화 도구** — 화면 수가 더 늘어나 팀 협업이 필요해질 시점에 도입.
3. **웹-Flutter 디자인 토큰 공유 체계** — 로드맵상 네이티브 전환이 실제로 착수되는 시점(6단계 실질 구현)에 맞춰 검토.

## 5. 확인이 필요한 전제

- 별도 디자이너/디자인 팀이 있는지, Figma 등 외부 디자인 소스가 이미 존재하는지 저장소만으로는 알 수 없습니다.
- 다크 모드 지원 계획 여부 (현재 4개 테마는 모두 라이트 톤).
- Flutter 네이티브 전환의 실제 착수 시점 (로드맵에는 체크되어 있으나 코드는 문자열 데이터 뷰어 수준).
