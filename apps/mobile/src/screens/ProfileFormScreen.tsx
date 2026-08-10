import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card } from '@app/ui';
import {
  COLORS,
  type RootStackParamList,
  type Gender,
  type SportType,
  type RunningExperience,
  type UserProfileResponse,
} from '@app/shared';
import { updateProfileWithFallback } from '../api';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'male', label: '男' },
  { key: 'female', label: '女' },
];

const SPORTS: { key: SportType; label: string }[] = [
  { key: 'running', label: '跑步' },
  { key: 'cycling', label: '骑行' },
  { key: 'both', label: '跑步 + 骑行' },
  { key: 'other', label: '其他' },
];

const EXPERIENCE: { key: RunningExperience; label: string }[] = [
  { key: '<1', label: '1 年以内' },
  { key: '1-2', label: '1-2 年' },
  { key: '3-5', label: '3-5 年' },
  { key: '5-10', label: '5-10 年' },
  { key: '>10', label: '10 年以上' },
];

export function ProfileFormScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [sport, setSport] = useState<SportType>('running');
  const [experience, setExperience] = useState<RunningExperience>('3-5');
  const [weeklyMileage, setWeeklyMileage] = useState('');

  const steps = ['基础信息', '运动习惯', '恢复目标'];

  const buildProfile = (): Partial<UserProfileResponse> => ({
    gender,
    age: age ? Number(age) : undefined,
    heightCm: height ? Number(height) : undefined,
    weightKg: weight ? Number(weight) : undefined,
    sportType: sport,
    runningExperience: experience,
    weeklyMileageKm: weeklyMileage ? Number(weeklyMileage) : undefined,
  });

  const next = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await updateProfileWithFallback(buildProfile());
        nav.navigate('MainTabs');
      } finally {
        setLoading(false);
      }
    }
  };

  const skip = () => nav.navigate('MainTabs');

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>完善信息</Text>
        <Text style={styles.subtitle}>用于更准确地评估恢复状态（可随时修改）</Text>
      </View>

      <View style={styles.stepRow}>
        {steps.map((s, i) => (
          <View
            key={s}
            style={[styles.stepPill, i === step && styles.stepPillActive]}>
            <Text style={[styles.stepText, i === step && styles.stepTextActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <Card>
            <Text style={styles.section}>基础身体信息</Text>
            <Text style={styles.label}>性别</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <Chip
                  key={g.key}
                  label={g.label}
                  selected={gender === g.key}
                  onPress={() => setGender(g.key)}
                />
              ))}
            </View>

            <Text style={styles.label}>年龄</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="28"
              placeholderTextColor={COLORS.textSecondary}
              value={age}
              onChangeText={setAge}
            />

            <Text style={styles.label}>身高 cm</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="178"
              placeholderTextColor={COLORS.textSecondary}
              value={height}
              onChangeText={setHeight}
            />

            <Text style={styles.label}>体重 kg</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="68"
              placeholderTextColor={COLORS.textSecondary}
              value={weight}
              onChangeText={setWeight}
            />
          </Card>
        )}

        {step === 1 && (
          <Card>
            <Text style={styles.section}>运动习惯</Text>
            <Text style={styles.label}>主要运动类型</Text>
            <View style={styles.chipRow}>
              {SPORTS.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  selected={sport === s.key}
                  onPress={() => setSport(s.key)}
                />
              ))}
            </View>

            <Text style={styles.label}>跑龄 / 运动年限</Text>
            <View style={styles.chipRowWrap}>
              {EXPERIENCE.map((e) => (
                <Chip
                  key={e.key}
                  label={e.label}
                  selected={experience === e.key}
                  onPress={() => setExperience(e.key)}
                />
              ))}
            </View>

            <Text style={styles.label}>周跑量 / 周运动量（km）</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="35"
              placeholderTextColor={COLORS.textSecondary}
              value={weeklyMileage}
              onChangeText={setWeeklyMileage}
            />
          </Card>
        )}

        {step === 2 && (
          <Card>
            <Text style={styles.section}>恢复目标</Text>
            <Text style={styles.desc}>
              你可以后续在「我的」页面补充目标赛事、伤病史与当前不适情况。
            </Text>
            <Text style={styles.desc}>
              现在完成即可开始首次扫描评估。
            </Text>
          </Card>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={loading ? '保存中...' : step === steps.length - 1 ? '完成' : '下一步'}
          variant="primary"
          size="lg"
          onPress={next}
          disabled={loading}
        />
        <Button title="跳过，稍后补充" variant="ghost" onPress={skip} disabled={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  stepPillActive: {
    backgroundColor: COLORS.primary,
  },
  stepText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#fff',
  },
  form: {
    flex: 1,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    color: COLORS.text,
    fontWeight: '500',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    color: '#fff',
  },
  desc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    gap: 12,
    paddingTop: 12,
  },
});
