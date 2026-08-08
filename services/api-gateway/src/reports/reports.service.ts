import { Injectable } from '@nestjs/common';
import type { ScanReport, PaginatedResponse } from '@app/shared';

/**
 * 报告服务接口（M6）
 */
export interface ReportsService {
  generateReport(sessionId: string): Promise<ScanReport>;
  getReport(reportId: string): Promise<ScanReport | null>;
  getHistory(userId: string, page: number, pageSize: number): Promise<PaginatedResponse<ScanReport>>;
}

@Injectable()
export class ReportsServiceImpl implements ReportsService {
  async generateReport(_sessionId: string): Promise<ScanReport> {
    throw new Error('generateReport not implemented');
  }

  async getReport(_reportId: string): Promise<ScanReport | null> {
    throw new Error('getReport not implemented');
  }

  async getHistory(
    _userId: string,
    _page: number,
    _pageSize: number
  ): Promise<PaginatedResponse<ScanReport>> {
    throw new Error('getHistory not implemented');
  }
}
