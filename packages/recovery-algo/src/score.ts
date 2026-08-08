import {
  Confidence,
  LateralitySummary,
  MuscleScore,
  PerMuscleData,
  RawScanInput,
  ScanReport,
  ScanType,
  SportType,
} from '@app/shared';
import { scoreLabel } from '@app/shared';

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeLinear(
  value: number,
  idealMin: number,
  idealMax: number,
): number {
  const center = (idealMin + idealMax) / 2;
  const halfRange = (idealMax - idealMin) / 2 || 1;
  const deviation = Math.abs(value - center) / halfRange;
  return clamp(100 - deviation * 50);
}

function scoreHigherIsBetter(value: number, min: number, max: number): number {
  const ratio = (value - min) / (max - min);
  return clamp(ratio * 100);
}

function scoreLowerIsBetter(value: number, min: number, max: number): number {
  const ratio = (value - min) / (max - min);
  return clamp(100 - ratio * 100);
}

export function computeOpticalRecoveryScore(data: PerMuscleData): number {
  const { optical, recovery } = data;

  const stO2Score = scoreHigherIsBetter(optical.stO2, 55, 85);
  const hbTScore = normalizeLinear(optical.hbT, 80, 140);

  let recoveryScore = 75;
  if (recovery?.recoverySlope !== undefined) {
    recoveryScore = scoreHigherIsBetter(recovery.recoverySlope, 0.5, 5);
  }
  if (recovery?.t90 !== undefined) {
    recoveryScore =
      (recoveryScore + scoreLowerIsBetter(recovery.t90, 5, 30)) / 2;
  }

  return clamp(stO2Score * 0.5 + hbTScore * 0.3 + recoveryScore * 0.2);
}

export function computeMechanicalRecoveryScore(data: PerMuscleData): number {
  const { mechanical } = data;

  const lfrScore = scoreLowerIsBetter(mechanical.lfr, 5, 50);
  const srScore = scoreHigherIsBetter(mechanical.sr, 10, 60);
  const frt90Score = scoreLowerIsBetter(mechanical.frt90, 1, 8);

  return clamp(lfrScore * 0.4 + srScore * 0.35 + frt90Score * 0.25);
}

export function computeThermalRecoveryScore(data: PerMuscleData): number {
  const { thermal } = data;

  const tSkinScore = normalizeLinear(thermal.tSkin, 30, 35);
  const qScore = normalizeLinear(thermal.q, 50, 300);

  let deltaScore = 85;
  if (thermal.deltaTSkin !== undefined) {
    deltaScore = clamp(100 - Math.abs(thermal.deltaTSkin) * 15);
  }

  return clamp(tSkinScore * 0.4 + qScore * 0.35 + deltaScore * 0.25);
}

export function computeLocalScanScore(data: PerMuscleData): number {
  const ors = computeOpticalRecoveryScore(data);
  const mrs = computeMechanicalRecoveryScore(data);
  const trs = computeThermalRecoveryScore(data);
  return clamp(ors * 0.5 + mrs * 0.3 + trs * 0.2);
}

export function computeSportLoadContext(
  scanType: ScanType,
  sportType?: SportType,
  exerciseDurationMin?: number,
  rpe?: number,
): number {
  if (scanType === 'baseline') return 85;

  const duration = exerciseDurationMin ?? 45;
  const effort = rpe ?? 5;
  const loadProxy = duration * effort;

  return clamp(100 - loadProxy / 10);
}

export function computeUserFeedbackScore(rpe?: number): number {
  if (rpe === undefined) return 70;
  return clamp(100 - (rpe - 1) * 10);
}

export function computeTrendScore(): number {
  return 70;
}

export function computeMuscleCRS(
  data: PerMuscleData,
  scanType: ScanType,
  sportType?: SportType,
  exerciseDurationMin?: number,
  rpe?: number,
): number {
  const localScanScore = computeLocalScanScore(data);
  const sportLoad = computeSportLoadContext(
    scanType,
    sportType,
    exerciseDurationMin,
    rpe,
  );
  const trend = computeTrendScore();
  const feedback = computeUserFeedbackScore(rpe);

  return clamp(
    localScanScore * 0.6 + sportLoad * 0.2 + trend * 0.1 + feedback * 0.1,
  );
}

const RUNNING_KEY_MUSCLES = [
  'gastrocnemius',
  'tibialis_anterior',
  'quadriceps',
  'hamstrings',
];

const CYCLING_KEY_MUSCLES = ['quadriceps', 'hamstrings', 'gastrocnemius'];

function getKeyMuscles(sportType?: SportType): string[] {
  if (sportType === 'cycling') return CYCLING_KEY_MUSCLES;
  return RUNNING_KEY_MUSCLES;
}

const MUSCLE_NAME_MAP: Record<string, string> = {
  gastrocnemius: '腓肠肌',
  tibialis_anterior: '胫骨前肌',
  quadriceps: '股四头肌',
  hamstrings: '腘绳肌',
};

function parseMuscleKey(key: string): { muscle: string; side: 'left' | 'right' } {
  const parts = key.toLowerCase().split('_');
  const side = parts[0] === 'left' ? 'left' : 'right';
  const muscle = parts.slice(1).join('_');
  return { muscle, side };
}

function buildMuscleScore(
  key: string,
  data: PerMuscleData,
  scanType: ScanType,
  sportType?: SportType,
  exerciseDurationMin?: number,
  rpe?: number,
): MuscleScore {
  const { muscle, side } = parseMuscleKey(key);
  const ors = computeOpticalRecoveryScore(data);
  const mrs = computeMechanicalRecoveryScore(data);
  const trs = computeThermalRecoveryScore(data);
  const crs = computeMuscleCRS(
    data,
    scanType,
    sportType,
    exerciseDurationMin,
    rpe,
  );

  return {
    name: MUSCLE_NAME_MAP[muscle] ?? muscle,
    side,
    crs: Math.round(crs),
    ors: Math.round(ors),
    mrs: Math.round(mrs),
    trs: Math.round(trs),
    sto2: Math.round(data.optical.stO2),
    hbt: Math.round(data.optical.hbT),
    tskin: Math.round(data.thermal.tSkin),
    lfr: Math.round(data.mechanical.lfr),
    sr: Math.round(data.mechanical.sr),
    frt90: Math.round(data.mechanical.frt90),
  };
}

function computeOverallScore(
  muscleScores: MuscleScore[],
  sportType?: SportType,
): number {
  if (muscleScores.length === 0) return 0;

  const keyMuscles = getKeyMuscles(sportType);
  const keyScores = muscleScores.filter((m) =>
    keyMuscles.includes(Object.keys(MUSCLE_NAME_MAP).find(
      (k) => MUSCLE_NAME_MAP[k] === m.name,
    ) ?? ''),
  );

  const avgCrs =
    muscleScores.reduce((sum, m) => sum + m.crs, 0) / muscleScores.length;

  const weakestKeyCrs =
    keyScores.length > 0
      ? Math.min(...keyScores.map((m) => m.crs))
      : Math.min(...muscleScores.map((m) => m.crs));

  return clamp(avgCrs * 0.6 + weakestKeyCrs * 0.4);
}

function computeLateralitySummary(
  muscleScores: MuscleScore[],
): LateralitySummary {
  const byMuscle: Record<string, { left?: MuscleScore; right?: MuscleScore }> =
    {};

  for (const score of muscleScores) {
    byMuscle[score.name] = byMuscle[score.name] || {};
    byMuscle[score.name][score.side] = score;
  }

  const summary: LateralitySummary = {};
  for (const [muscle, pair] of Object.entries(byMuscle)) {
    if (pair.left && pair.right) {
      const leftCrs = pair.left.crs;
      const rightCrs = pair.right.crs;
      const differencePercent =
        Math.abs(leftCrs - rightCrs) / Math.max(leftCrs, rightCrs, 1);
      summary[muscle] = {
        leftCrs,
        rightCrs,
        differencePercent: Math.round(differencePercent * 100),
      };
    }
  }

  return summary;
}

function determineConfidence(
  muscleCount: number,
  hasHistory: boolean,
  hasSportContext: boolean,
): Confidence {
  if (muscleCount >= 4 && hasHistory && hasSportContext) return 'high';
  if (muscleCount >= 4 && (hasHistory || hasSportContext)) return 'medium';
  if (muscleCount >= 2) return 'low';
  return 'invalid';
}

export function generateScanReport(input: RawScanInput): ScanReport {
  const { scanType, sportType, exerciseDurationMin, rpe, muscleData } = input;
  const now = new Date().toISOString();

  const muscleScores: MuscleScore[] = Object.entries(muscleData).map(
    ([key, data]) =>
      buildMuscleScore(
        key,
        data,
        scanType,
        sportType,
        exerciseDurationMin,
        rpe,
      ),
  );

  const overallScore = Math.round(
    computeOverallScore(muscleScores, sportType),
  );
  const { label } = scoreLabel(overallScore);

  computeLateralitySummary(muscleScores);

  const confidence = determineConfidence(
    muscleScores.length,
    false,
    !!sportType && exerciseDurationMin !== undefined,
  );

  return {
    id: '',
    userId: '',
    deviceId: undefined,
    scanType,
    sportType,
    exerciseDurationMin,
    rpe,
    overallScore,
    confidence,
    statusLabel: label,
    muscles: muscleScores,
    recommendations: [],
    trainingAdvice: '',
    createdAt: now,
  };
}
