/**
 * API 基础配置
 *
 * 默认指向模拟器/本地 Metro 可访问的后端地址。
 * 真机调试时请通过 app.json extra.apiBaseUrl 或环境变量覆盖。
 */
import Constants from 'expo-constants';

export const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:3000/api/v1';
