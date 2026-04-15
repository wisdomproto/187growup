// ================================================
// 한국 소아 성장 표준 데이터 (2017 질병관리청)
// 출처: 성장도표+데이터+테이블.xls
// ================================================

// ── LMS 행 타입 ──

interface LMSRow {
  age: number;
  L: number;
  M: number;
  S: number;
}

// ── 퍼센타일 데이터 (차트 표시용, LMS에서 자동 계산) ──

export interface HeightPercentile {
  age: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

/** LMS에서 특정 Z-score에 해당하는 키 역산 */
function heightFromLMS(lms: LMSRow, z: number): number {
  if (Math.abs(lms.L) < 0.001) {
    return Math.round(lms.M * Math.exp(lms.S * z) * 10) / 10;
  }
  const inside = 1 + lms.L * lms.S * z;
  if (inside <= 0) return 0;
  return Math.round(lms.M * Math.pow(inside, 1 / lms.L) * 10) / 10;
}

// Inverse normal CDF values used as the standard percentile z-scores.
const Z_P3 = -1.881;
const Z_P15 = -1.036;
const Z_P85 = 1.036;
const Z_P97 = 1.881;

/** LMS 테이블에서 3/15/50/85/97 퍼센타일 표준곡선 생성 */
function buildPercentiles(table: LMSRow[]): HeightPercentile[] {
  return table.map((lms) => ({
    age: lms.age,
    p3: heightFromLMS(lms, Z_P3),
    p15: heightFromLMS(lms, Z_P15),
    p50: Math.round(lms.M * 10) / 10,
    p85: heightFromLMS(lms, Z_P85),
    p97: heightFromLMS(lms, Z_P97),
  }));
}

export function getHeightStandard(gender: 'male' | 'female'): HeightPercentile[] {
  const table = gender === 'male' ? MALE_HEIGHT_LMS : FEMALE_HEIGHT_LMS;
  return buildPercentiles(table);
}

// ── LMS 데이터 (백분위·Z-score·예측키 계산용) ──
// L: Box-Cox power, M: median, S: coefficient of variation

// 남아 키 LMS (만 2~18세, 6개월 단위)
const MALE_HEIGHT_LMS: LMSRow[] = [
  { age: 2, L: 1, M: 87.1161, S: 0.0351 },
  { age: 2.5, L: 1, M: 91.9327, S: 0.037 },
  { age: 3, L: -1.0915, M: 96.4961, S: 0.0403 },
  { age: 3.5, L: -0.5827, M: 99.793, S: 0.0401 },
  { age: 4, L: -0.1597, M: 103.0749, S: 0.04 },
  { age: 4.5, L: 0.1897, M: 106.344, S: 0.0399 },
  { age: 5, L: 0.4242, M: 109.5896, S: 0.0398 },
  { age: 5.5, L: 0.3787, M: 112.7735, S: 0.04 },
  { age: 6, L: 0.1783, M: 115.9183, S: 0.0403 },
  { age: 6.5, L: 0.0563, M: 119.0136, S: 0.0406 },
  { age: 7, L: 0.0492, M: 122.0537, S: 0.0406 },
  { age: 7.5, L: 0.0397, M: 125.0114, S: 0.0406 },
  { age: 8, L: 0.1205, M: 127.8793, S: 0.0405 },
  { age: 8.5, L: 0.2339, M: 130.6754, S: 0.0404 },
  { age: 9, L: 0.1885, M: 133.4136, S: 0.0405 },
  { age: 9.5, L: 0.021, M: 136.1026, S: 0.041 },
  { age: 10, L: -0.0752, M: 138.8473, S: 0.0417 },
  { age: 10.5, L: -0.0489, M: 141.7059, S: 0.0426 },
  { age: 11, L: 0.0886, M: 144.701, S: 0.0438 },
  { age: 11.5, L: 0.4064, M: 147.9321, S: 0.0453 },
  { age: 12, L: 0.8928, M: 151.4223, S: 0.0465 },
  { age: 12.5, L: 1.458, M: 155.0459, S: 0.0469 },
  { age: 13, L: 2.0111, M: 158.6245, S: 0.0463 },
  { age: 13.5, L: 2.6754, M: 162.0038, S: 0.0445 },
  { age: 14, L: 3.3119, M: 164.965, S: 0.0417 },
  { age: 14.5, L: 3.6315, M: 167.3647, S: 0.0388 },
  { age: 15, L: 3.5208, M: 169.1812, S: 0.0363 },
  { age: 15.5, L: 2.9809, M: 170.4684, S: 0.0345 },
  { age: 16, L: 2.154, M: 171.3949, S: 0.0332 },
  { age: 16.5, L: 1.3966, M: 172.0897, S: 0.0323 },
  { age: 17, L: 0.9751, M: 172.6404, S: 0.0321 },
  { age: 17.5, L: 0.6595, M: 173.1222, S: 0.0321 },
  { age: 18, L: 0.3638, M: 173.6037, S: 0.032 },
];

// 여아 키 LMS (만 2~18세, 6개월 단위)
const FEMALE_HEIGHT_LMS: LMSRow[] = [
  { age: 2, L: 1, M: 85.7153, S: 0.0376 },
  { age: 2.5, L: 1, M: 90.6797, S: 0.0389 },
  { age: 3, L: 0.5472, M: 95.4078, S: 0.0413 },
  { age: 3.5, L: 0.2825, M: 98.6465, S: 0.0407 },
  { age: 4, L: 0.1129, M: 101.8943, S: 0.0401 },
  { age: 4.5, L: -0.0216, M: 105.1425, S: 0.0395 },
  { age: 5, L: -0.1404, M: 108.3714, S: 0.039 },
  { age: 5.5, L: -0.0272, M: 111.5656, S: 0.0388 },
  { age: 6, L: 0.2115, M: 114.7289, S: 0.0388 },
  { age: 6.5, L: 0.2769, M: 117.8257, S: 0.0391 },
  { age: 7, L: 0.0163, M: 120.8229, S: 0.0396 },
  { age: 7.5, L: -0.3571, M: 123.7505, S: 0.0402 },
  { age: 8, L: -0.5993, M: 126.6703, S: 0.041 },
  { age: 8.5, L: -0.779, M: 129.6197, S: 0.0416 },
  { age: 9, L: -0.8812, M: 132.6442, S: 0.0423 },
  { age: 9.5, L: -0.6545, M: 135.8116, S: 0.0432 },
  { age: 10, L: -0.1573, M: 139.1218, S: 0.0438 },
  { age: 10.5, L: 0.4653, M: 142.4689, S: 0.044 },
  { age: 11, L: 1.1242, M: 145.7568, S: 0.0435 },
  { age: 11.5, L: 1.8239, M: 148.8746, S: 0.0421 },
  { age: 12, L: 2.3447, M: 151.6571, S: 0.0402 },
  { age: 12.5, L: 2.5648, M: 154.0138, S: 0.0382 },
  { age: 13, L: 2.5607, M: 155.9198, S: 0.0362 },
  { age: 13.5, L: 2.3149, M: 157.3292, S: 0.0348 },
  { age: 14, L: 2.0549, M: 158.3159, S: 0.0339 },
  { age: 14.5, L: 1.967, M: 159.0139, S: 0.0334 },
  { age: 15, L: 1.79, M: 159.4917, S: 0.033 },
  { age: 15.5, L: 1.3515, M: 159.8149, S: 0.0328 },
  { age: 16, L: 0.8678, M: 160.0286, S: 0.0325 },
  { age: 16.5, L: 0.332, M: 160.1342, S: 0.032 },
  { age: 17, L: -0.164, M: 160.2483, S: 0.0316 },
  { age: 17.5, L: -0.311, M: 160.4524, S: 0.0313 },
  { age: 18, L: -0.4107, M: 160.6484, S: 0.0311 },
];

// ── 체중 LMS 데이터 (표준체중.CSV, 6개월 단위, 0~18세) ──

// 남아 체중 LMS (만 0~18세)
const MALE_WEIGHT_LMS: LMSRow[] = [
  { age: 0, L: 0.3487, M: 3.3464, S: 0.146 },
  { age: 0.25, L: 0.1738, M: 6.3762, S: 0.1173 },
  { age: 0.5, L: 0.1257, M: 7.934, S: 0.1096 },
  { age: 0.75, L: 0.0917, M: 8.9014, S: 0.1088 },
  { age: 1, L: 0.0644, M: 9.6479, S: 0.1093 },
  { age: 1.5, L: 0.0211, M: 10.9385, S: 0.1112 },
  { age: 2, L: -0.0137, M: 12.1515, S: 0.1143 },
  { age: 2.5, L: -0.0431, M: 13.3, S: 0.1178 },
  { age: 3, L: 0.0567, M: 14.7381, S: 0.0969 },
  { age: 3.5, L: -0.299, M: 15.7775, S: 0.1038 },
  { age: 4, L: -0.5361, M: 16.8276, S: 0.1099 },
  { age: 4.5, L: -0.6998, M: 17.8888, S: 0.1153 },
  { age: 5, L: -0.8162, M: 18.9625, S: 0.1202 },
  { age: 5.5, L: -0.9106, M: 20.0814, S: 0.1254 },
  { age: 6, L: -0.9753, M: 21.3417, S: 0.1318 },
  { age: 6.5, L: -0.9576, M: 22.7267, S: 0.1388 },
  { age: 7, L: -0.8993, M: 24.2214, S: 0.146 },
  { age: 7.5, L: -0.8208, M: 25.8155, S: 0.1537 },
  { age: 8, L: -0.7076, M: 27.5321, S: 0.1613 },
  { age: 8.5, L: -0.5621, M: 29.3761, S: 0.1685 },
  { age: 9, L: -0.416, M: 31.3251, S: 0.1756 },
  { age: 9.5, L: -0.2869, M: 33.3742, S: 0.1823 },
  { age: 10, L: -0.17, M: 35.5349, S: 0.1882 },
  { age: 10.5, L: -0.0612, M: 37.8103, S: 0.1929 },
  { age: 11, L: 0.0333, M: 40.2146, S: 0.1966 },
  { age: 11.5, L: 0.1071, M: 42.7515, S: 0.1992 },
  { age: 12, L: 0.1618, M: 45.4253, S: 0.1998 },
  { age: 12.5, L: 0.2081, M: 48.1693, S: 0.198 },
  { age: 13, L: 0.2503, M: 50.9021, S: 0.1942 },
  { age: 13.5, L: 0.2841, M: 53.5329, S: 0.1882 },
  { age: 14, L: 0.3023, M: 55.9927, S: 0.1802 },
  { age: 14.5, L: 0.2993, M: 58.2029, S: 0.1711 },
  { age: 15, L: 0.2818, M: 60.1106, S: 0.162 },
  { age: 15.5, L: 0.2514, M: 61.7129, S: 0.1537 },
  { age: 16, L: 0.1829, M: 63.055, S: 0.1468 },
  { age: 16.5, L: 0.0862, M: 64.1526, S: 0.1418 },
  { age: 17, L: 0.0282, M: 65.0469, S: 0.1387 },
  { age: 17.5, L: -0.0068, M: 65.8907, S: 0.1359 },
  { age: 18, L: -0.0469, M: 66.7186, S: 0.1334 },
];

// 여아 체중 LMS (만 0~18세)
const FEMALE_WEIGHT_LMS: LMSRow[] = [
  { age: 0, L: 0.3809, M: 3.2322, S: 0.1417 },
  { age: 0.25, L: 0.0402, M: 5.8458, S: 0.1262 },
  { age: 0.5, L: -0.0756, M: 7.297, S: 0.122 },
  { age: 0.75, L: -0.1507, M: 8.2254, S: 0.122 },
  { age: 1, L: -0.2024, M: 8.9481, S: 0.1227 },
  { age: 1.5, L: -0.2637, M: 10.2315, S: 0.1231 },
  { age: 2, L: -0.2941, M: 11.4775, S: 0.1239 },
  { age: 2.5, L: -0.3101, M: 12.7055, S: 0.1259 },
  { age: 3, L: 0.5656, M: 14.1998, S: 0.0991 },
  { age: 3.5, L: -0.0428, M: 15.2236, S: 0.1064 },
  { age: 4, L: -0.4372, M: 16.2585, S: 0.1124 },
  { age: 4.5, L: -0.6987, M: 17.3046, S: 0.1175 },
  { age: 5, L: -0.876, M: 18.3616, S: 0.122 },
  { age: 5.5, L: -0.984, M: 19.4555, S: 0.127 },
  { age: 6, L: -0.9954, M: 20.6619, S: 0.134 },
  { age: 6.5, L: -0.9411, M: 21.9702, S: 0.1418 },
  { age: 7, L: -0.8685, M: 23.387, S: 0.1497 },
  { age: 7.5, L: -0.7852, M: 24.9161, S: 0.1574 },
  { age: 8, L: -0.6971, M: 26.5602, S: 0.1643 },
  { age: 8.5, L: -0.6214, M: 28.3163, S: 0.1705 },
  { age: 9, L: -0.5521, M: 30.2033, S: 0.1758 },
  { age: 9.5, L: -0.4623, M: 32.2323, S: 0.1806 },
  { age: 10, L: -0.3496, M: 34.4014, S: 0.1852 },
  { age: 10.5, L: -0.2377, M: 36.7011, S: 0.1882 },
  { age: 11, L: -0.1419, M: 39.0908, S: 0.1884 },
  { age: 11.5, L: -0.0641, M: 41.4657, S: 0.1862 },
  { age: 12, L: -0.0241, M: 43.74, S: 0.1818 },
  { age: 12.5, L: -0.0326, M: 45.8261, S: 0.1756 },
  { age: 13, L: -0.0745, M: 47.6564, S: 0.1679 },
  { age: 13.5, L: -0.129, M: 49.2069, S: 0.1603 },
  { age: 14, L: -0.1734, M: 50.5233, S: 0.1536 },
  { age: 14.5, L: -0.1869, M: 51.6479, S: 0.1476 },
  { age: 15, L: -0.1846, M: 52.5631, S: 0.1424 },
  { age: 15.5, L: -0.1901, M: 53.2482, S: 0.1382 },
  { age: 16, L: -0.21, M: 53.7253, S: 0.1351 },
  { age: 16.5, L: -0.2499, M: 54.0055, S: 0.1326 },
  { age: 17, L: -0.3423, M: 54.0797, S: 0.1306 },
  { age: 17.5, L: -0.4627, M: 54.0634, S: 0.1289 },
  { age: 18, L: -0.5908, M: 54.0217, S: 0.1273 },
];

// ── LMS 계산 함수 ──

/** 나이에 맞는 LMS 행을 선형 보간 */
function interpolateLMS(age: number, table: LMSRow[]): LMSRow | null {
  if (table.length === 0) return null;
  if (age <= table[0].age) return table[0];
  if (age >= table[table.length - 1].age) return table[table.length - 1];

  for (let i = 0; i < table.length - 1; i++) {
    if (age >= table[i].age && age <= table[i + 1].age) {
      const t = (age - table[i].age) / (table[i + 1].age - table[i].age);
      return {
        age,
        L: table[i].L + t * (table[i + 1].L - table[i].L),
        M: table[i].M + t * (table[i + 1].M - table[i].M),
        S: table[i].S + t * (table[i + 1].S - table[i].S),
      };
    }
  }
  return table[0];
}

/** LMS → Z-score. 일반식: Z = ((X/M)^L - 1) / (L*S), L=0이면 Z = ln(X/M)/S */
function zScoreFromLMS(value: number, lms: LMSRow): number {
  if (Math.abs(lms.L) < 0.001) {
    return Math.log(value / lms.M) / lms.S;
  }
  return (Math.pow(value / lms.M, lms.L) - 1) / (lms.L * lms.S);
}

/** Z-score → 백분위수 (정규분포 CDF, Abramowitz & Stegun 근사) */
function zToPercentile(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const erf = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return Math.max(0, Math.min(100, ((1 + sign * erf) / 2) * 100));
}

/**
 * LMS 기반 키 백분위수
 * @returns 백분위수 (0~100, 소수 1자리)
 */
export function calculateHeightPercentileLMS(
  height: number,
  age: number,
  gender: 'male' | 'female',
): number {
  const table = gender === 'male' ? MALE_HEIGHT_LMS : FEMALE_HEIGHT_LMS;
  const lms = interpolateLMS(age, table);
  if (!lms) return 50;
  const z = zScoreFromLMS(height, lms);
  return Math.round(zToPercentile(z) * 10) / 10;
}

/**
 * LMS 기반 체중 백분위수
 * @returns 백분위수 (0~100, 소수 1자리)
 */
export function calculateWeightPercentileLMS(
  weight: number,
  age: number,
  gender: 'male' | 'female',
): number {
  const table = gender === 'male' ? MALE_WEIGHT_LMS : FEMALE_WEIGHT_LMS;
  const lms = interpolateLMS(age, table);
  if (!lms) return 50;
  const z = zScoreFromLMS(weight, lms);
  return Math.round(zToPercentile(z) * 10) / 10;
}

/**
 * LMS 기반 예측 성인키 (현재 퍼센타일 유지 가정)
 * 현재 Z-score를 구한 뒤, 18세 기준 같은 Z-score의 키를 역산
 * @returns 예측 성인키(cm, 소수 1자리)
 */
/**
 * 특정 나이에서 동일 Z-score의 키를 역산 (예측 경로용)
 * @param currentHeight 현재 키
 * @param currentAge 현재 나이
 * @param targetAge 구하고 싶은 나이
 * @param gender 성별
 * @returns 해당 나이에서의 예상 키 (cm)
 */
export function heightAtSamePercentile(
  currentHeight: number,
  currentAge: number,
  targetAge: number,
  gender: 'male' | 'female',
): number {
  const table = gender === 'male' ? MALE_HEIGHT_LMS : FEMALE_HEIGHT_LMS;
  const currentLms = interpolateLMS(currentAge, table);
  const targetLms = interpolateLMS(targetAge, table);
  if (!currentLms || !targetLms) return 0;

  const z = zScoreFromLMS(currentHeight, currentLms);
  return heightFromLMS(targetLms, z);
}

export function predictAdultHeightLMS(
  height: number,
  age: number,
  gender: 'male' | 'female',
): number {
  const table = gender === 'male' ? MALE_HEIGHT_LMS : FEMALE_HEIGHT_LMS;
  const currentLms = interpolateLMS(age, table);
  const adultLms = table[table.length - 1]; // 18세
  if (!currentLms) return 0;

  const z = zScoreFromLMS(height, currentLms);

  // 역변환: X = M * (1 + L*S*Z)^(1/L), L≈0이면 X = M * exp(S*Z)
  if (Math.abs(adultLms.L) < 0.001) {
    return Math.round(adultLms.M * Math.exp(adultLms.S * z) * 10) / 10;
  }
  const inside = 1 + adultLms.L * adultLms.S * z;
  if (inside <= 0) return 0;
  return Math.round(adultLms.M * Math.pow(inside, 1 / adultLms.L) * 10) / 10;
}
