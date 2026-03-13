/**
 * sync.js — 외부 데이터 연동 모듈
 * - Bluetooth 체중계 (Web Bluetooth API, GATT Weight Scale / Body Composition 프로파일)
 * - 삼성헬스 내보내기 (ZIP 또는 CSV)
 * - 인바디 / 일반 체중 CSV 가져오기
 */

const Sync = {
  // ── 삼성헬스 운동 타입 코드 → 앱 타입 ──────────────────────
  SH_EXERCISE: {
    1001: '런닝', 1002: '걷기', 1008: '자전거',
    2001: '웨이트', 10003: '수영',
  },

  // ── CSV 파서 (따옴표 포함 필드 처리) ────────────────────────
  parseCSV(text) {
    // BOM 제거
    const clean = text.replace(/^\uFEFF/, '').trim();
    const lines = clean.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = this._splitCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = this._splitCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] || '').trim(); });
      rows.push(row);
    }
    return rows;
  },

  _splitCSVLine(line) {
    const result = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur);
    return result;
  },

  // 날짜 문자열 → YYYY-MM-DD
  _normalizeDate(str) {
    if (!str) return null;
    // ISO 형식 (삼성헬스): 2024-01-15T09:30:00.000+0900
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    // YYYY.MM.DD or YYYY/MM/DD
    const m = str.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    return null;
  },

  // ── 파일 형식 자동 감지 ──────────────────────────────────────
  detectFormat(headers) {
    const all = headers.join(',').toLowerCase();
    if (all.includes('samsung') || all.includes('shealth')) {
      if (all.includes('exercise_type') || all.includes('exercise.start'))
        return 'samsung_exercise';
      return 'samsung_body';
    }
    if (all.includes('skeletal') || all.includes('골격근') || all.includes('inbody'))
      return 'inbody';
    if (all.includes('exercise') || all.includes('운동종류'))
      return 'generic_exercise';
    return 'generic_body';
  },

  // ── 삼성헬스 체성분 CSV 가져오기 ────────────────────────────
  importSamsungBody(csvText) {
    const rows = this.parseCSV(csvText);
    if (!rows.length) return { success: 0, skip: 0 };

    let success = 0, skip = 0;
    const H = Object.keys(rows[0]);

    // 헤더 키 찾기 헬퍼
    const findKey = (...keywords) =>
      H.find(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));

    const timeKey    = findKey('start_time');
    const weightKey  = findKey('weight');
    const fatKey     = findKey('total_body_fat', 'body_fat_ratio', 'fat_ratio', '체지방률');
    const muscleKey  = findKey('skeletal_muscle', 'muscle_mass', '골격근');
    const bmiKey     = findKey('bmi');
    const waterKey   = findKey('total_body_water', '체수분');

    rows.forEach(row => {
      try {
        const date   = this._normalizeDate(row[timeKey]);
        const weight = parseFloat(row[weightKey]);
        if (!date || isNaN(weight) || weight <= 0) { skip++; return; }

        // 중복 확인
        const dup = Storage.getAll('body').find(r => r.date === date && Math.abs(r.weight - weight) < 0.01);
        if (dup) { skip++; return; }

        Storage.add('body', {
          date, weight,
          fat:      fatKey    && row[fatKey]    ? parseFloat(row[fatKey])    : null,
          muscle:   muscleKey && row[muscleKey] ? parseFloat(row[muscleKey]) : null,
          bmi:      bmiKey    && row[bmiKey]    ? parseFloat(row[bmiKey])    : null,
          water:    waterKey  && row[waterKey]  ? parseFloat(row[waterKey])  : null,
          visceral: null,
          memo: '(삼성헬스 가져오기)',
        });
        success++;
      } catch { skip++; }
    });
    return { success, skip };
  },

  // ── 삼성헬스 운동 CSV 가져오기 ──────────────────────────────
  importSamsungExercise(csvText) {
    const rows = this.parseCSV(csvText);
    if (!rows.length) return { success: 0, skip: 0 };

    let success = 0, skip = 0;
    const H = Object.keys(rows[0]);
    const findKey = (...kw) => H.find(h => kw.some(k => h.toLowerCase().includes(k.toLowerCase())));

    const timeKey  = findKey('start_time');
    const typeKey  = findKey('exercise_type');
    const durKey   = findKey('duration');
    const distKey  = findKey('distance');
    const calKey   = findKey('calorie');

    rows.forEach(row => {
      try {
        const date = this._normalizeDate(row[timeKey]);
        if (!date) { skip++; return; }

        const typeCode = parseInt(row[typeKey] || '0');
        const type     = this.SH_EXERCISE[typeCode] || '기타';

        const durMs  = parseInt(row[durKey]  || '0');
        const distM  = parseFloat(row[distKey] || '0');
        const cal    = parseFloat(row[calKey]  || '0');

        const record = {
          date, type,
          duration: durMs  > 0 ? Math.round(durMs / 60000) : null,  // ms → 분
          distance: distM  > 0 ? parseFloat((distM / 1000).toFixed(2)) : null, // m → km
          memo: '(삼성헬스 가져오기)',
        };
        if (cal > 0) record.caloriesBurned = Math.round(cal);

        Storage.add('exercise', record);
        success++;
      } catch { skip++; }
    });
    return { success, skip };
  },

  // ── 인바디 / 일반 체중 CSV 가져오기 ─────────────────────────
  // 지원 형식: 인바디 앱 내보내기, 미밴드, 핏빗, 직접 작성 CSV
  importGenericBody(csvText) {
    const rows = this.parseCSV(csvText);
    if (!rows.length) return { success: 0, skip: 0 };

    let success = 0, skip = 0;
    const H = Object.keys(rows[0]);
    const findKey = (...kw) => H.find(h => kw.some(k => h.replace(/\s/g,'').toLowerCase().includes(k)));

    const dateKey   = findKey('날짜','date','측정일','time','일자');
    const weightKey = findKey('체중','weight','몸무게','wt');
    const fatKey    = findKey('체지방률','fat%','fat_pct','체지방','fatpercent','bodyfat');
    const muscleKey = findKey('골격근량','muscle','skeletal','근육량');
    const bmiKey    = findKey('bmi');
    const waterKey  = findKey('체수분','water','tbw');
    const visKey    = findKey('내장지방','visceral','vfat');

    rows.forEach(row => {
      try {
        const date   = this._normalizeDate(row[dateKey]);
        const weight = parseFloat(row[weightKey]);
        if (!date || isNaN(weight) || weight <= 0) { skip++; return; }

        const dup = Storage.getAll('body').find(r => r.date === date && Math.abs(r.weight - weight) < 0.01);
        if (dup) { skip++; return; }

        Storage.add('body', {
          date, weight,
          fat:      fatKey    && row[fatKey]    ? parseFloat(row[fatKey])    : null,
          muscle:   muscleKey && row[muscleKey] ? parseFloat(row[muscleKey]) : null,
          bmi:      bmiKey    && row[bmiKey]    ? parseFloat(row[bmiKey])    : null,
          water:    waterKey  && row[waterKey]  ? parseFloat(row[waterKey])  : null,
          visceral: visKey    && row[visKey]    ? parseInt(row[visKey])      : null,
          memo: '(CSV 가져오기)',
        });
        success++;
      } catch { skip++; }
    });
    return { success, skip };
  },

  // ── 삼성헬스 ZIP 처리 ────────────────────────────────────────
  async importSamsungZip(file) {
    if (typeof JSZip === 'undefined') {
      throw new Error('ZIP 처리 라이브러리를 로드할 수 없습니다.');
    }

    const zip = await JSZip.loadAsync(file);
    let bodyResult    = { success: 0, skip: 0 };
    let exerciseResult = { success: 0, skip: 0 };

    const entries = Object.keys(zip.files);

    for (const name of entries) {
      if (zip.files[name].dir) continue;
      const lower = name.toLowerCase();

      if (lower.includes('body_composition') || lower.includes('shealth.body')) {
        const text = await zip.files[name].async('string');
        const r = this.importSamsungBody(text);
        bodyResult.success += r.success;
        bodyResult.skip    += r.skip;
      }

      if (lower.includes('exercise') && lower.endsWith('.csv')) {
        const text = await zip.files[name].async('string');
        const r = this.importSamsungExercise(text);
        exerciseResult.success += r.success;
        exerciseResult.skip    += r.skip;
      }
    }

    return { body: bodyResult, exercise: exerciseResult };
  },

  // ── Bluetooth 체중계 연결 ────────────────────────────────────
  // 지원 기기: Bluetooth LE Weight Scale Profile (GATT 0x181D) 준수 기기
  // 예: 샤오미 Mi Scale, 핏빗 Aria, Withings, Garmin Index, 등
  async connectBluetoothScale() {
    if (!navigator.bluetooth) {
      throw new Error(
        'Bluetooth를 지원하지 않는 브라우저입니다.\n' +
        'Chrome 또는 Edge (데스크톱/안드로이드)에서 사용해주세요.\n' +
        '(iOS Safari는 미지원)'
      );
    }

    // Weight Scale (0x181D) 또는 Body Composition (0x181B) 서비스 검색
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [0x181D] },                                         // Weight Scale
        { services: [0x181B] },                                         // Body Composition
        { services: ['0000181d-0000-1000-8000-00805f9b34fb'] },
        { services: ['0000181b-0000-1000-8000-00805f9b34fb'] },
      ],
      optionalServices: [
        '0000181d-0000-1000-8000-00805f9b34fb',
        '0000181b-0000-1000-8000-00805f9b34fb',
        '00001530-1212-efde-1523-785feabcd123',  // Mi Scale 전용
      ],
    });

    const server = await device.gatt.connect();

    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        device.gatt.disconnect();
        reject(new Error('30초 내 측정값이 없습니다. 체중계 위에 올라서 주세요.'));
      }, 30000);

      let weight = null, fat = null, muscle = null, bmi = null;

      // ── Weight Measurement 특성 (0x2A9D) ──
      const tryWeightService = async () => {
        try {
          const svc  = await server.getPrimaryService('0000181d-0000-1000-8000-00805f9b34fb');
          const char = await svc.getCharacteristic('00002a9d-0000-1000-8000-00805f9b34fb');

          char.addEventListener('characteristicvaluechanged', (e) => {
            const dv     = e.target.value;
            const flags  = dv.getUint8(0);
            const isLbs  = (flags & 0x01) !== 0;
            const rawW   = dv.getUint16(1, true);
            weight = parseFloat((rawW * (isLbs ? 0.01 * 0.453592 : 0.005)).toFixed(2));

            // BMI / Height 포함 여부 (flag bit 2)
            if ((flags & 0x04) && dv.byteLength >= 6) {
              bmi = parseFloat((dv.getUint16(4, true) * 0.1).toFixed(1));
            }

            clearTimeout(timeout);
            device.gatt.disconnect();
            resolve({ weight, fat, muscle, bmi });
          });

          await char.startNotifications();
        } catch { /* Body Composition 시도 */ }
      };

      // ── Body Composition Measurement 특성 (0x2A9C) ──
      const tryBodyCompositionService = async () => {
        try {
          const svc  = await server.getPrimaryService('0000181b-0000-1000-8000-00805f9b34fb');
          const char = await svc.getCharacteristic('00002a9c-0000-1000-8000-00805f9b34fb');

          char.addEventListener('characteristicvaluechanged', (e) => {
            const dv    = e.target.value;
            const flags = dv.getUint16(0, true);
            let offset  = 2;

            // Body Fat % (항상 포함)
            fat = parseFloat((dv.getUint16(offset, true) * 0.1).toFixed(1));
            offset += 2;

            // Timestamp 포함 여부 (bit 1)
            if (flags & 0x02) offset += 7;
            // User ID 포함 여부 (bit 2)
            if (flags & 0x04) offset += 1;
            // BMI & Height 포함 여부 (bit 3)
            if ((flags & 0x08) && dv.byteLength > offset + 3) {
              bmi    = parseFloat((dv.getUint16(offset,     true) * 0.1).toFixed(1));
              offset += 2;
            }

            clearTimeout(timeout);
            device.gatt.disconnect();
            resolve({ weight, fat, muscle, bmi });
          });

          await char.startNotifications();
        } catch (e) {
          clearTimeout(timeout);
          reject(new Error('체중계 데이터를 읽지 못했습니다.\n기기가 표준 GATT를 지원하는지 확인해주세요.'));
        }
      };

      await tryWeightService();
      await tryBodyCompositionService();
    });
  },
};
