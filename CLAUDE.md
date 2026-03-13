# 핏저니 (FitJourney)

GLP-1 투약자의 투약·체중·운동·식사를 한곳에서 기록하고 시각적으로 추적하는 개인 건강 관리 웹앱.
다중 사용자 지원, 다크/라이트 테마, 삼성헬스 연동, 블루투스 체중계 연결 기능 포함.

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 언어 | 순수 HTML / CSS / JavaScript | 프레임워크 없음, 빌드 단계 없음 |
| 데이터 | 브라우저 LocalStorage | 서버 불필요, 오프라인 동작 |
| 차트 | Chart.js 4.x (CDN) | 경량, 반응형 캔버스 차트 |
| ZIP 처리 | JSZip 3.x (CDN) | 삼성헬스 ZIP 파일 파싱 |
| 디자인 | 모바일 우선 반응형, 다크/라이트 테마 |  |

---

## 프로젝트 구조

```
fitjourney.html             ← SPA 진입점
css/
  style.css                 ← 전역 스타일, CSS 변수, 다크/라이트 테마
js/
  storage.js                ← LocalStorage CRUD + escapeHTML() + migrate() [먼저 로드]
  users.js                  ← 다중 사용자 관리
  helpers.js                ← FormHelper + RenderHelper 공통 유틸
  charts.js                 ← Chart.js 래퍼
  profile.js                ← 사용자 프로필 + 또래 평균 비교
  sync.js                   ← 삼성헬스 연동, 블루투스 체중계
  mounjaro.js               ← GLP-1 투약 기록 페이지
  body.js                   ← 체중/인바디 기록 페이지
  exercise.js               ← 운동 기록 페이지
  diet.js                   ← 식사 기록 페이지
  dashboard.js              ← 대시보드 페이지
  settings.js               ← 설정 페이지 (Goals, AppSettings, DataIO, Milestones)
  app.js                    ← SPA 라우팅, 상단 탭 네비, 사용자 모달 [마지막 로드]
```

**JS 로드 순서 준수 (절대 변경 금지):**
`storage.js` → `users.js` → `charts.js` → `profile.js` → `sync.js` → `mounjaro.js` → `body.js` → `exercise.js` → `diet.js` → `dashboard.js` → `settings.js` → `app.js`

---

## LocalStorage 스키마

### 다중 사용자 구조
모든 사용자 데이터는 `mj_{userId}_{store}` 패턴으로 분리 저장.

| 키 패턴 | 설명 |
|---------|------|
| `mj_{userId}_mounjaro` | 투약 기록 |
| `mj_{userId}_body`     | 체중/인바디 기록 |
| `mj_{userId}_exercise` | 운동 기록 |
| `mj_{userId}_diet`     | 식사 기록 |
| `mj_{userId}_profile`  | 사용자 프로필 |
| `mj_{userId}_goals`    | 목표 설정 |
| `mj_users`             | 전체 사용자 목록 |
| `mj_current_user`      | 현재 활성 사용자 ID |
| `mj_settings`          | 전역 설정 (테마) |
| `mj_version`           | 스키마 버전 |

`storage.js`의 `KEYS` 객체가 ES6 getter로 현재 사용자 ID를 동적 반영:
```js
const KEYS = {
  get mounjaro() { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_mounjaro`; },
  // ...
};
```

> ⚠️ **KEYS 패턴 변경 금지**: 기존 사용자 데이터 유실. 변경 필요 시 `migrate()` 먼저 작성.

### 모든 레코드 공통 구조
```json
{ "id": "timestamp_string", "createdAt": "ISO8601", "date": "YYYY-MM-DD", ...fields }
```

---

## 언어 규칙

- 응답 / 주석 / 커밋 메시지: **한국어**
- 변수명 / 함수명 / CSS 클래스명: **영어** (코드 표준 준수)

---

## 개발 유의사항

### 절대 하지 말아야 할 것

- **JS 파일 로드 순서 변경**: 위 순서가 의존성 순서. 어기면 초기화 오류 발생.
- **KEYS 패턴 변경**: `mj_{userId}_{store}` 패턴 고정. 변경 시 마이그레이션 먼저.
- **Chart.js 인스턴스 중복 생성**: 차트 렌더 전 반드시 `Charts._destroy(key)` 호출.
- **`innerHTML`에 사용자 입력 직접 삽입**: XSS 위험. 반드시 `escapeHTML()` 처리 후 삽입.
- **migrate() 자동 실행**: `storage.js` 하단에서 자동 호출 제거됨. `app.js`의 `init()`에서 `Users.init()` 이후 명시적으로 호출.

### 초기화 순서
```
Users.init()       ← 사용자 생성/복원, 기존 데이터 마이그레이션
migrate()          ← 현재 사용자의 스키마 마이그레이션
AppSettings.applyTheme()  ← 저장된 테마 적용
App.renderShell()  ← DOM 생성
App.navigateTo()   ← 첫 페이지 렌더
```

### 스타일 가이드

- CSS 변수는 `css/style.css` `:root`에만 선언, 인라인 하드코딩 금지.
- 컬러 팔레트: `--coral` `--orange` `--amber` `--gold` `--green` `--blue` `--purple` 사용.
- 다크 테마: `:root` 기본값. 라이트 테마: `[data-theme="light"]` 오버라이드.
- 새 컴포넌트 추가 시 기존 `.card`, `.btn`, `.record-item` 클래스 재사용 우선.
- 모바일 기준(max-width: 480px) 먼저 설계 후 768px·1024px 확장.

### 탭 네비게이션

탭은 헤더 바로 아래 **상단**에 위치 (하단 fixed 아님).
DOM 순서: `#app-header` → `#tab-nav` → `#page-container`

설정 페이지는 6번째 탭이 아니라 헤더의 ⚙️ 버튼으로 진입하는 가상 페이지:
```js
App.pageModules['settings'] = () => SettingsPage.render();
// tabs 배열에는 포함하지 않음 → 탭 버튼 미생성
```

### 데이터 흐름

```
사용자 입력 → [페이지 모듈].save() → Storage.add() → localStorage
화면 렌더  → [페이지 모듈].render() → Storage.getAll() → DOM 업데이트
사용자 전환 → Users.switchTo(id) → migrate() → App.navigateTo(currentTab)
```

### 사용자 전환 시 주의사항
- `Users.switchTo(id)` 호출 후 반드시 `migrate()`를 재실행 (새 사용자 데이터 마이그레이션)
- 탭 재렌더 전 `Charts._destroy(key)` 자동 처리됨 (각 renderChart 진입 시)

### 차트 관리

`charts.js`에 정의된 차트 인스턴스 키:
| window 키 | 차트 | 파일 |
|-----------|------|------|
| `_bodyChart` | 체중 라인 | body.js |
| `_bodyCompChart` | 체성분 듀얼 라인 | body.js |
| `_dashWeightChart` | 대시보드 미니 체중 | dashboard.js |
| `_exFreqChart` | 운동 빈도 막대 | exercise.js |
| `_calTrendChart` | 칼로리 추이 막대 | diet.js |

### 브라우저 검증 방법

`fitjourney.html`을 브라우저에서 직접 열면 동작 (로컬 서버 불필요).

검증 체크리스트:
- ✅ 상단 탭 전환 정상 동작 (홈/투약/체중/운동/식사)
- ✅ 데이터 입력 → 저장 → 리스트 즉시 반영
- ✅ 새로고침 후 데이터 유지 (LocalStorage 확인)
- ✅ 다중 사용자 전환 후 데이터 분리 확인
- ✅ 설정 → 목표 저장 → 대시보드 진행률 반영
- ✅ 설정 → 라이트 테마 전환 정상 동작
- ✅ 모바일(375px) 레이아웃 이상 없음
- ✅ 데스크톱(1024px+) 사이드바 레이아웃 이상 없음
- ✅ Chart.js 오프라인 시 fallback 메시지 표시

---

## 기능 확장 시 참고

### 새 페이지 모듈 추가
1. `js/<name>.js` — `render()`, `save()`, `renderList()` 패턴 유지
2. `css/style.css` — 기존 클래스 재사용 우선
3. `js/app.js` — `pageModules`에 추가 (탭으로 노출할 경우 `tabs`·탭 버튼 HTML에도 추가)
4. `fitjourney.html` — `<script src="js/<name>.js">` 추가 (app.js 이전, dashboard.js 이후)

### 새 LocalStorage 키 추가
1. `js/storage.js` KEYS에 getter 추가
2. `js/storage.js` `migrate()` 함수에 마이그레이션 로직 추가
3. `SCHEMA_VERSION` 증가
4. `tests/storage.test.js` 테스트 추가
