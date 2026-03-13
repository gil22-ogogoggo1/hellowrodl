/**
 * tests/profile.test.js
 * Profile 모듈 단위 테스트 — 순수 함수 중심
 */

const { Profile } = require('../js/profile');

// ────────────────────────────────────────
// Profile.calcBMI
// ────────────────────────────────────────
describe('Profile.calcBMI()', () => {
  test('정상 값 계산 — 체중 75kg, 키 170cm', () => {
    const bmi = Profile.calcBMI(75, 170);
    expect(bmi).toBeCloseTo(25.95, 1);
  });

  test('체중 null이면 null 반환', () => {
    expect(Profile.calcBMI(null, 170)).toBeNull();
  });

  test('키 null이면 null 반환', () => {
    expect(Profile.calcBMI(75, null)).toBeNull();
  });

  test('체중 0이면 null 반환', () => {
    expect(Profile.calcBMI(0, 170)).toBeNull();
  });

  test('키 0이면 null 반환', () => {
    expect(Profile.calcBMI(75, 0)).toBeNull();
  });

  test('BMI 공식 검증 — 80kg / 1.75m^2 ≈ 26.12', () => {
    const bmi = Profile.calcBMI(80, 175);
    expect(bmi).toBeCloseTo(26.12, 1);
  });
});

// ────────────────────────────────────────
// Profile.bmiLabel
// ────────────────────────────────────────
describe('Profile.bmiLabel()', () => {
  test('18.5 미만 → 저체중', () => {
    const result = Profile.bmiLabel(18);
    expect(result.text).toBe('저체중');
    expect(result.cls).toBe('text-blue');
  });

  test('18.5 이상 23 미만 → 정상', () => {
    const result = Profile.bmiLabel(22);
    expect(result.text).toBe('정상');
    expect(result.cls).toBe('text-green');
  });

  test('23 이상 25 미만 → 과체중', () => {
    const result = Profile.bmiLabel(24);
    expect(result.text).toBe('과체중');
    expect(result.cls).toBe('text-amber');
  });

  test('25 이상 → 비만', () => {
    const result = Profile.bmiLabel(30);
    expect(result.text).toBe('비만');
    expect(result.cls).toBe('text-coral');
  });

  test('경계값 18.5 → 정상', () => {
    expect(Profile.bmiLabel(18.5).text).toBe('정상');
  });

  test('경계값 23.0 → 과체중', () => {
    expect(Profile.bmiLabel(23.0).text).toBe('과체중');
  });

  test('경계값 25.0 → 비만', () => {
    expect(Profile.bmiLabel(25.0).text).toBe('비만');
  });
});

// ────────────────────────────────────────
// Profile.getAgeGroup
// ────────────────────────────────────────
describe('Profile.getAgeGroup()', () => {
  test('25세 → 20대', () => {
    expect(Profile.getAgeGroup(25)).toBe(20);
  });

  test('30세 → 30대', () => {
    expect(Profile.getAgeGroup(30)).toBe(30);
  });

  test('35세 → 30대', () => {
    expect(Profile.getAgeGroup(35)).toBe(30);
  });

  test('59세 → 50대', () => {
    expect(Profile.getAgeGroup(59)).toBe(50);
  });

  test('15세(미만) → 20으로 클램프', () => {
    expect(Profile.getAgeGroup(15)).toBe(20);
  });

  test('10세 → 20으로 클램프', () => {
    expect(Profile.getAgeGroup(10)).toBe(20);
  });

  test('70세 → 60으로 클램프', () => {
    expect(Profile.getAgeGroup(70)).toBe(60);
  });

  test('65세 → 60으로 클램프', () => {
    expect(Profile.getAgeGroup(65)).toBe(60);
  });
});

// ────────────────────────────────────────
// Profile.getAverage
// ────────────────────────────────────────
describe('Profile.getAverage()', () => {
  test('남성 30대 평균 반환', () => {
    const avg = Profile.getAverage('male', 35);
    expect(avg).not.toBeNull();
    expect(avg.weight).toBe(74.8);
    expect(avg.bmi).toBeDefined();
    expect(avg.fat).toBeDefined();
    expect(avg.muscle).toBeDefined();
  });

  test('여성 40대 평균 반환', () => {
    const avg = Profile.getAverage('female', 45);
    expect(avg).not.toBeNull();
    expect(avg.weight).toBe(59.6);
  });

  test('존재하지 않는 성별 → null', () => {
    expect(Profile.getAverage('other', 30)).toBeNull();
  });

  test('성별 null → null', () => {
    expect(Profile.getAverage(null, 30)).toBeNull();
  });
});

// ────────────────────────────────────────
// Profile.genderLabel
// ────────────────────────────────────────
describe('Profile.genderLabel()', () => {
  test('male → 남성', () => {
    expect(Profile.genderLabel('male')).toBe('남성');
  });

  test('female → 여성', () => {
    expect(Profile.genderLabel('female')).toBe('여성');
  });
});

// ────────────────────────────────────────
// Profile.ageGroupLabel
// ────────────────────────────────────────
describe('Profile.ageGroupLabel()', () => {
  test('35 → 30대', () => {
    expect(Profile.ageGroupLabel(35)).toBe('30대');
  });

  test('20 → 20대', () => {
    expect(Profile.ageGroupLabel(20)).toBe('20대');
  });

  test('60 → 60대', () => {
    expect(Profile.ageGroupLabel(60)).toBe('60대');
  });
});
