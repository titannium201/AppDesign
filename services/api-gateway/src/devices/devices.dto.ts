import { IsString, IsOptional } from 'class-validator';

export class BindDeviceDto {
  @IsString()
  serial: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  firmwareVersion?: string;
}
