const CHANNEL_KEYS = [
  "sourceRed",
  "sourceIr",
  "detectorRed",
  "detectorIr",
];

export function parseFirmwareLine(line) {
  if (typeof line !== "string" || !line.trim()) return null;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return null;
  }
  if (!message || typeof message.type !== "string") return null;

  if (message.type === "samples") {
    const arrays = CHANNEL_KEYS.map((key) => message[key]);
    if (
      arrays.some((values) => !Array.isArray(values) || values.length === 0) ||
      new Set(arrays.map((values) => values.length)).size !== 1 ||
      arrays.some((values) => values.some((value) => !Number.isFinite(value)))
    ) {
      return null;
    }
    message.rate = Number.isFinite(message.rate) ? message.rate : 100;
  }
  return message;
}

export function filterOpticalChannels(channels, sampleRate = 100, cutoffHz = 2) {
  const length = commonLength(channels);
  if (!length) return Object.fromEntries(CHANNEL_KEYS.map((key) => [key, []]));
  const safeRate = Math.max(1, Number(sampleRate) || 100);
  const safeCutoff = clamp(Number(cutoffHz) || 2, 0.5, safeRate * 0.45);
  const alpha = 1 - Math.exp((-2 * Math.PI * safeCutoff) / safeRate);
  const filtered = {};
  for (const key of CHANNEL_KEYS) {
    const input = channels[key].slice(0, length);
    const output = new Array(length);
    let lowPass = input[0];
    for (let index = 0; index < length; index += 1) {
      const start = Math.max(0, index - 4);
      const median = medianOf(input.slice(start, index + 1));
      lowPass += alpha * (median - lowPass);
      output[index] = lowPass;
    }
    filtered[key] = output;
  }
  return filtered;
}

export function createBaseline(channels, sampleRate = 100, seconds = 3, cutoffHz = 2) {
  const filteredChannels = filterOpticalChannels(channels, sampleRate, cutoffHz);
  const length = commonLength(filteredChannels);
  const required = Math.max(50, Math.round(sampleRate));
  if (length < required) return null;
  const count = Math.min(length, Math.round(sampleRate * seconds));
  const baseline = { sampleCount: count };
  for (const key of CHANNEL_KEYS) {
    baseline[key] = mean(filteredChannels[key].slice(length - count));
    if (!Number.isFinite(baseline[key]) || baseline[key] <= 0) return null;
  }
  return baseline;
}

export function calculateNirsMetrics(
  channels,
  baseline = null,
  sampleRate = 100,
  shortSeparationWeight = 0.5,
  filterCutoffHz = 2,
) {
  const length = commonLength(channels);
  if (length < Math.max(50, Math.round(sampleRate * 0.75))) {
    return emptyMetrics(length);
  }

  // Match the three-second calibration window so the instant immediately
  // after calibration resolves to a true zero instead of a pulse-phase bias.
  const filteredChannels = filterOpticalChannels(channels, sampleRate, filterCutoffHz);
  const count = Math.min(length, Math.round(sampleRate * 3));
  const recent = {};
  const values = {};
  for (const key of CHANNEL_KEYS) {
    recent[key] = filteredChannels[key].slice(length - count);
    values[key] = mean(recent[key]);
  }

  const sourceLevel = Math.min(values.sourceRed, values.sourceIr);
  const detectorLevel = Math.min(values.detectorRed, values.detectorIr);
  const saturated = Object.values(values).some((value) => value >= 250000);
  const sourcePresent = sourceLevel > 700;
  const detectorPresent = detectorLevel > 180;

  const redCorrelation = safeAbsCorrelation(
    recent.sourceRed,
    recent.detectorRed,
  );
  const irCorrelation = safeAbsCorrelation(
    recent.sourceIr,
    recent.detectorIr,
  );
  const syncQuality = (redCorrelation + irCorrelation) / 2;
  const levelQuality = Math.min(
    clamp((sourceLevel - 500) / 4500, 0, 1),
    clamp((detectorLevel - 128) / 2200, 0, 1),
  );
  const linkQuality = saturated
    ? 0
    : clamp(levelQuality * 0.6 + syncQuality * 0.4, 0, 1);

  let redOd = null;
  let irOd = null;
  let shortRedOd = null;
  let shortIrOd = null;
  let correctedRedOd = null;
  let correctedIrOd = null;
  let oxygenationTrend = null;
  let bloodVolumeTrend = null;
  let deltaO2Hb = null;
  let deltaHHb = null;
  let deltaTHb = null;
  let hbDiff = null;

  if (baseline && hasValidBaseline(baseline)) {
    redOd = opticalDensity(values.detectorRed, baseline.detectorRed);
    irOd = opticalDensity(values.detectorIr, baseline.detectorIr);
    shortRedOd = opticalDensity(values.sourceRed, baseline.sourceRed);
    shortIrOd = opticalDensity(values.sourceIr, baseline.sourceIr);
    correctedRedOd = redOd - shortSeparationWeight * shortRedOd;
    correctedIrOd = irOd - shortSeparationWeight * shortIrOd;

    // These are relative modified Beer-Lambert-law trend indices. Without a
    // measured differential pathlength factor and subject calibration they are
    // deliberately reported in milli-optical-density, not micromolar Hb.
    oxygenationTrend = (correctedIrOd - correctedRedOd) * 1000;
    bloodVolumeTrend = ((correctedIrOd + correctedRedOd) / 2) * 1000;

    // A transparent two-component trend decomposition. These are
    // mOD-equivalent relative indices, not absolute micromolar concentrations.
    hbDiff = oxygenationTrend;
    deltaTHb = bloodVolumeTrend;
    deltaO2Hb = (deltaTHb + hbDiff) / 2;
    deltaHHb = (deltaTHb - hbDiff) / 2;
  }

  return {
    ready: sourcePresent && detectorPresent && !saturated,
    sourcePresent,
    detectorPresent,
    saturated,
    linkQuality,
    syncQuality,
    redCorrelation,
    irCorrelation,
    values,
    baselineReady: oxygenationTrend != null,
    oxygenationTrend,
    bloodVolumeTrend,
    deltaO2Hb,
    deltaHHb,
    deltaTHb,
    hbDiff,
    redOd,
    irOd,
    shortRedOd,
    shortIrOd,
    correctedRedOd,
    correctedIrOd,
    sampleCount: count,
    filterCutoffHz,
  };
}

export function estimateNirsConfidence(metrics, opticalResult = null) {
  if (!metrics?.baselineReady || !metrics.ready || metrics.saturated) {
    return { relative: 0, o2Hb: 0, hHb: 0, tHb: 0, hbDiff: 0, smo2: 0 };
  }
  const diagnosticQuality = opticalResult?.passed
    ? clamp(Number.isFinite(opticalResult.score) ? opticalResult.score : 0.5, 0, 1)
    : 0;
  // Cap relative estimates below 100% because the LEDs, pathlength and tissue
  // scattering are not instrument-calibrated on this prototype.
  const relative = clamp(
    (0.65 * clamp(metrics.linkQuality, 0, 1) + 0.35 * diagnosticQuality) * 0.75,
    0,
    0.75,
  );
  return {
    relative,
    o2Hb: relative * 0.8,
    hHb: relative * 0.8,
    tHb: relative,
    hbDiff: relative,
    // Absolute SmO2 has no defensible confidence without reference calibration.
    smo2: 0,
  };
}

export function estimateExperimentalSmo2(
  metrics,
  history = [],
  referencePercent = 70,
  relativeConfidence = 0,
) {
  if (!metrics?.baselineReady || !metrics.ready || metrics.saturated || !Number.isFinite(metrics.hbDiff)) {
    return { value: null, confidence: 0, reference: null, delta: null };
  }
  const reference = clamp(Number(referencePercent) || 70, 30, 95);
  const range = history
    .map((point) => Math.abs(point.oxygenation ?? point.hbDiff))
    .filter(Number.isFinite);
  const personalScale = Math.max(20, percentile(range, 0.9));
  // Reference-anchored display estimate: zero HbDiff equals the entered
  // baseline percentage and the observed session range maps smoothly to a
  // limited ±18 percentage-point change. This is not absolute oximetry.
  const delta = 18 * Math.tanh(metrics.hbDiff / personalScale);
  return {
    value: clamp(reference + delta, 5, 95),
    confidence: clamp(relativeConfidence * 0.35, 0, 0.25),
    reference,
    delta,
  };
}

const MUSCLE_STATE_LABELS = {
  1: "恢复 / 静息",
  2: "轻松",
  3: "中等",
  4: "高强度",
  5: "负荷上升",
};

export function evaluateMuscleState(metrics, history = [], confidence = 0) {
  const hbDiff = metrics?.hbDiff;
  const deltaTHb = metrics?.deltaTHb;
  if (
    !metrics?.baselineReady ||
    !metrics.ready ||
    metrics.saturated ||
    !Number.isFinite(hbDiff) ||
    !Number.isFinite(deltaTHb) ||
    confidence < 0.1
  ) {
    return emptyMuscleState("需要通过光路验证并完成稳定基线");
  }

  const usableHistory = history.filter((point) =>
    Number.isFinite(point.at) &&
    Number.isFinite(point.oxygenation ?? point.hbDiff),
  );
  const deoxygenationHistory = usableHistory.map((point) =>
    Math.max(0, -(point.oxygenation ?? point.hbDiff)),
  );
  // Personalize the range to the current session while keeping a stable floor
  // during the first minutes after baseline calibration.
  const personalScale = Math.max(12, percentile(deoxygenationHistory, 0.9));
  const demand = clamp(Math.max(0, -hbDiff) / personalScale, 0, 1.5);
  const compression = clamp(Math.max(0, -deltaTHb) / personalScale, 0, 1);

  let slope = 0;
  if (usableHistory.length >= 2) {
    const latest = usableHistory.at(-1);
    const horizon = latest.at - 1500;
    const first = usableHistory.find((point) => point.at >= horizon) ?? usableHistory[0];
    const elapsedSeconds = Math.max(0.05, (latest.at - first.at) / 1000);
    slope = ((latest.oxygenation ?? latest.hbDiff) - (first.oxygenation ?? first.hbDiff)) / elapsedSeconds;
  }
  const falling = clamp(-slope / (personalScale * 0.35), 0, 1);
  const recovering = clamp(slope / (personalScale * 0.25), 0, 1);
  // A falling slope is meaningful only when there is also measurable
  // deoxygenation. Gating it by demand prevents harmless baseline wander from
  // looking like muscle work while the user is still.
  const slopeDemandGate = clamp(demand * 2, 0, 1);
  const score = Math.round(100 * clamp(
    0.68 * demand + 0.2 * falling * slopeDemandGate + 0.12 * compression,
    0,
    1,
  ));

  let stateId;
  if ((demand < 0.12 && compression < 0.12) || (recovering > 0.2 && demand < 0.8)) {
    stateId = 1;
  } else if (demand > 0.2 && falling > 0.55 && compression > 0.25) {
    stateId = 5;
  } else if (score >= 70) {
    stateId = 4;
  } else if (score >= 40) {
    stateId = 3;
  } else {
    stateId = 2;
  }

  const readyForNextSet = stateId === 1 && score <= 15;
  return {
    valid: true,
    stateId,
    label: MUSCLE_STATE_LABELS[stateId],
    score,
    confidence: clamp(confidence, 0, 0.75),
    demand,
    compression,
    slope,
    personalScale,
    readyForNextSet,
    guidance: readyForNextSet
      ? "相对趋势已回到恢复区，可考虑下一组"
      : stateId === 1
        ? "正在回氧，继续观察趋势是否稳定"
        : stateId === 5
          ? "检测到快速去氧与血容量下降，可能处于收缩负荷期"
          : stateId >= 4
            ? "局部氧需求较高，当前强度不宜长时间维持"
            : stateId === 3
              ? "中等且相对可持续，继续关注去氧趋势"
              : "局部负荷较轻，可持续观察",
  };
}

export function stabilizeMuscleState(
  current,
  candidate,
  candidateDurationSeconds = 0,
  elapsedSeconds = 0.05,
) {
  const heldFor = Math.max(0, Number(candidateDurationSeconds) || 0);
  const elapsed = clamp(Number(elapsedSeconds) || 0.05, 0.001, 1);

  if (!candidate?.valid) {
    if (current?.valid && heldFor < 2) {
      return {
        ...current,
        confidence: 0,
        guidance: "信号短暂不稳，暂时保持上一状态",
      };
    }
    return candidate ?? emptyMuscleState();
  }

  if (!current?.valid) {
    return heldFor >= 1.5
      ? candidate
      : emptyMuscleState("正在确认稳定状态…");
  }

  // Smooth the displayed score independently of the classification so the
  // number does not jump even when the candidate state remains unchanged.
  const alpha = 1 - Math.exp(-elapsed / 2.5);
  const previousScore = Number.isFinite(current.score) ? current.score : candidate.score;
  const smoothedScore = Math.round(previousScore + alpha * (candidate.score - previousScore));
  const smoothedCandidate = { ...candidate, score: smoothedScore };
  if (candidate.stateId === current.stateId) return smoothedCandidate;

  const jump = Math.abs(candidate.stateId - current.stateId);
  const requiredHold = jump >= 2 ? 1.5 : 3;
  if (heldFor < requiredHold) {
    return {
      ...current,
      score: smoothedScore,
      confidence: Math.min(current.confidence, candidate.confidence),
      guidance: `状态 ${candidate.stateId} 正在确认，暂不切换`,
    };
  }
  return smoothedCandidate;
}

export function accumulateMuscleStress(currentScore, muscleState, elapsedSeconds) {
  const current = Number.isFinite(currentScore) ? Math.max(0, currentScore) : 0;
  if (!muscleState?.valid || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return current;
  const stateWeight = [0, 0, 0.2, 0.5, 0.85, 1][muscleState.stateId] ?? 0;
  const intensity = clamp(0.55 * (muscleState.score / 100) + 0.45 * stateWeight, 0, 1);
  // At uninterrupted maximum experimental load, 60 minutes accumulates 100.
  return current + (intensity * elapsedSeconds) / 36;
}

export function csvFromRecords(records) {
  const header = [
    "timestamp",
    "elapsed_ms",
    "source_red",
    "source_ir",
    "detector_red",
    "detector_ir",
    "oxygenation_mOD",
    "blood_volume_mOD",
    "delta_o2hb_mOD_eq",
    "delta_hhb_mOD_eq",
    "delta_thb_mOD_eq",
    "hbdiff_mOD_eq",
    "relative_confidence",
    "muscle_state",
    "muscle_state_label",
    "instant_muscle_score",
    "experimental_mss",
    "muscle_state_confidence",
    "experimental_smo2_percent",
    "smo2_reference_percent",
    "smo2_confidence",
    "link_quality",
    "temperature_c",
  ];
  const rows = records.map((record) =>
    [
      record.timestamp,
      Math.round(record.elapsedMs),
      record.sourceRed,
      record.sourceIr,
      record.detectorRed,
      record.detectorIr,
      finiteOrBlank(record.oxygenationTrend, 4),
      finiteOrBlank(record.bloodVolumeTrend, 4),
      finiteOrBlank(record.deltaO2Hb, 4),
      finiteOrBlank(record.deltaHHb, 4),
      finiteOrBlank(record.deltaTHb, 4),
      finiteOrBlank(record.hbDiff, 4),
      finiteOrBlank(record.relativeConfidence, 4),
      Number.isFinite(record.muscleStateId) ? record.muscleStateId : "",
      csvCell(record.muscleStateLabel),
      finiteOrBlank(record.muscleScore, 2),
      finiteOrBlank(record.muscleStressScore, 4),
      finiteOrBlank(record.muscleConfidence, 4),
      finiteOrBlank(record.experimentalSmo2, 2),
      finiteOrBlank(record.smo2Reference, 2),
      finiteOrBlank(record.smo2Confidence, 4),
      finiteOrBlank(record.linkQuality, 4),
      finiteOrBlank(record.temperature, 2),
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function summarizeChannels(channels, sampleRate = 100, seconds = 0.3) {
  const length = commonLength(channels);
  const required = Math.max(10, Math.round(sampleRate * seconds * 0.7));
  if (length < required) return null;
  const count = Math.min(length, Math.max(10, Math.round(sampleRate * seconds)));
  const summary = { sampleCount: count };
  for (const key of CHANNEL_KEYS) {
    summary[key] = mean(channels[key].slice(length - count));
  }
  return summary;
}

export function scorePhaseCandidate(light, dark = null) {
  if (!light || !Number.isFinite(light.detectorRed) || !Number.isFinite(light.detectorIr)) {
    return -Infinity;
  }
  if (light.detectorRed >= 250000 || light.detectorIr >= 250000) {
    return -Infinity;
  }
  const darkRed = Number.isFinite(dark?.detectorRed) ? dark.detectorRed : 0;
  const darkIr = Number.isFinite(dark?.detectorIr) ? dark.detectorIr : 0;
  return (
    Math.max(0, light.detectorRed - darkRed) +
    Math.max(0, light.detectorIr - darkIr)
  );
}

export function evaluateOpticalLink(dark, light) {
  if (!dark || !light) {
    return {
      passed: false,
      reason: "missing_data",
      redDelta: null,
      irDelta: null,
      redGain: null,
      irGain: null,
      score: 0,
    };
  }

  const redDelta = light.detectorRed - dark.detectorRed;
  const irDelta = light.detectorIr - dark.detectorIr;
  const redGain = redDelta / Math.max(128, dark.detectorRed);
  const irGain = irDelta / Math.max(128, dark.detectorIr);
  const saturated = light.detectorRed >= 250000 || light.detectorIr >= 250000;
  const redPass = redDelta >= 64 && redGain >= 0.08;
  const irPass = irDelta >= 64 && irGain >= 0.08;
  const passed = redPass && irPass && !saturated;
  const score = clamp(
    (clamp(redGain / 0.5, 0, 1) + clamp(irGain / 0.5, 0, 1)) / 2,
    0,
    1,
  );

  return {
    passed,
    reason: saturated
      ? "saturated"
      : !redPass && !irPass
        ? "both_weak"
        : !redPass
          ? "red_weak"
          : !irPass
            ? "ir_weak"
            : "passed",
    redDelta,
    irDelta,
    redGain,
    irGain,
    score,
  };
}

function commonLength(channels) {
  if (!channels || CHANNEL_KEYS.some((key) => !Array.isArray(channels[key]))) {
    return 0;
  }
  return Math.min(...CHANNEL_KEYS.map((key) => channels[key].length));
}

function hasValidBaseline(baseline) {
  return CHANNEL_KEYS.every(
    (key) => Number.isFinite(baseline[key]) && baseline[key] > 0,
  );
}

function opticalDensity(current, reference) {
  return -Math.log(Math.max(current, 1) / Math.max(reference, 1));
}

function safeAbsCorrelation(a, b) {
  const value = pearsonCorrelation(detrend(a), detrend(b));
  return Number.isFinite(value) ? Math.abs(value) : 0;
}

function detrend(values) {
  const window = Math.max(5, Math.round(values.length / 8));
  const result = new Array(values.length);
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    sum += values[index];
    if (index >= window) sum -= values[index - window];
    result[index] = values[index] - sum / Math.min(index + 1, window);
  }
  return result.slice(window);
}

function pearsonCorrelation(a, b) {
  const length = Math.min(a.length, b.length);
  if (length < 3) return 0;
  const aMean = mean(a.slice(0, length));
  const bMean = mean(b.slice(0, length));
  let numerator = 0;
  let aEnergy = 0;
  let bEnergy = 0;
  for (let index = 0; index < length; index += 1) {
    const av = a[index] - aMean;
    const bv = b[index] - bMean;
    numerator += av * bv;
    aEnergy += av * av;
    bEnergy += bv * bv;
  }
  const denominator = Math.sqrt(aEnergy * bEnergy);
  return denominator > 1e-9 ? numerator / denominator : 0;
}

function emptyMetrics(sampleCount = 0) {
  return {
    ready: false,
    sourcePresent: false,
    detectorPresent: false,
    saturated: false,
    linkQuality: 0,
    syncQuality: 0,
    redCorrelation: 0,
    irCorrelation: 0,
    values: Object.fromEntries(CHANNEL_KEYS.map((key) => [key, null])),
    baselineReady: false,
    oxygenationTrend: null,
    bloodVolumeTrend: null,
    deltaO2Hb: null,
    deltaHHb: null,
    deltaTHb: null,
    hbDiff: null,
    redOd: null,
    irOd: null,
    shortRedOd: null,
    shortIrOd: null,
    correctedRedOd: null,
    correctedIrOd: null,
    sampleCount,
  };
}

function emptyMuscleState(guidance = "等待有效数据") {
  return {
    valid: false,
    stateId: null,
    label: "数据不足",
    score: null,
    confidence: 0,
    demand: null,
    compression: null,
    slope: null,
    personalScale: null,
    readyForNextSet: false,
    guidance,
  };
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function medianOf(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function finiteOrBlank(value, digits) {
  return Number.isFinite(value) ? value.toFixed(digits) : "";
}

function csvCell(value) {
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function percentile(values, ratio) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = clamp(Math.round((sorted.length - 1) * ratio), 0, sorted.length - 1);
  return sorted[index];
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
