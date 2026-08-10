import {
  SportType,
  ScanType,
  Gender,
  IntervalConfig,
  BestRace,
  PerMuscleData,
  UserProfile,
  DeviceInfo,
  ScanReport,
} from './types';

export interface RegisterRequest {
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfileResponse;
}

export type UserProfileResponse = UserProfile;

export interface UpdateProfileRequest
  extends Partial<
    Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>
  > {}

export interface BindDeviceRequest {
  serial: string;
  name?: string;
  firmwareVersion?: string;
}

export type DeviceResponse = DeviceInfo;

export interface CreateScanRequest {
  scanType: ScanType;
  sportType?: SportType;
  exerciseDurationMin?: number;
  rpe?: number;
  deviceId?: string;
  muscleData: Record<string, PerMuscleData>;
}

export interface ScanSummaryResponse {
  id: string;
  scanType: ScanType;
  sportType?: SportType;
  overallScore: number;
  confidence: string;
  completedAt: string;
}

export type ScanReportResponse = ScanReport;

export interface MassageRecommendationResponse {
  scanId: string;
  mode: string;
  intensity: number;
  durationMin: number;
  targetAreas: string[];
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
