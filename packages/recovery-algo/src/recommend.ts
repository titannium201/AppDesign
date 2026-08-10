import { ScanReport, SportType } from '@app/shared';
import { scoreLabel } from '@app/shared';

function getTargetAreaName(name: string, side: 'left' | 'right'): string {
  const sideCn = side === 'left' ? '左' : '右';
  return `${sideCn}${name}`;
}

function buildMassageSuggestion(
  sortedMuscles: ScanReport['muscles'],
  sportType?: SportType,
): string {
  const targetCount = Math.min(3, sortedMuscles.length);
  if (targetCount === 0) return '';

  const targets = sortedMuscles
    .slice(0, targetCount)
    .map((m) => getTargetAreaName(m.name, m.side));

  const avgCrs =
    sortedMuscles.slice(0, targetCount).reduce((s, m) => s + m.crs, 0) /
    targetCount;
  const intensity = avgCrs < 40 ? 4 : avgCrs < 60 ? 3 : 2;
  const duration = avgCrs < 40 ? 20 : avgCrs < 60 ? 15 : 10;
  const mode = sportType === 'cycling' ? '骑车后恢复' : '跑步后恢复';

  return `如果使用按摩功能，推荐"${mode}"模式，力度 ${intensity}/5 级，时长 ${duration} 分钟，优先处理 ${targets.join('、')}。`;
}

function buildTrainingSuggestion(
  overallScore: number,
  sortedMuscles: ScanReport['muscles'],
  sportType?: SportType,
): string {
  if (overallScore >= 75) {
    return `今天可以按计划进行 ${sportType === 'cycling' ? '骑行' : '跑步'} 训练。`;
  }
  if (overallScore >= 50) {
    return `明天适合轻松${sportType === 'cycling' ? '骑' : '跑'}或低强度有氧，不建议加码。`;
  }

  const lowLeg = sortedMuscles.find(
    (m) => m.name === '腓肠肌' && m.crs < 50,
  );
  if (lowLeg && sportType !== 'cycling') {
    return '不建议安排冲刺、爬坡或高强度间歇，优先放松小腿后侧。';
  }

  const lowQuad = sortedMuscles.find(
    (m) => m.name === '股四头肌' && m.crs < 50,
  );
  if (lowQuad && sportType === 'cycling') {
    return '不建议高功率间歇或爬坡，优先放松股四头肌。';
  }

  return '建议休息或进行极低强度恢复活动，避免高强度刺激。';
}

function buildLimitations(
  sortedMuscles: ScanReport['muscles'],
  sportType?: SportType,
): string[] {
  const limitations: string[] = [];

  const lowGastroc = sortedMuscles.find(
    (m) => m.name === '腓肠肌' && m.crs < 50,
  );
  if (lowGastroc && sportType !== 'cycling') {
    limitations.push('腓肠肌恢复分低，不建议间歇跑/冲刺/爬坡。');
  }

  const lowTibialis = sortedMuscles.find(
    (m) => m.name === '胫骨前肌' && m.crs < 50,
  );
  if (lowTibialis && sportType !== 'cycling') {
    limitations.push('胫骨前肌恢复分低，不建议下坡跑和高冲击跑。');
  }

  const lowQuad = sortedMuscles.find(
    (m) => m.name === '股四头肌' && m.crs < 50,
  );
  if (lowQuad && sportType === 'cycling') {
    limitations.push('股四头肌恢复分低，不建议高功率间歇或爬坡。');
  }

  const lowHamstring = sortedMuscles.find(
    (m) => m.name === '腘绳肌' && m.crs < 50,
  );
  if (lowHamstring && sportType === 'cycling') {
    limitations.push('腘绳肌恢复分低，谨慎安排高踏频和大阻力。');
  }

  return limitations;
}

export function generateRecommendations(
  report: ScanReport,
  sportType?: SportType,
): string[] {
  const { overallScore, muscles } = report;
  const sortedMuscles = [...muscles].sort((a, b) => a.crs - b.crs);
  const weakest = sortedMuscles[0];

  const recommendations: string[] = [
    `下肢整体恢复准备度：${overallScore}/100，${scoreLabel(overallScore).label}。`,
  ];

  if (weakest) {
    recommendations.push(
      `主要拖累项：${getTargetAreaName(weakest.name, weakest.side)} 综合恢复分 ${weakest.crs}，状态${scoreLabel(weakest.crs).label}。`,
    );
  }

  const massage = buildMassageSuggestion(sortedMuscles, sportType);
  if (massage) recommendations.push(massage);

  const training = buildTrainingSuggestion(overallScore, sortedMuscles, sportType);
  if (training) recommendations.push(training);

  recommendations.push(...buildLimitations(sortedMuscles, sportType));

  return recommendations;
}

export function generateTrainingAdvice(
  report: ScanReport,
  sportType?: SportType,
): string {
  const { overallScore, muscles } = report;
  if (overallScore >= 75) {
    return `状态${scoreLabel(overallScore).label}，可按计划进行 ${sportType === 'cycling' ? '骑行' : '跑步'} 训练。`;
  }
  if (overallScore >= 50) {
    return '建议进行轻松恢复跑或低强度交叉训练，避免加码。';
  }

  const worst = [...muscles].sort((a, b) => a.crs - b.crs)[0];
  if (worst) {
    return `${getTargetAreaName(worst.name, worst.side)} 恢复不足，建议休息或极低强度活动。`;
  }

  return '建议休息，待恢复评分回升后再安排高强度训练。';
}
