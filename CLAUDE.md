# 마운자로 다이어트 트래커

GLP-1(마운자로) 투약 중인 사용자의 다이어트 여정을 종합 관리하는 웹앱.
투약 정보, 체중/인바디, 운동, 식사를 한곳에서 기록하고 시각적으로 추적한다.

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 언어 | 순수 HTML / CSS / JavaScript | 프레임워크 없음, 빌드 단계 없음 |
| 데이터 | 브라우저 LocalStorage | 서버 불필요, 오프라인 동작 |
| 차트 | Chart.js 4.x (CDN) | 경량, 반응형 캔버스 차트 |
| 디자인 | 모바일 우선 반응형, 다크 테마 | 기존 Dawn Runner 팔레트 계승 |

---

## 프로젝트 구조

```
index.html              ← SPA 진입점 (Chart.js CDN 포함)
css/
  style.css             ← 전역 스타일, CSS 변수, 다크 테마
js/
  storage.js            ← LocalStorage CRUD 유틸리티 (가장 먼저 로드)
  charts.js             ← Chart.js 래퍼 (renderWeightChart 등)
  dashboard.js          ← 대시보드: 투약/체중/운동/식사 요약
  mounjaro.js           ← 투약 기록 페이지 로직
  body.js               ← 체중/인바디 기록 페이지 로직
  exercise.js           ← 운동 기록 페이지 로직
  diet.js               ← 식사 기록 페이지 로직
  app.js                ← SPA 라우팅, 탭 네비게이션, 공통 유틸 (가장 마지막 로드)
```

**JS 로드 순서 준수:** `storage.js` → `charts.js` → 각 페이지 모듈 → `app.js`
의존성이 있으므로 순서를 바꾸면 초기화 오류 발생.

---

## LocalStorage 스키마

| 키 | 타입 | 설명 |
|----|------|------|
| `mj_mounjaro` | `Record[]` | 투약 기록 |
| `mj_body`     | `Record[]` | 체중/인바디 기록 |
| `mj_exercise` | `Record[]` | 운동 기록 |
| `mj_diet`     | `Record[]` | 식사 기록 |

모든 레코드는 `{ id: string (timestamp), createdAt: ISO, date: YYYY-MM-DD, ... }` 형태.

> ⚠️ **키 이름 변경 금지:** LocalStorage 키를 바꾸면 기존 사용자 데이터가 유실됩니다.
> 스키마 변경이 필요할 경우 `storage.js`에 마이그레이션 로직을 먼저 추가하세요.

---

## 언어 규칙

- 응답 / 주석 / 커밋 메시지: **한국어**
- 변수명 / 함수명 / CSS 클래스명: **영어** (코드 표준 준수)

---

## 개발 유의사항

### 절대 하지 말아야 할 것

- **LocalStorage 키 이름 변경**: 기존 데이터 유실. 변경 필요 시 마이그레이션 먼저.
- **JS 파일 로드 순서 변경**: `storage.js`가 먼저, `app.js`가 마지막이어야 함.
- **Chart.js 인스턴스 중복 생성**: 차트를 다시 그리기 전 반드시 `chart.destroy()` 호출. 누락 시 메모리 누수 및 렌더 깨짐 발생.
- **`innerHTML`에 사용자 입력 직접 삽입**: XSS 위험. 사용자 입력은 `textContent` 또는 `escapeHTML()` 처리 후 삽입.

### 스타일 가이드

- CSS 변수는 `css/style.css` `:root`에만 선언, 인라인 하드코딩 금지.
- 컬러 팔레트: `--coral` `--orange` `--amber` `--gold` `--green` `--blue` `--purple` 사용.
- 새 컴포넌트 추가 시 기존 `.card`, `.btn`, `.record-item` 클래스 재사용 우선.
- 모바일 기준(max-width: 480px) 먼저 설계 후 데스크톱 확장.

### 데이터 흐름

```
사용자 입력 → [페이지 모듈].save() → Storage.add() → localStorage
화면 렌더  → [페이지 모듈].render() → Storage.getAll() → DOM 업데이트
```

- 저장 후 반드시 render 계열 함수를 다시 호출해 화면을 동기화.
- `Storage.getAll()`은 항상 날짜 내림차순 반환.

### 브라우저 검증 방법

`index.html`을 브라우저에서 직접 열면 동작 (로컬 서버 불필요).

검증 체크리스트:
- ✅ 각 탭 전환 정상 동작
- ✅ 데이터 입력 → 저장 → 리스트 즉시 반영
- ✅ 새로고침 후 데이터 유지 (LocalStorage 확인)
- ✅ 모바일 뷰포트(375px) 레이아웃 이상 없음
- ✅ Chart.js 그래프 정상 렌더 (데이터 2개 이상 필요)
- ⬜ 오프라인 환경에서 Chart.js CDN 미로드 시 graceful degradation

---

## 기능 확장 시 참고

새 탭/기능 추가 순서:
1. `js/<name>.js` — 페이지 모듈 작성 (`render()`, `save()`, `renderList()` 패턴 유지)
2. `css/style.css` — 새 컴포넌트 스타일 추가 (기존 클래스 재사용 우선)
3. `js/app.js` — `tabs` 배열, `pageModules`, 탭 버튼 HTML에 추가
4. `index.html` — `<script src="js/<name>.js">` 추가 (app.js 이전에)
