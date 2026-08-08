import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@app/ui';
import { COLORS, type RootStackParamList, type ScanType } from '@app/shared';

interface Option {
  type: ScanType;
  emoji: string;
  title: string;
  desc: string;
}

const OPTIONS: Option[] = [
  {
    type: 'baseline',
    emoji: '📋',
    title: '基线扫描',
    desc: '安静状态下建立个人恢复基线，建议每周固定时间采集一次。',
  },
  {
    type: 'post_exercise',
    emoji: '⚡',
    title: '运动后扫描',
    desc: '运动后 2 小时内评估肌肉疲劳，获取针对性恢复方案。',
  },
];

export function ScanSelectScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const choose = (type: ScanType) => {
    nav.navigate('ScanPrepare', { scanType: type });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>选择扫描场景</Text>
      <Text style={styles.subtitle}>不同场景对应不同的评估算法</Text>

      <View style={styles.options}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.type} activeOpacity={0.9} onPress={() => choose(opt.type)}>
            <Card style={styles.optionCard}>
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </Card>
          </TouchableOpacity>
        ))}
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
    marginBottom: 24,
  },
  options: {
    gap: 16,
  },
  optionCard: {
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  optionDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
