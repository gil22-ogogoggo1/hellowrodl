# 핏저니 (FitJourney) 아키텍처 문서

> 최종 업데이트: 2026-03-13

---

## 1. 전체 아키텍처 개요

핏저니는 **서버 없는 단일 페이지 애플리케이션(SPA)** 으로, 모든 데이터를 브라우저 LocalStorage에 저장한다.
빌드 도구·번들러·프레임워크 없이 순수 HTML/CSS/JavaScript로 구현되어 파일을 브라우저에서 직접 열면 동작한다.

```
┌─────────────────────────────────────────────────────┐
│                   브라우저 (Client Only)              │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │                fitjourney.html               │   │
│  │              (SPA 진입점 + CDN 로드)           │   │
│  └─────────────┬────────────────────────────────┘   │
│                │                                    │
│  ┌─────────────▼────────────────────────────────┐   │
│  │              JavaScript 모듈 레이어            │   │
│  │  storage → users → charts → profile → sync   │   │
│  │       → 페이지 모듈들 → settings → app        │   │
│  └─────────────┬────────────────────────────────┘   │
│                │                                    │
│  ┌─────────────▼────────────────────────────────┐   │
│  │           브라우저 LocalStorage               │   │
│  │     mj_{userId}_{store} 키 패턴으로 분리 저장  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  외부 CDN (온라인 시에만): Chart.js, JSZip           │
│  외부 하드웨어 (선택): Bluetooth 체중계              │
└─────────────────────────────────────────────────────┘
```

---

## 2. 모듈 의존성 그래프

```
storage.js          ← 의존성 없음 (기반 레이어)
  ├── users.js      ← storage.js에 의존
  ├── charts.js     ← 의존성 없음 (독립적, Chart.js CDN 사용)
  ├── profile.js    ← storage.js에 의존 (KEYS getter 사용)
  ├── sync.js       ← storage.js에 의존 (Storage.add 사용)
  ├── mounjaro.js   ← storage.js에 의존
  ├── body.js       ← storage.js, charts.js, profile.js, sync.js에 의존
  ├── exercise.js   ← storage.js, charts.js, sync.js에 의존
  ├── diet.js       ← storage.js, charts.js에 의존
  ├── dashboard.js  ← storage.js, charts.js, settings.js에 의존
  ├── settings.js   ← storage.js, users.js에 의존
  └── app.js        ← 모든 모듈에 의존 (진입점)
```

**의존성 규칙:**
- 하위 모듈은 상위 모듈을 참조하지 않는다 (`storage.js`는 `users.js`를 모른다)
- `app.js`만 모든 모듈을 조율한다 (오케스트레이터 패턴)
- 페이지 모듈 간 직접 참조 없음 (대시보드는 Storage를 통해 다른 탭 데이터 읽기)

---

## 3. 파일 로드 순서 및 이유

```
fitjourney.html 내 <script> 순서:

1. storage.js    ── escapeHTML(), KEYS, Storage, migrate
                    ↳ 모든 모듈이 사용하므로 가장 먼저 로드
2. users.js      ── Users (다중 사용자 관리)
                    ↳ KEYS getter가 localStorage.getItem('mj_current_user') 참조
3. charts.js     ── Charts (Chart.js 래퍼)
                    ↳ 페이지 모듈보다 먼저 존재해야 렌더 호출 가능
4. profile.js    ── Profile (프로필 + 한국인 평균)
                    ↳ body.js가 참조
5. sync.js       ── Sync (삼성헬스, Bluetooth)
                    ↳ body.js, exercise.js가 참조
6. mounjaro.js   ── MounjaroPage
7. body.js       ── BodyPage
8. exercise.js   ── ExercisePage
9. diet.js       ── DietPage
10. dashboard.js ── Dashboard
                    ↳ MounjaroPage.drugLabel 등 페이지 모듈 참조
11. settings.js  ── Goals, AppSettings, DataIO, Milestones, SettingsPage
                    ↳ dashboard.js가 Milestones 참조
12. app.js       ── App (SPA 라우터)
                    ↳ 모든 모듈이 정의된 후에 초기화 시작
```

---

## 4. 데이터 흐름

### 4-1. 기록 저장

```
사용자 폼 입력
    │
    ▼
[페이지].save()
    │  escapeHTML() 적용 (XSS 방지)
    ▼
Storage.add(store, data)
    │  id = Date.now().toString()
    │  createdAt = new Date().toISOString()
    ▼
localStorage.setItem(KEYS[store], JSON.stringify(records))
    │  KEYS[store] = "mj_{currentUserId}_{store}"
    ▼
[페이지].render()  ← DOM 업데이트
```

### 4-2. 사용자 전환

```
App.switchUser(id)
    │
    ▼
Users.switchTo(id)
    │  localStorage.setItem('mj_current_user', id)
    ▼
migrate()           ← 새 사용자의 스키마 마이그레이션
    │
    ▼
App.navigateTo(currentTab)
    │  KEYS getter가 새 userId 반환
    ▼
[페이지].render()   ← 새 사용자 데이터로 DOM 갱신
```

### 4-3. 앱 초기화

```
DOMContentLoaded
    │
    ▼
App.init()
    ├── Users.init()        ── 사용자 생성/복원, 구버전 데이터 마이그레이션
    ├── migrate()           ── 현재 사용자 스키마 마이그레이션
    ├── AppSettings.applyTheme()  ── data-theme 속성 설정
    ├── App.renderShell()   ── header + nav + page-container DOM 생성
    └── App.navigateTo('dashboard')  ── 첫 화면 렌더
```

---

## 5. LocalStorage 데이터 모델

### 5-1. 키 구조

```
mj_users             → User[]          (전체 사용자 목록)
mj_current_user      → string          (현재 활성 사용자 ID)
mj_settings          → { theme }       (전역 앱 설정)
mj_version           → string          (스키마 마이그레이션 버전)

mj_{userId}_mounjaro → MounjaroRecord[]
mj_{userId}_body     → BodyRecord[]
mj_{userId}_exercise → ExerciseRecord[]
mj_{userId}_diet     → DietRecord[]
mj_{userId}_profile  → ProfileObject
mj_{userId}_goals    → GoalsObject
```

### 5-2. 레코드 타입 정의

**공통 필드 (모든 레코드)**
```json
{
  "id": "1710000000000",
  "createdAt": "2026-03-10T09:00:00.000Z",
  "date": "2026-03-10"
}
```

**투약 레코드 (MounjaroRecord)**
```json
{
  "drugName": "mounjaro | wegovy | saxenda | ozempic | other",
  "dose": "5mg",
  "site": "복부 | 허벅지 | 팔",
  "sideEffects": ["구역질", "피로감"],
  "cost": 150000,
  "memo": ""
}
```

**체중/인바디 레코드 (BodyRecord)**
```json
{
  "weight": 75.3,
  "fat": 28.5,
  "muscle": 28.0,
  "bmi": 24.5,
  "water": 35.2,
  "visceral": 8,
  "memo": ""
}
```

**운동 레코드 (ExerciseRecord)**
```json
{
  "type": "런닝 | 걷기 | 웨이트 | 자전거 | 수영 | 기타",
  "duration": 45,
  "distance": 5.0,
  "sets": [{ "name": "스쿼트", "sets": 3, "reps": 10, "weight": 60 }],
  "memo": ""
}
```

**식사 레코드 (DietRecord)**
```json
{
  "meal": "아침 | 점심 | 저녁 | 간식",
  "content": "닭가슴살 샐러드",
  "calories": 350,
  "memo": ""
}
```

**사용자 (User)**
```json
{
  "id": "1710000000000",
  "name": "김민지",
  "createdAt": "2026-03-10T09:00:00.000Z",
  "color": "#ff7829"
}
```

**목표 (GoalsObject)**
```json
{
  "weightStart": 85.0,
  "weightTarget": 70.0,
  "exerciseWeekly": 3,
  "calorieDaily": 1500
}
```

---

## 6. 차트 아키텍처

### 6-1. 차트 인스턴스 관리

Chart.js는 같은 `<canvas>`에 새 인스턴스를 만들면 이전 인스턴스가 남아 메모리 누수 및 렌더 오류가 발생한다.
이를 방지하기 위해 `window` 전역에 차트 인스턴스를 저장하고 `Charts._destroy(key)`로 관리한다.

```
window._bodyChart       ← Charts.renderWeightChart()
window._bodyCompChart   ← Charts.renderBodyCompChart()
window._dashWeightChart ← Charts.renderDashWeightChart()
window._exFreqChart     ← Charts.renderExerciseFreqChart()
window._calTrendChart   ← Charts.renderCalorieTrendChart()
```

### 6-2. Graceful Fallback

CDN 미로드 시 (`typeof Chart === 'undefined'`) `Charts._guard(canvasId)`가 캔버스 위치에 안내 메시지를 렌더하고 `false`를 반환한다. 각 render 함수가 `_guard()`를 먼저 호출하므로 오류 없이 처리된다.

```javascript
// charts.js 패턴
renderWeightChart(canvasId, records) {
  if (!this._guard(canvasId)) return;  // Chart.js 미로드 시 fallback 표시 후 종료
  this._destroy('_bodyChart');
  window._bodyChart = new Chart(...);
}
```

---

## 7. 보안 아키텍처

### XSS 방지

모든 사용자 입력은 DOM에 삽입되기 전 `escapeHTML()`로 처리한다.

```
사용자 입력 → escapeHTML() → innerHTML 삽입 (안전)
사용자 입력 → [직접 삽입]  → ❌ XSS 취약점
```

`escapeHTML()`은 `storage.js`에 정의되어 가장 먼저 로드되므로 모든 모듈에서 즉시 사용 가능하다.

### 데이터 프라이버시

- 서버 전송 없음 — 모든 데이터는 사용자 기기 LocalStorage에만 저장
- 외부 의존성: Chart.js CDN, JSZip CDN, Google Fonts (데이터 전송 없음)
- Bluetooth: Web Bluetooth API 사용, 체중 수치만 로컬 저장

---

## 8. 반응형 레이아웃 구조

```
모바일 (기본, ~767px)
┌─────────────────┐
│    Header       │  52px (타이틀 + 아바타 + ⚙️)
│    Tab Nav      │  44px (홈·투약·체중·운동·식사)
│                 │
│    Page         │  flex-grow: 1, overflow-y: auto
│    Content      │
│                 │
└─────────────────┘

태블릿 (768px+)
┌─────────────────┐
│    Header       │
│    Tab Nav      │
│  ┌───┐ ┌───┐   │
│  │카드│ │카드│   │  ← 2컬럼 그리드
│  └───┘ └───┘   │
└─────────────────┘

데스크톱 (1024px+)
┌──────────────────────────────┐
│         Header               │
├────────┬─────────────────────┤
│        │                     │
│  사이드바│    Page Content      │
│  220px │    (flex-grow: 1)   │
│  탭 버튼│                     │
│  수직  │                     │
│        │                     │
└────────┴─────────────────────┘
```

---

## 9. 주요 설계 결정 (Architecture Decision Records)

### ADR-01: 프레임워크 없는 순수 JS

**결정**: React/Vue 없이 순수 HTML/CSS/JS 사용

**이유**:
- 빌드 도구 불필요 → 파일 직접 열기로 동작
- 의존성 없음 → CDN 장애 시에도 핵심 기능 동작
- GLP-1 사용자 대상 → 기술 친화적이지 않을 수 있어 단순 배포 중요

**트레이드오프**: 컴포넌트 재사용성 낮음, 상태 관리 수동

---

### ADR-02: LocalStorage 전용 저장소

**결정**: 서버·클라우드 없이 LocalStorage만 사용

**이유**:
- 건강 데이터 프라이버시 — 클라우드 전송 거부감 높음
- 서버 운영 비용·복잡도 없음
- 오프라인 완전 동작

**트레이드오프**: 기기 간 동기화 불가, 브라우저 데이터 초기화 시 유실 (JSON 백업으로 대응)

---

### ADR-03: 다중 사용자 키 격리

**결정**: `mj_{userId}_{store}` 패턴으로 사용자별 LocalStorage 키 분리

**이유**:
- 가족 기기 공유 시나리오 — 한 기기에서 여러 사람이 독립적 사용
- ES6 getter 패턴으로 API 변경 없이 동적 키 반환

**트레이드오프**: 구버전 단일 사용자 데이터 마이그레이션 필요 (Users.init()에서 처리)

---

### ADR-04: ES6 getter 기반 동적 KEYS

**결정**: `KEYS.mounjaro`를 일반 문자열이 아닌 ES6 getter로 구현

```javascript
const KEYS = {
  get mounjaro() { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_mounjaro`; }
}
```

**이유**:
- Storage API(`Storage.add('mounjaro', ...)`)를 변경하지 않고 다중 사용자 지원
- 사용자 전환 시 자동으로 올바른 키 반환

**트레이드오프**: 매 접근 시 localStorage.getItem 호출 (성능 영향 미미)

---

### ADR-05: migrate() 명시적 호출

**결정**: `storage.js` 로드 시 자동 호출 제거, `app.js`에서 `Users.init()` 이후 명시 호출

**이유**:
- 마이그레이션은 현재 사용자 컨텍스트가 필요
- `storage.js` 로드 시점에는 아직 사용자 ID가 결정되지 않음

```javascript
// app.js
App.init() {
  Users.init();   // 사용자 생성/복원 먼저
  migrate();      // 그 다음 현재 사용자 스키마 마이그레이션
  ...
}
```

---

## 10. 테스트 전략

### 테스트 범위

| 모듈 | 테스트 파일 | 테스트 수 | 커버 영역 |
|------|------------|----------|---------|
| storage.js | storage.test.js | 35 | escapeHTML, CRUD, migrate, KEYS |
| users.js | users.test.js | 18 | add, switch, rename, remove, init |
| settings.js | settings.test.js | 20 | Goals, AppSettings, Milestones |

**총 73개 단위 테스트** (Jest + jsdom)

### 테스트 환경

- `jest-environment-jsdom`: 브라우저 API(localStorage, document) 시뮬레이션
- `beforeEach(() => localStorage.clear())`: 테스트 간 상태 격리
- module.exports 패턴: `if (typeof module !== 'undefined') { module.exports = ... }` — 브라우저에서는 무시, Node.js에서만 내보내기

### 제외 영역 (이유)

| 모듈 | 제외 이유 |
|------|---------|
| charts.js | Chart.js 자체가 canvas API 의존 — jsdom에서 완전 시뮬레이션 불가 |
| app.js | SPA 라우팅은 통합 테스트 대상 (단위 테스트 부적합) |
| sync.js | Web Bluetooth API, FileReader — 브라우저 전용 API |
| 페이지 모듈 | render() 함수는 E2E 테스트 대상 |

---

## 11. CI/CD 파이프라인

```
git push → master
    │
    ▼
GitHub Actions (.github/workflows/ci.yml)
    │
    ├── Job 1: test (Jest)
    │   ├── npm install
    │   ├── npm run test:ci (--coverage, 73개 테스트)
    │   └── upload coverage artifact
    │
    ├── Job 2: validate (HTML)
    │   ├── fitjourney.html 파일 크기 확인
    │   ├── 필수 스크립트 로드 확인 (storage.js, app.js, Chart.js CDN)
    │   └── JS 로드 순서 검증 (Python 스크립트)
    │
    └── Job 3: deploy (test + validate 통과 시, master push 한정)
        ├── _site/ 디렉토리 생성
        ├── fitjourney.html, index.html, css/, js/ 복사
        └── peaceiris/actions-gh-pages → gh-pages 브랜치 자동 푸시
```

### 배포 URL

| 환경 | URL |
|------|-----|
| 라이브 데모 | https://gil22-ogogoggo1.github.io/fitjourney/ |
| GitHub Actions | https://github.com/gil22-ogogoggo1/fitjourney/actions |
| 저장소 | https://github.com/gil22-ogogoggo1/fitjourney |

**배포 흐름**: master push → CI 통과 → `peaceiris/actions-gh-pages`가 `gh-pages` 브랜치에 정적 파일 push → GitHub Pages 자동 빌드 → 라이브 반영 (통상 1~2분)
