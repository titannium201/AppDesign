import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@app/ui';
import { COLORS, generateMockReport } from '@app/shared';

const reports = [
  generateMockReport('baseline'),
  generateMockReport('post_exercise'),
  generateMockReport('post_exercise'),
];

export function HistoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>恢复记录</Text>
      <Text style={styles.subtitle}>最近扫描与恢复趋势</Text>

      {reports.map((report, idx) => (
        <Card key={report.id} style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <Text style={styles.recordType}>
              {report.scanType === 'baseline' ? '基线扫描' : '运动后扫描'}
            </Text>
            <Text style={styles.recordScore}>{report.overallScore} 分</Text>
          </View>
          <Text style={styles.recordDate}>{new Date(report.createdAt).toLocaleString('zh-CN')}</Text>
          <Text style={styles.recordAdvice}>{report.trainingAdvice}</Text>
        </Card>
      ))}
    </ScrollView>
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
  recordCard: {
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordType: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  recordScore: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  recordDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  recordAdvice: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});
