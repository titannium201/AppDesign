import { Module } from '@nestjs/common';
import { ScansModule } from '../scans/scans.module';
import { ReportsController } from './reports.controller';
import { ReportsServiceImpl } from './reports.service';

@Module({
  imports: [ScansModule],
  controllers: [ReportsController],
  providers: [ReportsServiceImpl],
  exports: [ReportsServiceImpl],
})
export class ReportsModule {}
