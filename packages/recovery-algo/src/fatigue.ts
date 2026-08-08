/**
 * 疲劳评估器（骨架）
 */

import type {
  FatigueAssessor,
  MuscleFatigueInput,
  OverallFatigueInput,
  MuscleAssessment,
  ScanReport,
} from './types';
import { generateId } from '@app/shared';

/**
 * 创建疲劳评估器
 *
 * TODO: 接入真实生理模型与标定参数。
 */
export function createFatigueAssessor(): FatigueAssessor {
  return {
    assessMuscle(input: MuscleFatigueInput): MuscleAssessment {
      // 骨架实现：使用简单占位逻辑
      const avgSto2 =
        input.points.reduce((sum, p) => sum + p.metrics.sto2, 0) /
        Math.max(1, input.points.length);

      const fatigueScore = Math.round(Math.max(0, Math.min(100, 100 - avgSto2)));

      let riskLevel: MuscleAssessment['riskLevel'] = 'low';
      if (fatigueScore >= 75) riskLevel = 'severe';
      else if (fatigueScore >= 55) riskLevel = 'high';
      else if (fatigueScore >= 35) riskLevel = 'moderate';

      return {
        muscleId: input.muscleId,
        fatigueScore,
        riskLevel,
        keyMetrics: {
          sto2: avgSto2,
          deltaHbo2: 0,
          deltaHhb: 0,
          deltaHbt: 0,
        },
        summary: `${input.muscleId} 疲劳评分 ${fatigueScore}，风险等级 ${riskLevel}`,
      };
    },

    assessOverall(input: OverallFatigueInput): ScanReport {
      const muscleAssessments = input.muscleInputs.map((m) => this.assessMuscle(m));
      const overallFatigueScore = Math.round(
        muscleAssessments.reduce((sum, m) => sum + m.fatigueScore, 0) /
          Math.max(1, muscleAssessments.length)
      );

      let overallRiskLevel: ScanReport['overallRiskLevel'] = 'low';
      if (overallFatigueScore >= 75) overallRiskLevel = 'severe';
      else if (overallFatigueScore >= 55) overallRiskLevel = 'high';
      else if (overallFatigueScore >= 35) overallRiskLevel = 'moderate';

      return {
        reportId: generateId(),
        sessionId: input.context.sessionId,
        userId: input.context.userId,
        status: 'draft',
        generatedAt: new Date().toISOString(),
        overallFatigueScore,
        overallRiskLevel,
        muscleAssessments,
        recoveryRecommendationIds: [],
      };
    },
  };
}
