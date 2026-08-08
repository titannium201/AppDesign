/**
 * 恢复建议引擎（骨架）
 */

import type {
  RecommendationEngine,
  MuscleAssessment,
  AssessmentContext,
  RecoveryRecommendation,
} from './types';
import { generateId } from '@app/shared';

/**
 * 创建恢复建议引擎
 *
 * TODO: 接入规则库与运动医学知识图谱。
 */
export function createRecommendationEngine(): RecommendationEngine {
  return {
    generate(
      assessments: MuscleAssessment[],
      _context: AssessmentContext
    ): RecoveryRecommendation[] {
      const recommendations: RecoveryRecommendation[] = [];

      const highRiskMuscles = assessments.filter(
        (a) => a.riskLevel === 'high' || a.riskLevel === 'severe'
      );

      if (highRiskMuscles.length > 0) {
        recommendations.push({
          recommendationId: generateId(),
          title: '优先休息',
          description: '高风险肌群建议 24-48 小时内避免高强度训练。',
          category: 'rest',
          priority: 5,
          targetMuscleIds: highRiskMuscles.map((m) => m.muscleId),
        });

        recommendations.push({
          recommendationId: generateId(),
          title: '气压按摩恢复',
          description: '针对高风险区域进行 15-20 分钟气压按摩，促进血液循环。',
          category: 'massage',
          durationMinutes: 20,
          priority: 4,
          targetMuscleIds: highRiskMuscles.map((m) => m.muscleId),
        });
      }

      const moderateRiskMuscles = assessments.filter((a) => a.riskLevel === 'moderate');
      if (moderateRiskMuscles.length > 0) {
        recommendations.push({
          recommendationId: generateId(),
          title: '轻度拉伸',
          description: '对中等疲劳肌群进行静态拉伸，每个动作保持 30 秒。',
          category: 'stretch',
          durationMinutes: 15,
          priority: 3,
          targetMuscleIds: moderateRiskMuscles.map((m) => m.muscleId),
        });
      }

      recommendations.push({
        recommendationId: generateId(),
        title: '补充水分与电解质',
        description: '训练后及时补水，必要时补充电解质。',
        category: 'hydration',
        priority: 2,
      });

      return recommendations.sort((a, b) => b.priority - a.priority);
    },
  };
}
