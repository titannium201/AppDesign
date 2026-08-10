import { MOCK_USER, type UserProfileResponse } from '@app/shared';
import { apiRequest } from './client';

export async function getProfile(): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>('/users/me');
}

export async function updateProfile(
  data: Partial<UserProfileResponse>,
): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getProfileWithFallback(): Promise<UserProfileResponse> {
  try {
    return await getProfile();
  } catch (err) {
    console.warn('Get profile API failed, fallback to mock:', err);
    return MOCK_USER;
  }
}

export async function updateProfileWithFallback(
  data: Partial<UserProfileResponse>,
): Promise<UserProfileResponse> {
  try {
    return await updateProfile(data);
  } catch (err) {
    console.warn('Update profile API failed, fallback to mock:', err);
    return { ...MOCK_USER, ...data };
  }
}
