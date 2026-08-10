import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, SportType } from '@app/shared';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  nickname?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsIn(['male', 'female'])
  @IsOptional()
  gender?: Gender;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  age?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  heightCm?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  weightKg?: number;

  @IsIn(['running', 'cycling', 'both', 'other'])
  @IsOptional()
  sportType?: SportType;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  weeklyMileageKm?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  trainingTypes?: string[];

  @IsOptional()
  intervalConfig?: { distance: string; sets: number; targetPace?: string };

  @IsOptional()
  bestRace?: { distance: string; time: string; vdot?: number };

  @IsString()
  @IsOptional()
  targetEvent?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  injuryHistory?: string[];

  @IsString()
  @IsOptional()
  currentDiscomfort?: string;

  @IsString()
  @IsOptional()
  sleepQuality?: string;

  @IsString()
  @IsOptional()
  runningExperience?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  watchBrands?: string[];
}
