import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card } from '@app/ui';
import { COLORS, type RootStackParamList } from '@app/shared';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('提示', '请输入有效邮箱和 6 位以上密码');
      return;
    }
    // mock 登录成功
    nav.navigate('ProfileForm');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>欢迎回来</Text>
      <Text style={styles.subtitle}>用邮箱登录以同步恢复数据</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>邮箱</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="runner@example.com"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>密码</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="输入密码"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
        />

        <Button title="登录" variant="primary" size="lg" onPress={handleLogin} />
      </Card>

      <Button title="跳过登录" variant="ghost" onPress={() => nav.navigate('ProfileForm')} />
    </KeyboardAvoidingView>
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
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
});
