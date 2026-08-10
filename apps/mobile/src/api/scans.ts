import {
  generateMockReport,
  MOCK_REPORT_BASELINE,
  type CreateScanRequest,
  type PerMuscleData,
  type ScanReportResponse,
  type ScanSummaryResponse,
} from '@app/shared';
import { apiRequest } from './client';

const DEFAULT_MUSCLES = [
  'quadriceps',
  'hamstrings',
  'calves',
  'glutes',
  'adductors',
  'tibialisAnterior',
];

function buildMockMuscleData(): Record<string, PerMuscleData> {
  return Object.fromEntries(
    DEFAULT_MUSCLES.map((muscle) => [
      muscle,
      {
        optical: {
          stO2: 50 + Math.random() * 40,
          hbT: 10 + Math.random() * 20,
        },
        thermal: {
          tSkin: 30 + Math.random() * 6,
          q: Math.random() * 100,
        },
        mechanical: {
          lfr: Math.random() * 100,
          sr: Math.random() * 100,
          frt90: 30 + Math.random() * 60,
        },
        recovery: {
          recoverySlope: Math.random() * 10,
          t50: 60 + Math.random() * 120,
          t90: 120 + Math.random() * 240,
        },
      } as PerMuscleData,
    ]),
  );
}

function buildMockSummaryFromReport(
  report: ScanReportResponse,
): ScanSummaryResponse {
  return {
    id: report.id,
    scanType: report.scanType,
    sportType: report.sportType,
    overallScore: report.overallScore,
    confidence: report.confidence,
    completedAt: report.createdAt ?? new Date().toISOString(),
  };
}

export async function listScans(): Promise<ScanSummaryResponse[]> {
  return apiRequest<ScanSummaryResponse[]>('/scans');
}

export async function createScan(
  data: Omit<CreateScanRequest, 'muscleData'>,
): Promise<ScanReportResponse> {
  const payload: CreateScanRequest = {
    ...data,
    muscleData: buildMockMuscleData(),
  };
  return apiRequest<ScanReportResponse>('/scans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getScanReport(
  scanId: string,
): Promise<ScanReportResponse> {
  return apiRequest<ScanReportResponse>(`/scans/${scanId}`);
}

export async function listScansWithFallback(): Promise<ScanSummaryResponse[]> {
  try {
    return await listScans();
  } catch (err) {
    console.warn('List scans API failed, fallback to mock:', err);
    return [
      buildMockSummaryFromReport(MOCK_REPORT_BASELINE),
      buildMockSummaryFromReport(generateMockReport('post_exercise')),
    ];
  }
}

export async function createScanWithFallback(
  data: Omit<CreateScanRequest, 'muscleData'>,
): Promise<ScanReportResponse> {
  try {
    return await createScan(data);
  } catch (err) {
    console.warn('Create scan API failed, fallback to mock:', err);
    const report = generateMockReport(data.scanType);
    return {
      ...report,
      id: `mock-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function getScanReportWithFallback(
  scanId: string,
): Promise<ScanReportResponse> {
  try {
    return await getScanReport(scanId);
  } catch (err) {
    console.warn('Get scan report API failed, fallback to mock:', err);
    if (scanId.includes('baseline')) return MOCK_REPORT_BASELINE;
    const report = generateMockReport('post_exercise');
    return { ...report, id: scanId };
  }
}
