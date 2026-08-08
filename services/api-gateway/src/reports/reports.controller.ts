import { Controller, Post, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

/**
 * 报告控制器（M6 扫描报告）
 */
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('sessions/:sessionId/generate')
  generateReport(@Param('sessionId') sessionId: string) {
    return this.reportsService.generateReport(sessionId);
  }

  @Get(':reportId')
  getReport(@Param('reportId') reportId: string) {
    return this.reportsService.getReport(reportId);
  }

  @Get('users/:userId/history')
  getHistory(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.reportsService.getHistory(userId, Number(page ?? 1), Number(pageSize ?? 20));
  }
}
