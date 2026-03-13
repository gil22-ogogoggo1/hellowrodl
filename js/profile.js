/**
 * profile.js — 사용자 프로필 및 한국인 평균 체성분 데이터
 */

const Profile = {
  get KEY() { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_profile`; },

  get() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || null;
    } catch {
      return null;
    }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  // ── 한국인 평균 체성분 기준 ──────────────────────────────────
  // 출처: 국민건강영양조사(KNHANES) 기반 추정값 (연령대·성별)
  // weight(kg), bmi, fat(체지방률 %), muscle(골격근량 kg)
  AVERAGES: {
    male: {
      20: { weight: 72.5, bmi: 23.4, fat: 18.2, muscle: 35.5 },
      30: { weight: 74.8, bmi: 24.1, fat: 20.3, muscle: 36.1 },
      40: { weight: 75.2, bmi: 24.4, fat: 21.8, muscle: 35.2 },
      50: { weight: 72.6, bmi: 23.9, fat: 23.4, muscle: 33.8 },
      60: { weight: 68.9, bmi: 23.4, fat: 25.1, muscle: 31.5 },
    },
    female: {
      20: { weight: 55.8, bmi: 21.8, fat: 27.2, muscle: 22.6 },
      30: { weight: 57.2, bmi: 22.4, fat: 28.9, muscle: 22.3 },
      40: { weight: 59.6, bmi: 23.3, fat: 30.8, muscle: 22.0 },
      50: { weight: 60.4, bmi: 23.7, fat: 33.2, muscle: 21.4 },
      60: { weight: 58.8, bmi: 23.5, fat: 36.0, muscle: 20.1 },
    },
  },

  // 나이를 10년 단위 그룹으로 변환 (20대~60대 범위 클램프)
  getAgeGroup(age) {
    const decade = Math.floor(parseInt(age) / 10) * 10;
    return Math.max(20, Math.min(60, decade));
  },

  getAverage(gender, age) {
    const group = this.getAgeGroup(age);
    return this.AVERAGES[gender]?.[group] || null;
  },

  // BMI 계산
  calcBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    return weightKg / Math.pow(heightCm / 100, 2);
  },

  // BMI 판정
  bmiLabel(bmi) {
    if (bmi < 18.5) return { text: '저체중', cls: 'text-blue' };
    if (bmi < 23.0) return { text: '정상', cls: 'text-green' };
    if (bmi < 25.0) return { text: '과체중', cls: 'text-amber' };
    return { text: '비만', cls: 'text-coral' };
  },

  // 성별 표시 텍스트
  genderLabel(gender) {
    return gender === 'male' ? '남성' : '여성';
  },

  // 연령대 표시 텍스트
  ageGroupLabel(age) {
    return `${this.getAgeGroup(age)}대`;
  },
};

// ── 테스트 환경 모듈 내보내기 (Node.js/Jest) ──
if (typeof module !== 'undefined') {
  module.exports = { Profile };
}
