# 핏저니 (FitJourney)

> **"투약과 함께하는 건강한 변화"**
> GLP-1 투약자가 투약·체중·운동·식사를 한곳에서 기록하고 시각적으로 추적하는 개인 건강 관리 웹앱

🌐 **[라이브 데모](https://gil22-ogogogogo1.github.io/fitjourney/)** | 📋 **[PRD](docs/PRD.md)**

---

## 문제 정의

GLP-1 계열 약품(마운자로·위고비·삭센다·오젬픽)을 투약 중인 사용자는 다음과 같은 어려움을 겪습니다:

- **투약 주기 관리**: 약품별 투약 간격(1일~7일)을 매번 직접 계산해야 함
- **데이터 분산**: 투약·체중·운동·식사 기록이 서로 다른 앱에 흩어져 있음
- **프라이버시 우려**: 건강 데이터를 클라우드 서버에 올리는 것에 대한 거부감
- **GLP-1 특화 기능 부재**: 기존 앱들은 약물 투약 주기 추적 기능이 없음

**핏저니**는 이 4가지 문제를 단일 앱으로 해결합니다.

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 💉 **GLP-1 투약 관리** | 마운자로·위고비·삭센다·오젬픽·기타 약품 선택, 약품별 용량 자동 변경, 다음 투약일 자동 계산 |
| ⚖️ **체중·인바디** | 기간 필터(1주/1달/3달/전체), 체성분 듀얼 라인 차트, 또래 평균 비교 |
| 🏃 **운동 기록** | 런닝·웨이트·수영 등 상세 기록, 주간 빈도 막대 차트 |
| 🥗 **식사 기록** | 끼니별 칼로리 합산, 14일 칼로리 추이 차트 |
| 🎯 **목표 & 마일스톤** | 체중/운동/칼로리 목표 진행률 바, 자동 마일스톤 뱃지(2/5/10/15/20kg) |
| 👥 **다중 사용자** | 사용자 등록·전환·삭제, 사용자별 데이터 완전 분리 |
| 🎨 **테마 전환** | 다크·라이트 테마, 설정에서 즉시 전환 |
| 📥 **데이터 연동** | 삼성헬스 ZIP/CSV 가져오기, 블루투스 체중계 연결 |
| 💾 **백업·복원** | JSON 전체 백업 다운로드 및 복원 |
| 🔒 **완전한 프라이버시** | 서버 없음, 브라우저 LocalStorage에만 저장 |

---

## 기존 앱과의 차별점

| | 핏저니 | 삼성헬스 / Apple Health | MyFitnessPal / 다이어트 신 | 기타 GLP-1 앱 |
|---|---|---|---|---|
| GLP-1 투약 주기 추적 | ✅ | ❌ | ❌ | ✅ |
| 투약-체중-운동-식사 통합 | ✅ | △ | △ | ❌ |
| 서버 없이 동작 (완전 오프라인) | ✅ | ❌ | ❌ | ❌ |
| 설치 불필요 (브라우저 실행) | ✅ | ❌ | ❌ | ❌ |
| 다중 사용자 지원 | ✅ | ❌ | ❌ | ❌ |
| 인바디 상세 데이터 | ✅ | △ | ❌ | ❌ |

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 언어 | 순수 HTML / CSS / JavaScript | 빌드 없음, 의존성 없음, 어디서나 즉시 실행 |
| 데이터 | 브라우저 LocalStorage | 서버 불필요, 완전한 오프라인 동작, 프라이버시 보장 |
| 차트 | Chart.js 4.x (CDN) | 경량, 반응형 캔버스 차트, graceful fallback |
| ZIP 처리 | JSZip 3.x (CDN) | 삼성헬스 ZIP 파일 브라우저 파싱 |
| 디자인 | 모바일 우선, 다크/라이트 테마 | 한 손 조작 최적화, 320px~1920px |
| 테스트 | Jest + jsdom | LocalStorage 포함 브라우저 환경 단위 테스트 |
| CI/CD | GitHub Actions | 자동 테스트 + GitHub Pages 자동 배포 |

---

## 프로젝트 구조

```
fitjourney.html             ← SPA 진입점
css/
  style.css                 ← 전역 스타일, CSS 변수, 다크/라이트 테마, 반응형
js/
  storage.js                ← LocalStorage CRUD + escapeHTML() + migrate()
  users.js                  ← 다중 사용자 관리 (등록/전환/삭제/마이그레이션)
  charts.js                 ← Chart.js 래퍼 (체중/체성분/운동빈도/칼로리추이)
  profile.js                ← 사용자 프로필 + 한국인 또래 평균 비교
  sync.js                   ← 삼성헬스 CSV/ZIP 가져오기, 블루투스 체중계
  mounjaro.js               ← GLP-1 투약 기록 (약품 선택, 용량 자동변경)
  body.js                   ← 체중/인바디 기록 (기간 필터, 체성분 차트)
  exercise.js               ← 운동 기록 (주간 빈도 차트)
  diet.js                   ← 식사 기록 (칼로리 추이 차트)
  dashboard.js              ← 대시보드 (목표 진행률, 마일스톤, 주간 요약)
  settings.js               ← 목표 설정, 테마, 데이터 백업/복원, 마일스톤
  app.js                    ← SPA 라우팅, 상단 탭 네비, 사용자 모달, 공통 유틸
tests/
  storage.test.js           ← Storage 단위 테스트 35개 (Jest)
docs/
  PRD.md                    ← 제품 요구사항 정의서
  sprint/
    sprint1.md              ← Sprint 1 구현 기록
    sprint2-6.md            ← Sprint 2~6 구현 기록
.github/
  workflows/ci.yml          ← CI/CD (Jest → HTML 검증 → Pages 배포)
CLAUDE.md                   ← AI 컨텍스트 파일
package.json                ← Jest 설정
jest.config.js              ← Jest 환경 설정
```

**JS 로드 순서**: `storage.js` → `users.js` → `charts.js` → `profile.js` → `sync.js` → 페이지 모듈들 → `settings.js` → `app.js`

---

## 빠른 시작

### 로컬 실행 (서버 불필요)
```bash
git clone https://github.com/gil22-ogogogogo1/fitjourney.git
cd fitjourney
# fitjourney.html을 브라우저에서 직접 열기
open fitjourney.html   # macOS
start fitjourney.html  # Windows
```

### 테스트 실행
```bash
npm install
npm test           # 단위 테스트 + 커버리지
```

---

## 개발 현황

| Sprint | 상태 | 주요 내용 |
|--------|------|----------|
| Sprint 1 | ✅ 완료 | 리브랜딩(핏저니), XSS 수정(escapeHTML), 마이그레이션, 전체 기록 편집 기능 |
| Sprint 2 | ✅ 완료 | 약품 선택(F-11), 목표 설정·진행률(F-12), 설정 페이지(⚙️), 대시보드 목표 위젯 |
| Sprint 3 | ✅ 완료 | 체중 기간 필터, 체성분 차트, 운동 빈도 차트, 칼로리 추이 차트(F-14) |
| Sprint 4 | ✅ 완료 | JSON 백업·복원(F-15), 마일스톤 자동 감지(F-13), 주간 요약(F-17) |
| Sprint 5 | ✅ 완료 | 다크·라이트 테마(F-16), 768px 2컬럼·1024px 사이드바 레이아웃(F-18) |
| Sprint 6 | ✅ 완료 | ARIA 접근성, Chart.js graceful fallback, 전체 QA |
| 추가 기능 | ✅ 완료 | 다중 사용자, 삼성헬스 연동, 블루투스 체중계, 또래 평균 비교, 상단 탭 네비 |

---

## LocalStorage 스키마

### 다중 사용자 키 구조
모든 데이터는 `mj_{userId}_{store}` 형태로 사용자별 분리 저장됩니다.

| 키 패턴 | 타입 | 설명 |
|---------|------|------|
| `mj_{userId}_mounjaro` | `Record[]` | 투약 기록 |
| `mj_{userId}_body`     | `Record[]` | 체중/인바디 기록 |
| `mj_{userId}_exercise` | `Record[]` | 운동 기록 |
| `mj_{userId}_diet`     | `Record[]` | 식사 기록 |
| `mj_{userId}_profile`  | `object`   | 사용자 프로필 (성별·나이·키) |
| `mj_{userId}_goals`    | `object`   | 목표 설정 (체중·운동·칼로리) |
| `mj_users`             | `User[]`   | 전체 사용자 목록 |
| `mj_current_user`      | `string`   | 현재 활성 사용자 ID |
| `mj_settings`          | `object`   | 전역 설정 (테마) |
| `mj_version`           | `string`   | 스키마 버전 |

> ⚠️ **키 패턴 변경 금지**: `storage.js`의 KEYS getter가 동적으로 생성. 변경 시 `migrate()` 먼저 작성.

### 레코드 공통 필드
```json
{
  "id": "1710000000000",
  "createdAt": "2026-03-10T09:00:00.000Z",
  "date": "2026-03-10"
}
```

### 투약 레코드 확장 필드
```json
{
  "drugName": "mounjaro|wegovy|saxenda|ozempic|other",
  "dose": "5mg",
  "site": "복부",
  "sideEffects": ["구역질"],
  "cost": 150000,
  "memo": ""
}
```

---

## 보안

- 모든 사용자 입력은 `escapeHTML()`로 처리 (XSS 방지)
- 데이터는 사용자 기기 로컬에만 저장 (서버 전송 없음)
- 외부 의존성: Chart.js CDN (jsDelivr) + JSZip CDN + Google Fonts만 사용

---

## 라이선스

MIT License
