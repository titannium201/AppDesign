import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateNirsMetrics,
  accumulateMuscleStress,
  createBaseline,
  csvFromRecords,
  evaluateOpticalLink,
  estimateNirsConfidence,
  estimateExperimentalSmo2,
  evaluateMuscleState,
  filterOpticalChannels,
  parseFirmwareLine,
  scorePhaseCandidate,
  stabilizeMuscleState,
  summarizeChannels,
} from "./protocol.js";

function channels(length = 300, scale = 1) {
  const result = {
    sourceRed: [],
    sourceIr: [],
    detectorRed: [],
    detectorIr: [],
  };
  for (let index = 0; index < length; index += 1) {
    const pulse = Math.sin((index / 100) * Math.PI * 2 * 1.2);
    result.sourceRed.push((40000 + 1800 * pulse) * scale);
    result.sourceIr.push((50000 + 2200 * pulse) * scale);
    result.detectorRed.push((8000 + 600 * pulse) * scale);
    result.detectorIr.push((10000 + 760 * pulse) * scale);
  }
  return result;
}

test("parses paired NIRS samples", () => {
  const parsed = parseFirmwareLine(
    JSON.stringify({
      type: "samples",
      sourceRed: [1, 2],
      sourceIr: [3, 4],
      detectorRed: [5, 6],
      detectorIr: [7, 8],
      rate: 100,
    }),
  );
  assert.equal(parsed.detectorIr[1], 8);
});

test("rejects mismatched sample arrays", () => {
  assert.equal(
    parseFirmwareLine(
      '{"type":"samples","sourceRed":[1],"sourceIr":[1,2],"detectorRed":[1],"detectorIr":[1]}',
    ),
    null,
  );
});

test("creates a baseline from recent samples", () => {
  const baseline = createBaseline(channels(), 100, 2);
  assert.equal(baseline.sampleCount, 200);
  assert.ok(baseline.detectorIr > 9000);
});

test("optical filter suppresses isolated spikes while preserving channel length", () => {
  const data = channels(300);
  data.detectorRed[150] = 250000;
  const filtered = filterOpticalChannels(data, 100, 2);
  assert.equal(filtered.detectorRed.length, 300);
  assert.ok(filtered.detectorRed[150] < 20000);
  assert.ok(Math.abs(filtered.detectorRed.at(-1) - data.detectorRed.at(-1)) < 1000);
});

test("reports zero trends when current signal equals baseline", () => {
  const data = channels();
  const baseline = createBaseline(data, 100, 3);
  const metrics = calculateNirsMetrics(data, baseline, 100);
  assert.ok(Math.abs(metrics.oxygenationTrend) < 0.01);
  assert.ok(Math.abs(metrics.bloodVolumeTrend) < 0.01);
  assert.ok(metrics.linkQuality > 0.5);
});

test("oxygenation trend responds to opposite red and IR changes", () => {
  const baseData = channels();
  const baseline = createBaseline(baseData, 100, 3);
  const changed = channels();
  changed.detectorRed = changed.detectorRed.map((value) => value * 1.02);
  changed.detectorIr = changed.detectorIr.map((value) => value * 0.98);
  const metrics = calculateNirsMetrics(changed, baseline, 100);
  assert.ok(metrics.oxygenationTrend > 30);
  assert.ok(Math.abs(metrics.deltaO2Hb + metrics.deltaHHb - metrics.deltaTHb) < 1e-9);
  assert.ok(Math.abs(metrics.deltaO2Hb - metrics.deltaHHb - metrics.hbDiff) < 1e-9);
});

test("confidence stays conservative and absolute SmO2 remains unavailable", () => {
  const data = channels();
  const baseline = createBaseline(data, 100, 3);
  const metrics = calculateNirsMetrics(data, baseline, 100);
  const confidence = estimateNirsConfidence(metrics, { passed: true, score: 1 });
  assert.ok(confidence.relative > 0);
  assert.ok(confidence.relative <= 0.75);
  assert.ok(confidence.o2Hb < confidence.relative);
  assert.equal(confidence.smo2, 0);
});

test("experimental SmO2 is reference anchored and explicitly low confidence", () => {
  const base = { baselineReady: true, ready: true, saturated: false, hbDiff: 0 };
  const atBaseline = estimateExperimentalSmo2(base, [], 70, 0.7);
  const lower = estimateExperimentalSmo2({ ...base, hbDiff: -20 }, [], 70, 0.7);
  const higher = estimateExperimentalSmo2({ ...base, hbDiff: 20 }, [], 70, 0.7);
  assert.equal(atBaseline.value, 70);
  assert.ok(lower.value < 70);
  assert.ok(higher.value > 70);
  assert.ok(atBaseline.confidence <= 0.25);
  assert.equal(estimateExperimentalSmo2(null).value, null);
  assert.equal(estimateExperimentalSmo2({ ...base, ready: false }).value, null);
});

test("muscle state model separates recovery, hard work and rising load", () => {
  const base = { baselineReady: true, ready: true, saturated: false, hbDiff: 0, deltaTHb: 0 };
  const recovery = evaluateMuscleState(base, [], 0.5);
  assert.equal(recovery.stateId, 1);
  assert.equal(recovery.readyForNextSet, true);

  const hard = evaluateMuscleState({ ...base, hbDiff: -20 }, [], 0.5);
  assert.equal(hard.stateId, 4);
  assert.ok(hard.score >= 70);

  const risingLoad = evaluateMuscleState(
    { ...base, hbDiff: -12, deltaTHb: -8 },
    [{ at: 0, oxygenation: 0 }, { at: 1000, oxygenation: -12 }],
    0.5,
  );
  assert.equal(risingLoad.stateId, 5);
});

test("muscle state is gated by confidence and MSS accumulates with duration", () => {
  const metrics = { baselineReady: true, ready: true, saturated: false, hbDiff: -20, deltaTHb: 0 };
  assert.equal(evaluateMuscleState(metrics, [], 0.05).valid, false);
  assert.equal(evaluateMuscleState({ ...metrics, ready: false }, [], 0.5).valid, false);
  const state = evaluateMuscleState(metrics, [], 0.5);
  const mss = accumulateMuscleStress(0, state, 60);
  assert.ok(mss > 0);
  assert.ok(mss < 2);
});

test("muscle state ignores falling baseline wander without deoxygenation", () => {
  const metrics = { baselineReady: true, ready: true, saturated: false, hbDiff: 25, deltaTHb: 10 };
  const history = [{ at: 0, oxygenation: 80 }, { at: 1000, oxygenation: 25 }];
  const state = evaluateMuscleState(metrics, history, 0.5);
  assert.equal(state.stateId, 1);
  assert.equal(state.score, 0);
});

test("muscle state stabilizer requires a sustained transition", () => {
  const current = {
    valid: true, stateId: 1, label: "恢复 / 静息", score: 0,
    confidence: 0.5, guidance: "stable",
  };
  const candidate = { ...current, stateId: 2, label: "轻松", score: 30 };
  assert.equal(stabilizeMuscleState(current, candidate, 1, 0.1).stateId, 1);
  assert.equal(stabilizeMuscleState(current, candidate, 3.1, 0.1).stateId, 2);
  assert.equal(stabilizeMuscleState(null, candidate, 1, 0.1).valid, false);
  assert.equal(stabilizeMuscleState(null, candidate, 1.6, 0.1).stateId, 2);
});

test("does not produce trends without calibration", () => {
  const metrics = calculateNirsMetrics(channels(), null, 100);
  assert.equal(metrics.oxygenationTrend, null);
  assert.equal(metrics.baselineReady, false);
});

test("exports stable CSV columns", () => {
  const csv = csvFromRecords([
    {
      timestamp: "2026-08-07T00:00:00.000Z",
      elapsedMs: 12.4,
      sourceRed: 1,
      sourceIr: 2,
      detectorRed: 3,
      detectorIr: 4,
      oxygenationTrend: 5.25,
      bloodVolumeTrend: -1.5,
      deltaO2Hb: 1.25,
      deltaHHb: -2.75,
      deltaTHb: -1.5,
      hbDiff: 4,
      relativeConfidence: 0.42,
      muscleStateId: 3,
      muscleStateLabel: "中等",
      muscleScore: 52,
      muscleStressScore: 1.25,
      muscleConfidence: 0.4,
      experimentalSmo2: 68.5,
      smo2Reference: 70,
      smo2Confidence: 0.18,
      linkQuality: 0.8,
      temperature: 30.1,
    },
  ]);
  assert.match(csv, /oxygenation_mOD/);
  assert.match(csv, /5\.2500/);
});

test("summarizes the latest optical window", () => {
  const data = channels(100);
  data.detectorRed.push(...Array(30).fill(12000));
  data.detectorIr.push(...Array(30).fill(14000));
  data.sourceRed.push(...Array(30).fill(40000));
  data.sourceIr.push(...Array(30).fill(50000));
  const summary = summarizeChannels(data, 100, 0.3);
  assert.equal(summary.sampleCount, 30);
  assert.equal(summary.detectorRed, 12000);
});

test("optical link test passes only when both detector wavelengths rise", () => {
  const dark = { detectorRed: 200, detectorIr: 240 };
  const passed = evaluateOpticalLink(dark, { detectorRed: 500, detectorIr: 620 });
  const failed = evaluateOpticalLink(dark, { detectorRed: 500, detectorIr: 250 });
  assert.equal(passed.passed, true);
  assert.equal(passed.reason, "passed");
  assert.equal(failed.passed, false);
  assert.equal(failed.reason, "ir_weak");
});

test("phase score removes dark level and rejects saturation", () => {
  const dark = { detectorRed: 200, detectorIr: 300 };
  assert.equal(
    scorePhaseCandidate({ detectorRed: 500, detectorIr: 900 }, dark),
    900,
  );
  assert.equal(
    scorePhaseCandidate({ detectorRed: 260000, detectorIr: 900 }, dark),
    -Infinity,
  );
});
