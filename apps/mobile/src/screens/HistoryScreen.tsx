import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@app/ui';
import { COLORS, type ScanSummaryResponse } from '@app/shared';
import { listScansWithFallback } from '../api';

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [summaries, setSummaries] = useState<ScanSummaryResponse[]>([]);

  useEffect(() => {
    listScansWithFallback().then(setSummaries);
  }, []);

  const formatType = (scanType: ScanSummaryResponse['scanType']) =>
    scanType === 'baseline' ? '基线扫描' : '运动后扫描';

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>恢复记录</Text>
      <Text style={styles.subtitle}>最近扫描与恢复趋势</Text>

      {summaries.map((item) => (
        <Card key={item.id} style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <Text style={styles.recordType}>{formatType(item.scanType)}</Text>
            <Text style={styles.recordScore}>{item.overallScore} 分</Text>
          </View>
          <Text style={styles.recordDate}>{new Date(item.completedAt).toLocaleString('zh-CN')}</Text>
          <Text style={styles.recordAdvice}>置信度: {item.confidence}</Text>
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
