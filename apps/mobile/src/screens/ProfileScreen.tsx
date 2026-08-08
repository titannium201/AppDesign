import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@app/ui';
import { COLORS, MOCK_USER } from '@app/shared';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const fields = [
    { label: '昵称', value: MOCK_USER.nickname || '未设置' },
    { label: '邮箱', value: MOCK_USER.email },
    { label: '性别', value: MOCK_USER.gender === 'male' ? '男' : '女' },
    { label: '年龄', value: MOCK_USER.age ? `${MOCK_USER.age} 岁` : '-' },
    { label: '身高', value: MOCK_USER.heightCm ? `${MOCK_USER.heightCm} cm` : '-' },
    { label: '体重', value: MOCK_USER.weightKg ? `${MOCK_USER.weightKg} kg` : '-' },
    { label: '运动类型', value: '跑步' },
    { label: '周跑量', value: MOCK_USER.weeklyMileageKm ? `${MOCK_USER.weeklyMileageKm} km` : '-' },
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
        <Text style={styles.name}>{MOCK_USER.nickname}</Text>
        <Text style={styles.email}>{MOCK_USER.email}</Text>
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
