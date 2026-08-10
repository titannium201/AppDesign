import { MOCK_USER, type AuthResponse, type LoginRequest, type RegisterRequest } from '@app/shared';
import { apiRequest } from './client';
import { setToken } from './storage';

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  if (res.accessToken) {
    await setToken(res.accessToken);
  }
  return res;
}

export async function register(info: RegisterRequest): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/users/register', {
    method: 'POST',
    body: JSON.stringify(info),
  });
  if (res.accessToken) {
    await setToken(res.accessToken);
  }
  return res;
}

export async function loginWithFallback(
  credentials: LoginRequest,
): Promise<AuthResponse> {
  try {
    return await login(credentials);
  } catch (err) {
    console.warn('Login API failed, fallback to mock:', err);
    await setToken('mock-token');
    return {
      accessToken: 'mock-token',
      user: MOCK_USER,
    };
  }
}

export async function registerWithFallback(
  info: RegisterRequest,
): Promise<AuthResponse> {
  try {
    return await register(info);
  } catch (err) {
    console.warn('Register API failed, fallback to mock:', err);
    await setToken('mock-token');
    return {
      accessToken: 'mock-token',
      user: MOCK_USER,
    };
  }
}
