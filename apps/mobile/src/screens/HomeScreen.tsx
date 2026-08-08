import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, ScoreRing } from '@app/ui';
import { COLORS, MOCK_DEVICE, MOCK_REPORT_BASELINE, type RootStackParamList } from '@app/shared';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>晚上好，跑者小王</Text>
        <Text style={styles.date}>8 月 8 日 周六</Text>
      </View>

      <Card>
        <View style={styles.statusRow}>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>设备状态</Text>
            <Text style={styles.statusValue}>
              {MOCK_DEVICE.isConnected ? '已连接 · TI-LEG-0001' : '未连接'}
            </Text>
          </View>
          <View style={[styles.dot, { backgroundColor: MOCK_DEVICE.isConnected ? COLORS.success : COLORS.danger }]} />
        </View>
      </Card>

      <Card style={styles.scoreCard}>
        <Text style={styles.sectionTitle}>今日恢复评分</Text>
        <View style={styles.scoreRow}>
          <ScoreRing score={MOCK_REPORT_BASELINE.overallScore} size={140} strokeWidth={14} />
          <View style={styles.scoreLabels}>
            <Text style={styles.scoreLabel}>综合恢复状态</Text>
            <Text style={styles.scoreStatus}>{MOCK_REPORT_BASELINE.statusLabel}</Text>
            <Text style={styles.scoreHint}>上次扫描：今天 07:30</Text>
          </View>
        </View>
      </Card>

      <TouchableOpacity activeOpacity={0.9} onPress={() => nav.navigate('ScanSelect')}>
        <Card style={styles.startCard}>
          <Text style={styles.startEmoji}>🔬</Text>
          <Text style={styles.startTitle}>开始全腿扫描</Text>
          <Text style={styles.startDesc}>运动后 2 小时内评估，恢复建议更精准</Text>
        </Card>
      </TouchableOpacity>

      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>今日恢复建议</Text>
        <Text style={styles.tipDesc}>{MOCK_REPORT_BASELINE.trainingAdvice}</Text>
      </Card>
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
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  date: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {},
  statusTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scoreCard: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  scoreLabels: {
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
  scoreHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  startCard: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: 28,
  },
  startEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  startTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  startDesc: {
    fontSize: 14,
    color: '#E0F2FE',
    marginTop: 6,
  },
  tipCard: {},
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  tipDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
