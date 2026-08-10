/**
 * Mobile 开发阶段使用的 mock 数据
 */

import type { UserProfile, DeviceInfo, ScanReport, RecoveryPlan, ScanType } from './types';
import { generateId, scoreLabel } from './utils';

export const MOCK_USER: UserProfile = {
  id: generateId('user'),
  email: 'runner@example.com',
  nickname: '跑者小王',
  gender: 'male',
  age: 28,
  heightCm: 178,
  weightKg: 68,
  sportType: 'running',
  weeklyMileageKm: 35,
  trainingTypes: ['lsd', 'interval'],
  intervalConfig: { distance: '400m', sets: 10, targetPace: '4:00/km' },
  bestRace: { distance: '10k', time: '42:30', vdot: 52 },
  targetEvent: '10k_pb',
  injuryHistory: ['patella_pain'],
  currentDiscomfort: 'mild',
  sleepQuality: 'good',
  runningExperience: '3-5',
  watchBrands: ['garmin'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_DEVICE: DeviceInfo = {
  id: generateId('device'),
  serial: 'TI-LEG-0001',
  name: 'TI 全腿恢复仪',
  firmwareVersion: '1.0.0',
  isConnected: true,
  isBound: true,
  lastSeenAt: new Date().toISOString(),
};

function makeMuscle(name: string, side: 'left' | 'right', score: number) {
  return {
    name,
    side,
    crs: score,
    ors: clampScore(score + rand(-15, 15)),
    mrs: clampScore(score + rand(-20, 20)),
    trs: clampScore(score + rand(-10, 10)),
    sto2: rand(50, 80),
    hbt: rand(40, 90),
    tskin: rand(28, 34),
    hfr: rand(20, 120),
    lfr: rand(50, 150),
    sr: rand(20, 80),
    frt90: rand(1, 8),
  };
}

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function generateMockReport(scanType: ScanType): ScanReport {
  const baseScore = scanType === 'baseline' ? 78 : 48;
  const leftCalf = baseScore + rand(-10, 5);
  const rightCalf = baseScore + rand(-5, 10);
  const leftQuad = baseScore + rand(-8, 8);
  const rightQuad = baseScore + rand(-5, 12);
  const leftHam = baseScore + rand(-15, 5);
  const rightHam = baseScore + rand(-10, 8);
  const leftTib = baseScore + rand(-5, 15);
  const rightTib = baseScore + rand(-8, 10);

  const muscles = [
    makeMuscle('腓肠肌', 'left', clampScore(leftCalf)),
    makeMuscle('腓肠肌', 'right', clampScore(rightCalf)),
    makeMuscle('胫骨前肌', 'left', clampScore(leftTib)),
    makeMuscle('胫骨前肌', 'right', clampScore(rightTib)),
    makeMuscle('股四头肌', 'left', clampScore(leftQuad)),
    makeMuscle('股四头肌', 'right', clampScore(rightQuad)),
    makeMuscle('腘绳肌', 'left', clampScore(leftHam)),
    makeMuscle('腘绳肌', 'right', clampScore(rightHam)),
  ];

  const overallScore = clampScore(muscles.reduce((sum, m) => sum + m.crs, 0) / muscles.length);
  const { label } = scoreLabel(overallScore);

  const worst = [...muscles].sort((a, b) => a.crs - b.crs).slice(0, 3);

  const recommendations = [
    `对 ${worst[0].name}（${worst[0].side === 'left' ? '左' : '右'}）进行 8 分钟低强度冷敷恢复`,
    '增加小腿拉伸与泡沫轴放松，持续 3 天',
    '今晚睡眠目标 ≥ 7.5 小时，帮助氧合恢复',
    '明日可降低训练强度 20%，避免连续高强度冲击',
  ];

  if (scanType === 'post_exercise') {
    recommendations.unshift('运动后 2 小时内完成恢复干预效果最佳');
  }

  return {
    id: generateId('report'),
    userId: MOCK_USER.id,
    deviceId: MOCK_DEVICE.id,
    scanType,
    sportType: 'running',
    exerciseDurationMin: scanType === 'post_exercise' ? 60 : undefined,
    rpe: scanType === 'post_exercise' ? 6 : undefined,
    overallScore,
    confidence: 'high',
    statusLabel: label,
    muscles,
    recommendations,
    trainingAdvice:
      overallScore >= 70
        ? '状态良好，可按计划训练'
        : '建议进行低强度恢复，避免高冲击训练',
    createdAt: new Date().toISOString(),
  };
}

export const MOCK_REPORT_BASELINE = generateMockReport('baseline');
export const MOCK_REPORT_POST = generateMockReport('post_exercise');

export const MOCK_RECOVERY_PLAN: RecoveryPlan = {
  focusMuscles: ['腓肠肌', '股四头肌'],
  mode: '冷敷 + 气压 + 拉伸',
  intensity: 45,
  durationMin: 15,
  frequency: '每日 1 次，连续 3 天',
};
