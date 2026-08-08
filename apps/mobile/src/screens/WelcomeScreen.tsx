import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card } from '@app/ui';
import { APP_NAME, APP_TAGLINE, COLORS, type RootStackParamList } from '@app/shared';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🦵</Text>
        </View>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.featureTitle}>全腿光学扫描</Text>
        <Text style={styles.featureDesc}>
          基于 mm-DOSI 与多模态传感器，快速评估腿部肌肉恢复状态。
        </Text>
        <View style={styles.divider} />
        <Text style={styles.featureTitle}>智能恢复建议</Text>
        <Text style={styles.featureDesc}>
          根据扫描报告生成个性化训练调整、拉伸与恢复方案。
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button
          title="登录 / 注册"
          variant="primary"
          size="lg"
          onPress={() => nav.navigate('Login')}
        />
        <Button
          title="先逛一逛"
          variant="ghost"
          onPress={() => nav.navigate('ProfileForm')}
        />
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
  hero: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
  },
  tagline: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  card: {
    marginBottom: 32,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  actions: {
    marginTop: 'auto',
    paddingBottom: 24 + 88,
    gap: 12,
  },
});
