import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@app/ui';
import { COLORS, type UserProfileResponse } from '@app/shared';
import { getProfileWithFallback } from '../api';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserProfileResponse | null>(null);

  useEffect(() => {
    getProfileWithFallback().then(setUser);
  }, []);

  if (!user) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const fields = [
    { label: '昵称', value: user.nickname || '未设置' },
    { label: '邮箱', value: user.email },
    { label: '性别', value: user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '-' },
    { label: '年龄', value: user.age ? `${user.age} 岁` : '-' },
    { label: '身高', value: user.heightCm ? `${user.heightCm} cm` : '-' },
    { label: '体重', value: user.weightKg ? `${user.weightKg} kg` : '-' },
    { label: '运动类型', value: user.sportType === 'running' ? '跑步' : user.sportType === 'cycling' ? '骑行' : '其他' },
    { label: '周跑量', value: user.weeklyMileageKm ? `${user.weeklyMileageKm} km` : '-' },
  ];

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>我的</Text>

      <Card style={styles.avatarCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>🏃</Text>
        </View>
        <Text style={styles.name}>{user.nickname}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>基本信息</Text>
        {fields.map((f) => (
          <View key={f.label} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <Text style={styles.fieldValue}>{f.value}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
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
    marginBottom: 16,
  },
  avatarCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  fieldLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});
