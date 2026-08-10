/**
 * 简易 token 存储
 *
 * 当前仅使用内存，避免引入额外原生依赖。
 * 后续可替换为 expo-secure-store 或 AsyncStorage。
 */
let memoryToken: string | null = null;

export async function setToken(token: string): Promise<void> {
  memoryToken = token;
}

export async function getToken(): Promise<string | null> {
  return memoryToken;
}

export async function removeToken(): Promise<void> {
  memoryToken = null;
}
