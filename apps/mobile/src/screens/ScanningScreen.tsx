import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@app/ui';
import { COLORS, SCAN_STEPS, generateMockReport, type RootStackParamList } from '@app/shared';

const TOTAL_SECONDS = 120;

export function ScanningScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Scanning'>>();
  const { scanType } = route.params;

  const [seconds, setSeconds] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    if (seconds >= TOTAL_SECONDS) {
      const report = generateMockReport(scanType);
      nav.replace('ScanReport', { reportId: report.id });
      return;
    }
    const timer = setTimeout(() => {
      setSeconds((s) => s + 1);
      setStepIndex(Math.min(SCAN_STEPS.length - 1, Math.floor((seconds / TOTAL_SECONDS) * SCAN_STEPS.length)));
    }, 1000);
    return () => clearTimeout(timer);
  }, [seconds, scanType, nav]);

  const progress = seconds / TOTAL_SECONDS;
  const step = SCAN_STEPS[stepIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]}>
        <View style={styles.innerRing}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
        </View>
      </Animated.View>

      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.desc}>{step.desc}</Text>

      <Card style={styles.card}>
        <Text style={styles.statusTitle}>当前步骤</Text>
        <Text style={styles.statusStep}>
          {stepIndex + 1} / {SCAN_STEPS.length}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.hint}>请保持放松，避免移动腿部</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0,122,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  innerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  percent: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    width: '100%',
  },
  statusTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusStep: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
