import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, ScoreRing } from '@app/ui';
import {
  COLORS,
  generateMockReport,
  type MuscleScore,
  type RootStackParamList,
} from '@app/shared';

export function ScanReportScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 使用 mock 数据（后续根据 reportId 查后端或本地存储）
  const report = generateMockReport('post_exercise');
  const worstMuscles = [...report.muscles].sort((a, b) => a.crs - b.crs);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>扫描报告</Text>
      <Text style={styles.subtitle}>
        {report.scanType === 'baseline' ? '基线扫描' : '运动后扫描'} · {new Date(report.createdAt).toLocaleString('zh-CN')}
      </Text>

      <Card style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <ScoreRing score={report.overallScore} size={140} strokeWidth={14} />
          <View style={styles.scoreMeta}>
            <Text style={styles.scoreLabel}>综合恢复评分</Text>
            <Text style={styles.scoreStatus}>{report.statusLabel}</Text>
            <Text style={styles.confidence}>可信度：{report.confidence === 'high' ? '高' : report.confidence}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.muscleCard}>
        <Text style={styles.sectionTitle}>重点肌肉</Text>
        {worstMuscles.map((muscle) => (
          <MuscleRow key={`${muscle.name}-${muscle.side}`} muscle={muscle} />
        ))}
      </Card>

      <Card style={styles.adviceCard}>
        <Text style={styles.sectionTitle}>恢复建议</Text>
        {report.recommendations.map((rec, idx) => (
          <View key={idx} style={styles.recRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.recText}>{rec}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <Text style={styles.trainingTitle}>训练调整</Text>
        <Text style={styles.trainingText}>{report.trainingAdvice}</Text>
      </Card>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        <Button title="返回首页" variant="primary" size="lg" onPress={() => nav.navigate('MainTabs')} />
      </View>
    </ScrollView>
  );
}

function MuscleRow({ muscle }: { muscle: MuscleScore }) {
  return (
    <View style={styles.muscleRow}>
      <View style={styles.muscleInfo}>
        <Text style={styles.muscleName}>
          {muscle.side === 'left' ? '左' : '右'} · {muscle.name}
        </Text>
        <Text style={styles.muscleSub}>氧合 {muscle.sto2}% · 硬度 {muscle.lfr}</Text>
      </View>
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreBadgeText}>{muscle.crs}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  content: {
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  scoreCard: {
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  scoreMeta: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  scoreStatus: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  confidence: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  muscleCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  muscleInfo: {
    flex: 1,
  },
  muscleName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  muscleSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  adviceCard: {
    marginBottom: 16,
  },
  recRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bullet: {
    width: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  recText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  trainingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  actions: {
    marginTop: 8,
  },
});
