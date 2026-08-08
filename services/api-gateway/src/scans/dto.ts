/**
 * 扫描 DTO（骨架）
 */

import type { LimbSide } from '@app/shared';

export class CreateScanSessionDto {
  userId!: string;
  side!: LimbSide;
  deviceSerial?: string;
  firmwareVersion?: string;
}

export class AppendScanPointDto {
  position!: [number, number, number];
  muscleId!: string;
  region!: string;
  side!: 'left' | 'right';
  metrics!: {
    sto2: number;
    deltaHbo2: number;
    deltaHhb: number;
    deltaHbt: number;
  };
}
