import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScanType, SportType, PerMuscleData } from '@app/shared';

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
