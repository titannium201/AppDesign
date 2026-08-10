import { Injectable, NotFoundException } from '@nestjs/common';
import { MassageRecommendationResponse } from '@app/shared';
import { ScansService } from '../scans/scans.service';

@Injectable()
export class MassageService {
  constructor(private readonly scansService: ScansService) {}

  recommend(
    userId: string,
    scanId: string,
  ): MassageRecommendationResponse {
    const scan = this.scansService.findById(scanId, userId);
    const muscles = [...scan.muscles].sort((a, b) => a.crs - b.crs);
    const targetCount = Math.min(3, muscles.length);
    const targets = muscles
      .slice(0, targetCount)
      .map((m) => `${m.side === 'left' ? '左' : '右'}${m.name}`);

    const avgCrs =
      muscles.slice(0, targetCount).reduce((s, m) => s + m.crs, 0) /
      Math.max(targetCount, 1);
    const intensity = avgCrs < 40 ? 4 : avgCrs < 60 ? 3 : 2;
    const durationMin = avgCrs < 40 ? 20 : avgCrs < 60 ? 15 : 10;
    const mode = scan.sportType === 'cycling' ? '骑车后恢复' : '跑步后恢复';

    return {
      scanId,
      mode,
      intensity,
      durationMin,
      targetAreas: targets,
    };
  }

  start(userId: string, scanId: string): { success: boolean } {
    const scan = this.scansService.findById(scanId, userId);
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }
    return { success: true };
  }
}
