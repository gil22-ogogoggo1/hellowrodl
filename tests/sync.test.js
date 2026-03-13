/**
 * tests/sync.test.js
 * Sync 모듈 단위 테스트 — CSV 파싱, 날짜 정규화, 데이터 가져오기
 */

const { Storage, escapeHTML, KEYS } = require('../js/storage');
global.Storage = Storage;
global.escapeHTML = escapeHTML;

const { Sync } = require('../js/sync');

let mockNow = 1710000000000;
beforeEach(() => {
  localStorage.clear();
  mockNow = 1710000000000;
  jest.spyOn(Date, 'now').mockImplementation(() => mockNow++);
});
afterEach(() => jest.restoreAllMocks());

// ────────────────────────────────────────
// Sync._splitCSVLine
// ────────────────────────────────────────
describe('Sync._splitCSVLine()', () => {
  test('일반 쉼표 구분 파싱', () => {
    expect(Sync._splitCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  test('따옴표로 묶인 필드 (쉼표 포함)', () => {
    const result = Sync._splitCSVLine('"hello, world",test');
    expect(result[0]).toBe('hello, world');
    expect(result[1]).toBe('test');
  });

  test('빈 필드 처리', () => {
    expect(Sync._splitCSVLine('a,,c')).toEqual(['a', '', 'c']);
  });

  test('단일 필드', () => {
    expect(Sync._splitCSVLine('단일')).toEqual(['단일']);
  });

  test('따옴표 쌍 처리', () => {
    const result = Sync._splitCSVLine('"값1","값2"');
    expect(result[0]).toBe('값1');
    expect(result[1]).toBe('값2');
  });

  test('공백 포함 필드', () => {
    const result = Sync._splitCSVLine(' a , b , c ');
    expect(result).toEqual([' a ', ' b ', ' c ']);
  });
});

// ────────────────────────────────────────
// Sync._normalizeDate
// ────────────────────────────────────────
describe('Sync._normalizeDate()', () => {
  test('ISO 8601 형식 → YYYY-MM-DD', () => {
    const result = Sync._normalizeDate('2024-01-15T09:30:00.000+0900');
    expect(result).toBe('2024-01-15');
  });

  test('YYYY.MM.DD 형식', () => {
    expect(Sync._normalizeDate('2024.01.15')).toBe('2024-01-15');
  });

  test('YYYY/MM/DD 형식', () => {
    expect(Sync._normalizeDate('2024/01/15')).toBe('2024-01-15');
  });

  test('YYYY-MM-DD 형식 (그대로)', () => {
    expect(Sync._normalizeDate('2024-01-15')).toBe('2024-01-15');
  });

  test('빈 문자열 → null', () => {
    expect(Sync._normalizeDate('')).toBeNull();
  });

  test('null → null', () => {
    expect(Sync._normalizeDate(null)).toBeNull();
  });

  test('한 자리 월/일 패딩', () => {
    expect(Sync._normalizeDate('2024.1.5')).toBe('2024-01-05');
  });
});

// ────────────────────────────────────────
// Sync.parseCSV
// ────────────────────────────────────────
describe('Sync.parseCSV()', () => {
  test('기본 CSV 파싱', () => {
    const csv = '날짜,체중\n2026-01-01,75.3\n2026-01-08,75.0';
    const rows = Sync.parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]['날짜']).toBe('2026-01-01');
    expect(rows[0]['체중']).toBe('75.3');
  });

  test('BOM 포함 CSV 파싱', () => {
    const csv = '\uFEFF날짜,체중\n2026-01-01,75.3';
    const rows = Sync.parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]['날짜']).toBe('2026-01-01');
  });

  test('빈 줄 무시', () => {
    const csv = '날짜,체중\n2026-01-01,75.3\n\n2026-01-08,75.0\n';
    expect(Sync.parseCSV(csv)).toHaveLength(2);
  });

  test('헤더만 있으면 빈 배열', () => {
    expect(Sync.parseCSV('날짜,체중')).toEqual([]);
  });

  test('빈 문자열 → 빈 배열', () => {
    expect(Sync.parseCSV('')).toEqual([]);
  });

  test('헤더 공백 트림', () => {
    const csv = ' 날짜 , 체중 \n2026-01-01,75.3';
    const rows = Sync.parseCSV(csv);
    expect(rows[0]['날짜']).toBe('2026-01-01');
  });
});

// ────────────────────────────────────────
// Sync.detectFormat
// ────────────────────────────────────────
describe('Sync.detectFormat()', () => {
  test('삼성헬스 체성분 감지', () => {
    expect(Sync.detectFormat(['samsung_health_weight', 'start_time'])).toBe('samsung_body');
  });

  test('삼성헬스 운동 감지', () => {
    expect(Sync.detectFormat(['exercise_type', 'start_time'])).toBe('samsung_exercise');
  });

  test('인바디 감지 (골격근)', () => {
    expect(Sync.detectFormat(['날짜', '골격근량', '체지방률'])).toBe('inbody');
  });

  test('인바디 감지 (skeletal)', () => {
    expect(Sync.detectFormat(['date', 'skeletal_muscle', 'fat'])).toBe('inbody');
  });

  test('일반 체중 (기본값)', () => {
    expect(Sync.detectFormat(['날짜', '체중'])).toBe('generic_body');
  });

  test('운동 CSV 감지', () => {
    expect(Sync.detectFormat(['날짜', '운동종류', '시간'])).toBe('generic_exercise');
  });
});

// ────────────────────────────────────────
// Sync.importSamsungBody
// ────────────────────────────────────────
describe('Sync.importSamsungBody()', () => {
  test('유효한 CSV → success 1건', () => {
    const csv = 'start_time,weight\n2026-01-01T09:00:00.000+0900,75.3';
    const result = Sync.importSamsungBody(csv);
    expect(result.success).toBe(1);
    expect(result.skip).toBe(0);
  });

  test('체중 없는 행 → skip', () => {
    const csv = 'start_time,weight\n2026-01-01T09:00:00.000+0900,';
    const result = Sync.importSamsungBody(csv);
    expect(result.skip).toBe(1);
    expect(result.success).toBe(0);
  });

  test('빈 CSV → success 0', () => {
    expect(Sync.importSamsungBody('')).toEqual({ success: 0, skip: 0 });
  });

  test('중복 데이터 → skip', () => {
    Storage.add('body', { date: '2026-01-01', weight: 75.3 });
    const csv = 'start_time,weight\n2026-01-01T09:00:00.000+0900,75.3';
    const result = Sync.importSamsungBody(csv);
    expect(result.skip).toBe(1);
  });

  test('체성분 포함 CSV 가져오기', () => {
    const csv = 'start_time,weight,body_fat_ratio,skeletal_muscle\n2026-01-01T09:00:00.000+0900,75.3,28.5,30.1';
    const result = Sync.importSamsungBody(csv);
    expect(result.success).toBe(1);
    const records = Storage.getAll('body');
    expect(records[0].fat).toBe(28.5);
    expect(records[0].muscle).toBe(30.1);
  });
});

// ────────────────────────────────────────
// Sync.importGenericBody
// ────────────────────────────────────────
describe('Sync.importGenericBody()', () => {
  test('한국어 컬럼 CSV 가져오기', () => {
    const csv = '날짜,체중,체지방률\n2026-01-01,75.3,28.5';
    const result = Sync.importGenericBody(csv);
    expect(result.success).toBe(1);
  });

  test('중복 데이터 skip', () => {
    Storage.add('body', { date: '2026-01-01', weight: 75.3 });
    const csv = '날짜,체중\n2026-01-01,75.3';
    const result = Sync.importGenericBody(csv);
    expect(result.skip).toBe(1);
  });

  test('날짜 없는 행 → skip', () => {
    const csv = '날짜,체중\n,75.3';
    const result = Sync.importGenericBody(csv);
    expect(result.skip).toBe(1);
  });

  test('체중 0인 행 → skip', () => {
    const csv = '날짜,체중\n2026-01-01,0';
    const result = Sync.importGenericBody(csv);
    expect(result.skip).toBe(1);
  });

  test('여러 행 가져오기', () => {
    const csv = '날짜,체중\n2026-01-01,75.3\n2026-01-08,75.0\n2026-01-15,74.5';
    const result = Sync.importGenericBody(csv);
    expect(result.success).toBe(3);
  });
});

// ────────────────────────────────────────
// Sync.importSamsungExercise
// ────────────────────────────────────────
describe('Sync.importSamsungExercise()', () => {
  test('런닝 데이터 가져오기', () => {
    const csv = 'start_time,exercise_type,duration,distance\n2026-01-01T09:00:00.000+0900,1001,1800000,5000';
    const result = Sync.importSamsungExercise(csv);
    expect(result.success).toBe(1);
  });

  test('알 수 없는 운동 타입 → 기타', () => {
    const csv = 'start_time,exercise_type\n2026-01-01T09:00:00.000+0900,9999';
    Sync.importSamsungExercise(csv);
    const records = Storage.getAll('exercise');
    expect(records[0].type).toBe('기타');
  });

  test('날짜 없는 행 → skip', () => {
    const csv = 'start_time,exercise_type\n,1001';
    const result = Sync.importSamsungExercise(csv);
    expect(result.skip).toBe(1);
  });
});
