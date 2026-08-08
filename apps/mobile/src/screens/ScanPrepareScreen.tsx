import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card } from '@app/ui';
import { COLORS, SCAN_STEPS, type RootStackParamList, generateId } from '@app/shared';

export function ScanPrepareScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanPrepare'>>();
  const scanType = route.params.scanType;

  const start = () => {
    nav.navigate('Scanning', { scanType, sessionId: generateId('scan') });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>准备扫描</Text>
      <Text style={styles.subtitle}>
        {scanType === 'baseline' ? '基线扫描' : '运动后扫描'} · 约 2 分钟
      </Text>

      <Card style={styles.card}>
        <Text style={styles.section}>扫描流程</Text>
        {SCAN_STEPS.map((step, index) => (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </Card>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <Button title="开始扫描" variant="primary" size="lg" onPress={start} />
        <Button title="返回" variant="ghost" onPress={() => nav.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    marginBottom: 16,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  actions: {
    gap: 12,
  },
});
