import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { ScansModule } from './scans/scans.module';
import { ReportsModule } from './reports/reports.module';
import { MassageModule } from './massage/massage.module';

/**
 * API Gateway 根模块
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    DevicesModule,
    ScansModule,
    ReportsModule,
    MassageModule,
  ],
})
export class AppModule {}
