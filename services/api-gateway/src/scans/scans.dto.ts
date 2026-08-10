import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScanType, SportType, PerMuscleData } from '@app/shared';
import type { NirsDataFrame } from '@app/nirs-sdk';

export class CreateScanDto {
  @IsIn(['baseline', 'post_exercise'])
  scanType: ScanType;

  @IsIn(['running', 'cycling', 'both', 'other'])
  @IsOptional()
  sportType?: SportType;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  exerciseDurationMin?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(10)
  rpe?: number;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsObject()
  muscleData: Record<string, PerMuscleData>;
}

/**
 * 单通道 NIRS 指标快照（仅用于校验输入结构）
 */
export class NirsMetricsSnapshotDto {
  @IsNumber()
  @IsOptional()
  stO2?: number;

  @IsNumber()
  @IsOptional()
  sto2?: number;

  @IsNumber()
  @IsOptional()
  hbO2?: number;

  @IsNumber()
  @IsOptional()
  hbo2?: number;

  @IsNumber()
  @IsOptional()
  hHb?: number;

  @IsNumber()
  @IsOptional()
  hhb?: number;

  @IsNumber()
  @IsOptional()
  hbT?: number;

  @IsNumber()
  @IsOptional()
  hbt?: number;

  @IsNumber()
  @IsOptional()
  tSkin?: number;

  @IsNumber()
  @IsOptional()
  tskin?: number;

  @IsNumber()
  @IsOptional()
  q?: number;

  @IsNumber()
  @IsOptional()
  lfr?: number;

  @IsNumber()
  @IsOptional()
  sr?: number;

  @IsNumber()
  @IsOptional()
  frt90?: number;

  @IsNumber()
  @IsOptional()
  recoverySlope?: number;

  @IsNumber()
  @IsOptional()
  t50?: number;

  @IsNumber()
  @IsOptional()
  t90?: number;

  @IsNumber()
  @IsOptional()
  perfusion?: number;

  @IsNumber()
  @IsOptional()
  bloodFlow?: number;
}

/**
 * 单通道 NIRS 样本
 */
export class NirsChannelSampleDto {
  @IsNumber()
  channelIndex: number;

  @IsNumber()
  timestamp: number;

  @ValidateNested()
  @Type(() => NirsMetricsSnapshotDto)
  metrics: NirsMetricsSnapshotDto;

  @IsObject()
  @IsOptional()
  rawIntensities?: Record<string, number>;
}

/**
 * NIRS 数据帧 DTO
 */
export class NirsDataFrameDto implements NirsDataFrame {
  @IsString()
  frameId: string;

  @IsString()
  deviceId: string;

  @IsNumber()
  deviceTimestamp: number;

  @IsNumber()
  receivedAt: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NirsChannelSampleDto)
  channels: NirsChannelSampleDto[];
}
