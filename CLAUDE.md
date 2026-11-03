# PeakGuide

한국 산 정보 PWA. 빌드 없는 정적 사이트.

## 응답 규칙
- 한국어로, 간결하게. 결론 먼저, 설명은 필요한 만큼만.
- 코드 위치는 `파일:줄번호`로 짚을 것.

## 배포
- `main`에 push → Vercel 자동 배포(프로덕션). push = 실서비스 반영이므로 push 전 사용자 확인.
- 빌드·테스트 단계 없음. `index.html`이 그대로 서비스됨.
- `origin/master`는 옛 브랜치(main의 조상). 작업 대상 아님.

## 구조
- `index.html` — 앱 전체(HTML·CSS·JS 한 파일, 약 1.1MB/17,000줄). Leaflet CSS 등 라이브러리도 인라인.
  - 파일이 크므로 통째로 읽지 말고 Grep으로 위치를 찾은 뒤 해당 범위만 읽기.
  - 서비스워커는 이 파일 안의 문자열을 Blob URL로 등록함(`serviceWorker.register` 검색).
  - 사용자·즐겨찾기·설정은 `localStorage`의 `pg_*` 키에 저장(서버 없음).
- `import_mountains.js` — 산림청 OpenAPI에서 산 데이터를 받아오는 Node 스크립트(일회성 데이터 생성용).
- `api_mountains.json`, `test_response.xml` — 위 스크립트의 출력/샘플.

## 모바일 우선
- 기준 화면은 모바일. 데스크톱은 깨지지만 않으면 됨.
- **카카오톡 인앱 웹뷰**(UA에 `KAKAOTALK`)와 Android WebView에서 반드시 동작해야 함. 과거 버그 다수가 여기서 발생:
  - 한글 IME 입력 → 검색창은 `contenteditable` div로 구현됨. 일반 `<input>`으로 되돌리지 말 것.
  - 터치 이벤트 → `click`만 믿지 말고 `touchend` 처리 확인.
- 노치 대응(`viewport-fit=cover`, safe-area) 유지.
- 수정 후 카톡 웹뷰/Android에서 깨질 만한 API(최신 CSS·JS 문법, `position: fixed` + 키보드 등)는 사용자에게 알릴 것.

## 보안
- API 키·비밀값을 코드에 하드코딩하지 말 것. 공개 저장소임.
  - 키는 `.env`(git 제외)에 두고 `process.env`로 읽음. 필요한 키 목록은 `.env.example`.
  - 예: `import_mountains.js`는 `DATA_GO_KR_KEY` 사용. 옛 키는 git 기록에 남아 있으므로 폐기 대상.
- 브라우저에서 `api.anthropic.com`을 직접 호출하는 코드가 있음(키 없음, 동작 안 함). 키를 넣어 "고치지" 말고 서버리스 함수(Vercel `api/`)를 거치게 할 것.
