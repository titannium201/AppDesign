import { Module } from '@nestjs/common';
import { MassageController } from './massage.controller';
import { MassageService } from './massage.service';
import { ScansModule } from '../scans/scans.module';

@Module({
  imports: [ScansModule],
  controllers: [MassageController],
  providers: [MassageService],
})
export class MassageModule {}
