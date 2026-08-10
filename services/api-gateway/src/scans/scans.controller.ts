import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScansService } from './scans.service';
import { CreateScanDto, NirsDataFrameDto } from './scans.dto';
import { ScanReportResponse, ScanSummaryResponse } from '@app/shared';

@Controller('scans')
@UseGuards(AuthGuard('jwt'))
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateScanDto,
  ): ScanReportResponse {
    return this.scansService.create(req.user.userId, dto);
  }

  @Get()
  list(@Request() req: { user: { userId: string } }): ScanSummaryResponse[] {
    return this.scansService.findByUser(req.user.userId);
  }

  @Get(':id')
  getReport(
    @Request() req: { user: { userId: string } },
    @Param('id') scanId: string,
  ): ScanReportResponse {
    return this.scansService.findById(scanId, req.user.userId);
  }

  /**
   * 接收经 NIRS SDK 限流后的单帧数据
   */
  @Post(':id/nirs-data')
  appendNirsData(
    @Request() req: { user: { userId: string } },
    @Param('id') scanId: string,
    @Body() dto: NirsDataFrameDto,
  ): { scanId: string; receivedFrames: number } {
    this.scansService.appendNirsData(scanId, dto as any);
    const frames = this.scansService.getNirsData(scanId);
    return {
      scanId,
      receivedFrames: frames.length,
    };
  }

  /**
   * 获取某 Scan 已接收的 NIRS 原始数据帧
   */
  @Get(':id/nirs-data')
  getNirsData(
    @Request() req: { user: { userId: string } },
    @Param('id') scanId: string,
  ) {
    return {
      scanId,
      frames: this.scansService.getNirsData(scanId),
    };
  }
}
