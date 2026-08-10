import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateScanRequest,
  ScanReport,
  ScanSummaryResponse,
} from '@app/shared';
import { NirsDataFrame } from '@app/nirs-sdk';
import {
  generateRecommendations,
  generateScanReport,
  generateTrainingAdvice,
} from '@app/recovery-algo';

@Injectable()
export class ScansService {
  private scans: ScanReport[] = [];
  /** 每个 Scan 对应的原始 NIRS 数据帧（内存存储，P0 阶段） */
  private nirsData = new Map<string, NirsDataFrame[]>();

  create(userId: string, dto: CreateScanRequest): ScanReport {
    const report = generateScanReport({
      scanType: dto.scanType,
      sportType: dto.sportType,
      exerciseDurationMin: dto.exerciseDurationMin,
      rpe: dto.rpe,
      muscleData: dto.muscleData,
    });

    report.recommendations = generateRecommendations(report, dto.sportType);
    report.trainingAdvice = generateTrainingAdvice(report, dto.sportType);

    const now = new Date().toISOString();
    report.id = uuidv4();
    report.userId = userId;
    report.deviceId = dto.deviceId;
    report.createdAt = now;

    this.scans.push(report);
    return report;
  }

  findByUser(userId: string): ScanSummaryResponse[] {
    return this.scans
      .filter((s) => s.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map((s) => ({
        id: s.id,
        scanType: s.scanType,
        sportType: s.sportType,
        overallScore: s.overallScore,
        confidence: s.confidence,
        completedAt: s.createdAt,
      }));
  }

  findById(scanId: string, userId?: string): ScanReport {
    const scan = this.scans.find((s) => s.id === scanId);
    if (!scan || (userId && scan.userId !== userId)) {
      throw new NotFoundException('Scan not found');
    }
    return scan;
  }

  /**
   * 追加 NIRS 硬件数据帧到指定 Scan
   */
  appendNirsData(scanId: string, frame: NirsDataFrame): ScanReport {
    const scan = this.findById(scanId);
    const list = this.nirsData.get(scanId) ?? [];
    list.push(frame);
    this.nirsData.set(scanId, list);

    // 更新 scan 的 deviceId，便于后续报告关联
    if (frame.deviceId && !scan.deviceId) {
      scan.deviceId = frame.deviceId;
    }

    return scan;
  }

  /**
   * 获取指定 Scan 已接收的 NIRS 数据帧
   */
  getNirsData(scanId: string): NirsDataFrame[] {
    this.findById(scanId);
    return this.nirsData.get(scanId) ?? [];
  }
}
