import {
  accumulateMuscleStress,
  calculateNirsMetrics,
  createBaseline,
  csvFromRecords,
  evaluateOpticalLink,
  estimateNirsConfidence,
  estimateExperimentalSmo2,
  evaluateMuscleState,
  parseFirmwareLine,
  scorePhaseCandidate,
  stabilizeMuscleState,
  summarizeChannels,
} from "./protocol.js?v=5";

const MAX_BUFFER_SECONDS = 12;
const TREND_SECONDS = 60;
const SHORT_SEPARATION_WEIGHT = 0.5;
const LINK_DROPOUT_GRACE_MS = 2000;
const $ = (selector) => document.querySelector(selector);

const elements = {
  connectButton: $("#connectButton"), demoButton: $("#demoButton"),
  connectionPill: $("#connectionPill"), connectionText: $("#connectionText"),
  smo2Estimate: $("#smo2Estimate"), smo2Confidence: $("#smo2Confidence"),
  oxygenatedHb: $("#oxygenatedHb"), deoxygenatedHb: $("#deoxygenatedHb"),
  oxygenatedHbConfidence: $("#oxygenatedHbConfidence"),
  deoxygenatedHbConfidence: $("#deoxygenatedHbConfidence"),
  totalHbConfidence: $("#totalHbConfidence"), hbDiffConfidence: $("#hbDiffConfidence"),
  oxygenation: $("#oxygenation"), bloodVolume: $("#bloodVolume"),
  linkQuality: $("#linkQuality"),
  qualityFill: $("#qualityFill"), temperature: $("#temperature"),
  syncStatus: $("#syncStatus"), sampleRate: $("#sampleRate"),
  sampleCount: $("#sampleCount"), trendChart: $("#trendChart"),
  chartEmpty: $("#chartEmpty"), calibrateButton: $("#calibrateButton"),
  baselineState: $("#baselineState"), distanceInput: $("#distanceInput"),
  distanceLabel: $("#distanceLabel"), ledInput: $("#ledInput"),
  smo2ReferenceInput: $("#smo2ReferenceInput"),
  filterSelect: $("#filterSelect"),
  offsetInput: $("#offsetInput"), applyButton: $("#applyButton"),
  boostButton: $("#boostButton"), syncButton: $("#syncButton"),
  diagnosticPanel: $(".diagnostic-panel"),
  diagnosticButton: $("#diagnosticButton"), diagnosticState: $("#diagnosticState"),
  diagnosticCopy: $("#diagnosticCopy"), diagnosticProgress: $("#diagnosticProgress"),
  diagnosticResult: $("#diagnosticResult"), redLinkResult: $("#redLinkResult"),
  irLinkResult: $("#irLinkResult"), bestOffsetResult: $("#bestOffsetResult"),
  sourceRed: $("#sourceRed"),
  sourceIr: $("#sourceIr"), detectorRed: $("#detectorRed"),
  detectorIr: $("#detectorIr"), linkState: $("#linkState"),
  recordButton: $("#recordButton"), exportButton: $("#exportButton"),
  recordTime: $("#recordTime"), recordCount: $("#recordCount"),
  deviceDetail: $("#deviceDetail"),
  muscleStatePanel: $("#muscleStatePanel"),
  muscleStateNumber: $("#muscleStateNumber"),
  muscleStateLabel: $("#muscleStateLabel"), muscleScore: $("#muscleScore"),
  muscleStressScore: $("#muscleStressScore"),
  muscleModelConfidence: $("#muscleModelConfidence"),
  recoveryGuidance: $("#recoveryGuidance"),
};

const state = {
  channels: { sourceRed: [], sourceIr: [], detectorRed: [], detectorIr: [] },
  sampleRate: 100,
  totalSamples: 0,
  temperature: null,
  metrics: calculateNirsMetrics({}, null, 100),
  baseline: null,
  trends: [],
  port: null,
  reader: null,
  readLoopActive: false,
  serialBuffer: "",
  mode: "idle",
  demoTimer: null,
  demoIndex: 0,
  recording: false,
  recordStartedAt: 0,
  records: [],
  recordTimer: null,
  lastStatus: null,
  diagnosticRunning: false,
  diagnosticResult: null,
  muscleState: evaluateMuscleState(null),
  muscleStressScore: 0,
  lastMuscleUpdateAt: null,
  pendingMuscleStateKey: null,
  pendingMuscleStateSinceAt: null,
  linkDropoutSinceAt: null,
  canvasWidth: 0,
  canvasHeight: 0,
};

const context = elements.trendChart.getContext("2d");

elements.connectButton.addEventListener("click", () =>
  state.mode === "serial" ? disconnectSerial() : connectSerial(),
);
elements.demoButton.addEventListener("click", async () => {
  if (state.mode === "demo") return stopDemo();
  if (state.mode === "serial") await disconnectSerial();
  startDemo();
});
elements.calibrateButton.addEventListener("click", calibrateBaseline);
elements.syncButton.addEventListener("click", async () => writeSerial("SYNC\n"));
elements.applyButton.addEventListener("click", applyProbeSettings);
elements.boostButton.addEventListener("click", async () => {
  elements.ledInput.value = 220;
  await applyProbeSettings();
});
elements.smo2ReferenceInput.addEventListener("input", updateDisplay);
elements.filterSelect.addEventListener("change", () => {
  invalidateBaseline("滤波改变，需重新校准");
  state.metrics = calculateNirsMetrics(
    state.channels,
    null,
    state.sampleRate,
    SHORT_SEPARATION_WEIGHT,
    currentFilterCutoff(),
  );
  updateDisplay();
});
elements.diagnosticButton.addEventListener("click", runOpticalDiagnostic);
elements.distanceInput.addEventListener("input", () => {
  const value = clamp(Number(elements.distanceInput.value) || 30, 10, 50);
  elements.distanceLabel.textContent = `${value} mm`;
});
elements.recordButton.addEventListener("click", () =>
  state.recording ? stopRecording() : startRecording(),
);
elements.exportButton.addEventListener("click", exportCsv);

window.addEventListener("beforeunload", () => {
  state.reader?.cancel().catch(() => {});
  state.port?.close().catch(() => {});
});
new ResizeObserver(resizeCanvas).observe(elements.trendChart);
resizeCanvas();
requestAnimationFrame(drawChart);
updateDisplay();

async function connectSerial() {
  if (!("serial" in navigator)) {
    setConnection("error", "浏览器不支持 Web Serial");
    elements.deviceDetail.textContent = "请使用桌面版 Chrome / Edge 从 localhost 打开";
    return;
  }
  try {
    setConnection("pending", "请选择 XIAO 串口");
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    resetSession();
    state.port = port;
    state.mode = "serial";
    state.readLoopActive = true;
    elements.connectButton.textContent = "断开连接";
    elements.demoButton.textContent = "演示模式";
    setConnection("connected", "串口已连接");
    setControlsEnabled(true);
    readSerialLoop();
    await writeSerial("STATUS\n");
  } catch (error) {
    state.port = null;
    state.mode = "idle";
    if (error?.name === "NotFoundError") setConnection("idle", "已取消选择");
    else setConnection("error", error?.message || "串口连接失败");
  }
}

async function disconnectSerial() {
  state.readLoopActive = false;
  try { await state.reader?.cancel(); } catch {}
  state.reader = null;
  try { await state.port?.close(); } catch {}
  state.port = null;
  state.mode = "idle";
  elements.connectButton.textContent = "连接 XIAO";
  setConnection("idle", "未连接");
  setControlsEnabled(false);
  if (state.recording) stopRecording();
}

async function readSerialLoop() {
  const decoder = new TextDecoder();
  while (state.port?.readable && state.readLoopActive) {
    const reader = state.port.readable.getReader();
    state.reader = reader;
    try {
      while (state.readLoopActive) {
        const { value, done } = await reader.read();
        if (done) break;
        state.serialBuffer += decoder.decode(value, { stream: true });
        consumeLines();
      }
    } catch (error) {
      if (state.readLoopActive) setConnection("error", error?.message || "串口中断");
    } finally {
      reader.releaseLock();
      if (state.reader === reader) state.reader = null;
    }
    break;
  }
  if (state.mode === "serial" && state.readLoopActive) await disconnectSerial();
}

function consumeLines() {
  let index = state.serialBuffer.indexOf("\n");
  while (index >= 0) {
    const message = parseFirmwareLine(state.serialBuffer.slice(0, index).trim());
    state.serialBuffer = state.serialBuffer.slice(index + 1);
    if (message) handleMessage(message);
    index = state.serialBuffer.indexOf("\n");
  }
}

function handleMessage(message) {
  if (message.type === "hello") {
    const ready = message.sourceReady && message.detectorReady;
    setConnection(ready ? "connected" : "error", ready ? "双模块在线" : "模块未就绪");
    elements.deviceDetail.textContent = ready
      ? `${message.device || "XIAO"} · SOURCE ${message.sourceBus} · DETECTOR ${message.detectorBus}`
      : "检查 D4/D5 光源总线与 D2/D3 接收总线";
    return;
  }
  if (message.type === "samples") {
    state.sampleRate = message.rate;
    appendSamples(message);
    return;
  }
  if (message.type === "status") {
    state.lastStatus = message;
    if (Number.isFinite(message.tempC)) state.temperature = message.tempC;
    elements.ledInput.value = message.sourceLedCurrent ?? elements.ledInput.value;
    elements.offsetInput.value = message.startOffsetUs ?? elements.offsetInput.value;
    if (!message.sourceReady || !message.detectorReady) {
      setConnection("error", "等待双模块");
    }
    updateDisplay();
    return;
  }
  if (message.type === "error") {
    setConnection("error", message.message || message.code || "设备错误");
  }
}

async function writeSerial(text) {
  if (!state.port?.writable) return;
  const writer = state.port.writable.getWriter();
  try { await writer.write(new TextEncoder().encode(text)); }
  finally { writer.releaseLock(); }
}

function startDemo() {
  resetSession();
  state.mode = "demo";
  state.demoIndex = 0;
  elements.demoButton.textContent = "退出演示";
  elements.connectButton.textContent = "连接 XIAO";
  setConnection("connected", "NIRS 演示运行中");
  elements.deviceDetail.textContent = "SYNTHETIC DUAL-DISTANCE OPTICAL DATA";
  setControlsEnabled(true);

  state.demoTimer = setInterval(() => {
    const message = { type: "samples", rate: 100, sourceRed: [], sourceIr: [], detectorRed: [], detectorIr: [], tempC: 30.5 };
    for (let batch = 0; batch < 5; batch += 1) {
      const time = state.demoIndex / 100;
      const pulse = Math.sin(time * Math.PI * 2 * 1.15) + 0.18 * Math.sin(time * Math.PI * 4 * 1.15);
      // Start with a deoxygenating phase after rest so the demo exercises the
      // muscle-state classifier before transitioning back toward recovery.
      const exercise = time < 8 ? 0 : -0.045 * Math.sin((time - 8) / 7);
      const noise = (Math.random() - 0.5) * 80;
      message.sourceRed.push(Math.round(42000 + 1500 * pulse + noise));
      message.sourceIr.push(Math.round(51000 + 1900 * pulse + noise));
      message.detectorRed.push(Math.round(8800 * (1 + exercise) + 420 * pulse + noise * .25));
      message.detectorIr.push(Math.round(10600 * (1 - exercise) + 510 * pulse + noise * .25));
      state.demoIndex += 1;
    }
    appendSamples(message);
  }, 50);
}

function stopDemo() {
  clearInterval(state.demoTimer);
  state.demoTimer = null;
  state.mode = "idle";
  elements.demoButton.textContent = "演示模式";
  setConnection("idle", "未连接");
  setControlsEnabled(false);
  if (state.recording) stopRecording();
}

function appendSamples(message) {
  if (Number.isFinite(message.tempC)) state.temperature = message.tempC;
  const keys = Object.keys(state.channels);
  for (const key of keys) state.channels[key].push(...message[key]);
  state.totalSamples += message.sourceRed.length;
  const maximum = Math.round(state.sampleRate * MAX_BUFFER_SECONDS);
  for (const key of keys) {
    if (state.channels[key].length > maximum) {
      state.channels[key].splice(0, state.channels[key].length - maximum);
    }
  }

  state.metrics = calculateNirsMetrics(
    state.channels,
    state.baseline,
    state.sampleRate,
    SHORT_SEPARATION_WEIGHT,
    currentFilterCutoff(),
  );
  const now = performance.now();
  enforceLiveLinkValidity(now);
  if (state.metrics.baselineReady) {
    state.trends.push({
      at: performance.now(),
      oxygenation: state.metrics.oxygenationTrend,
      bloodVolume: state.metrics.bloodVolumeTrend,
    });
    const cutoff = performance.now() - TREND_SECONDS * 1000;
    while (state.trends[0]?.at < cutoff) state.trends.shift();
  }

  const confidence = estimateNirsConfidence(state.metrics, state.diagnosticResult);
  const candidate = evaluateMuscleState(state.metrics, state.trends, confidence.relative);
  const candidateKey = candidate.valid ? `state-${candidate.stateId}` : "invalid";
  if (candidateKey !== state.pendingMuscleStateKey) {
    state.pendingMuscleStateKey = candidateKey;
    state.pendingMuscleStateSinceAt = now;
  }
  const elapsedSeconds = state.lastMuscleUpdateAt == null
    ? 0.05
    : Math.min(1, Math.max(0.001, (now - state.lastMuscleUpdateAt) / 1000));
  const candidateDurationSeconds = Math.max(
    0,
    (now - (state.pendingMuscleStateSinceAt ?? now)) / 1000,
  );
  state.muscleState = stabilizeMuscleState(
    state.muscleState,
    candidate,
    candidateDurationSeconds,
    elapsedSeconds,
  );
  if (state.lastMuscleUpdateAt != null) {
    state.muscleStressScore = accumulateMuscleStress(
      state.muscleStressScore,
      state.muscleState,
      elapsedSeconds,
    );
  }
  state.lastMuscleUpdateAt = now;

  if (state.recording) recordBatch(message);
  elements.calibrateButton.disabled =
    state.diagnosticRunning || !state.metrics.ready || state.channels.sourceRed.length < state.sampleRate;
  elements.recordButton.disabled =
    state.diagnosticRunning || !state.metrics.ready || !state.metrics.baselineReady;
  updateDisplay();
}

function calibrateBaseline() {
  if (!state.metrics.ready) {
    elements.baselineState.textContent = "光路无效";
    return;
  }
  const baseline = createBaseline(state.channels, state.sampleRate, 3, currentFilterCutoff());
  if (!baseline) {
    elements.baselineState.textContent = "数据不足";
    return;
  }
  state.baseline = baseline;
  state.trends = [];
  state.metrics = calculateNirsMetrics(
    state.channels,
    baseline,
    state.sampleRate,
    SHORT_SEPARATION_WEIGHT,
    currentFilterCutoff(),
  );
  elements.baselineState.textContent = "已校准";
  elements.baselineState.classList.add("active");
  elements.recordButton.disabled = false;
  updateDisplay();
}

async function applyProbeSettings() {
  const led = clamp(Math.round(Number(elements.ledInput.value) || 220), 1, 220);
  const offset = clamp(Math.round(Number(elements.offsetInput.value) || 0), -5000, 5000);
  elements.ledInput.value = led;
  elements.offsetInput.value = offset;
  if (state.mode === "serial") {
    await writeSerial(`LED:${led}\n`);
    await writeSerial(`OFFSET:${offset}\n`);
  }
  state.baseline = null;
  state.trends = [];
  elements.baselineState.textContent = "需重新校准";
  elements.baselineState.classList.remove("active");
  elements.recordButton.disabled = true;
  updateDisplay();
}

async function runOpticalDiagnostic() {
  if (state.mode !== "serial" || state.diagnosticRunning) return;
  if (state.recording) stopRecording();
  invalidateBaseline("诊断后需重新校准");
  state.diagnosticRunning = true;
  state.diagnosticResult = null;
  lockDiagnosticControls(true);
  setDiagnosticProgress(0, "采集暗场", "正在关闭发射端 LED…");

  let bestOffset = Number(elements.offsetInput.value) || 0;
  let lightRestored = false;
  try {
    await sendAndWaitForSamples("LIGHT:0\n", 45, 1800);
    const dark = summarizeChannels(state.channels, state.sampleRate, 0.3);
    if (!dark) throw new Error("暗场样本不足");
    setDiagnosticProgress(10, "扫描相位", "暗场已记录，正在搜索双波长同步窗口…");

    await writeSerial("LIGHT:1\n");
    lightRestored = true;
    const offsets = Array.from({ length: 41 }, (_, index) => -5000 + index * 250);
    let bestScore = -Infinity;
    for (let index = 0; index < offsets.length; index += 1) {
      const offset = offsets[index];
      await sendAndWaitForSamples(`OFFSET:${offset}\n`, 35, 1600);
      const summary = summarizeChannels(state.channels, state.sampleRate, 0.25);
      const score = scorePhaseCandidate(summary, dark);
      if (score > bestScore) {
        bestScore = score;
        bestOffset = offset;
      }
      setDiagnosticProgress(
        10 + ((index + 1) / offsets.length) * 75,
        "扫描相位",
        `测试 ${index + 1}/${offsets.length} · 当前 ${offset} µs`,
      );
    }

    if (!Number.isFinite(bestScore) || bestScore <= 0) {
      throw new Error("所有相位的长距通道都没有高于暗场");
    }
    elements.offsetInput.value = bestOffset;
    setDiagnosticProgress(90, "复核亮场", `最佳偏移 ${bestOffset} µs，正在复测…`);
    await sendAndWaitForSamples(`OFFSET:${bestOffset}\n`, 50, 1800);
    const light = summarizeChannels(state.channels, state.sampleRate, 0.35);
    const result = evaluateOpticalLink(dark, light);
    state.diagnosticResult = { ...result, bestOffset, dark, light };
    renderDiagnosticResult(state.diagnosticResult);
  } catch (error) {
    renderDiagnosticError(error?.message || "自动光路验证失败");
  } finally {
    if (!lightRestored || state.lastStatus?.sourceLightEnabled === false) {
      await writeSerial("LIGHT:1\n").catch(() => {});
    }
    state.diagnosticRunning = false;
    lockDiagnosticControls(false);
  }
}

async function sendAndWaitForSamples(command, count, timeoutMs) {
  const startingCount = state.totalSamples;
  await writeSerial(command);
  await new Promise((resolve, reject) => {
    const deadline = performance.now() + timeoutMs;
    const poll = () => {
      if (state.mode !== "serial") {
        reject(new Error("串口已断开"));
        return;
      }
      if (state.totalSamples - startingCount >= count) {
        resolve();
        return;
      }
      if (performance.now() >= deadline) {
        reject(new Error("等待新样本超时，请检查双模块接线"));
        return;
      }
      setTimeout(poll, 25);
    };
    poll();
  });
}

function setDiagnosticProgress(percent, stateText, copy) {
  elements.diagnosticProgress.style.width = `${clamp(percent, 0, 100)}%`;
  elements.diagnosticState.textContent = stateText;
  elements.diagnosticCopy.textContent = copy;
}

function renderDiagnosticResult(result) {
  setDiagnosticProgress(100, result.passed ? "光路通过" : "光路未通过", diagnosticMessage(result));
  elements.diagnosticPanel.dataset.result = result.passed ? "passed" : "failed";
  elements.diagnosticResult.hidden = false;
  elements.redLinkResult.textContent = `${signedInteger(result.redDelta)} counts · ${signedPercent(result.redGain)}`;
  elements.irLinkResult.textContent = `${signedInteger(result.irDelta)} counts · ${signedPercent(result.irGain)}`;
  elements.bestOffsetResult.textContent = `${result.bestOffset} µs`;
}

function renderDiagnosticError(message) {
  setDiagnosticProgress(100, "测试中断", message);
  elements.diagnosticPanel.dataset.result = "failed";
  elements.diagnosticResult.hidden = true;
}

function diagnosticMessage(result) {
  if (result.passed) return "红光和红外都显著高于暗场，可以进入贴肤基线实验。";
  if (result.reason === "saturated") return "接收端饱和，请降低 LED 电流或增加探头间距。";
  if (result.reason === "red_weak") return "只有红外光路成立；检查红光窗口、遮光与同步。";
  if (result.reason === "ir_weak") return "只有红光光路成立；检查红外窗口、遮光与同步。";
  return "两种波长都未明显高于暗场；先缩短间距，再检查方向、遮光和接线。";
}

function lockDiagnosticControls(locked) {
  elements.diagnosticButton.disabled = locked || state.mode !== "serial";
  elements.applyButton.disabled = locked || state.mode === "idle";
  elements.boostButton.disabled = locked || state.mode === "idle";
  elements.syncButton.disabled = locked || state.mode !== "serial";
  elements.calibrateButton.disabled = locked || !state.metrics.ready || state.channels.sourceRed.length < state.sampleRate;
  elements.recordButton.disabled = locked || !state.metrics.ready || !state.metrics.baselineReady;
}

function enforceLiveLinkValidity(now) {
  if (state.diagnosticRunning || state.mode === "demo" || state.metrics.ready) {
    state.linkDropoutSinceAt = null;
    return;
  }
  if (state.linkDropoutSinceAt == null) state.linkDropoutSinceAt = now;
  if (now - state.linkDropoutSinceAt < LINK_DROPOUT_GRACE_MS) return;
  if (!state.baseline && !state.diagnosticResult?.passed) return;

  state.baseline = null;
  state.trends = [];
  state.metrics = calculateNirsMetrics(
    state.channels,
    null,
    state.sampleRate,
    SHORT_SEPARATION_WEIGHT,
    currentFilterCutoff(),
  );
  state.diagnosticResult = null;
  state.muscleState = evaluateMuscleState(null);
  state.pendingMuscleStateKey = "invalid";
  state.pendingMuscleStateSinceAt = now;
  elements.baselineState.textContent = "光路丢失，需重新校准";
  elements.baselineState.classList.remove("active");
  elements.recordButton.disabled = true;
  setDiagnosticProgress(
    100,
    "光路已掉线",
    "当前接收信号已跌回无效范围；请重新固定、遮光，再运行自动验证。",
  );
  elements.diagnosticPanel.dataset.result = "failed";
  elements.diagnosticResult.hidden = true;
}

function invalidateBaseline(label) {
  state.baseline = null;
  state.trends = [];
  elements.baselineState.textContent = label;
  elements.baselineState.classList.remove("active");
  elements.recordButton.disabled = true;
}

function updateDisplay() {
  const metrics = state.metrics;
  const confidence = estimateNirsConfidence(metrics, state.diagnosticResult);
  const smo2 = estimateExperimentalSmo2(
    metrics,
    state.trends,
    Number(elements.smo2ReferenceInput.value) || 70,
    confidence.relative,
  );
  elements.smo2Estimate.textContent = Number.isFinite(smo2.value) ? smo2.value.toFixed(1) : "--";
  elements.smo2Confidence.textContent = Number.isFinite(smo2.value)
    ? `实验估算 · 基线 ${smo2.reference.toFixed(0)}% · 置信度 ${Math.round(smo2.confidence * 100)}%`
    : "完成基线后实验推算 · 置信度 0%";
  elements.oxygenatedHb.textContent = formatTrend(metrics.deltaO2Hb);
  elements.deoxygenatedHb.textContent = formatTrend(metrics.deltaHHb);
  elements.oxygenation.textContent = formatTrend(metrics.hbDiff);
  elements.bloodVolume.textContent = formatTrend(metrics.deltaTHb);
  elements.oxygenatedHbConfidence.textContent = confidenceLabel("相对估算", confidence.o2Hb);
  elements.deoxygenatedHbConfidence.textContent = confidenceLabel("相对估算", confidence.hHb);
  elements.totalHbConfidence.textContent = confidenceLabel("相对估算", confidence.tHb);
  elements.hbDiffConfidence.textContent = confidenceLabel("相对估算", confidence.hbDiff);
  const quality = Math.round(metrics.linkQuality * 100);
  elements.linkQuality.textContent = quality;
  elements.qualityFill.style.width = `${quality}%`;
  elements.temperature.textContent = Number.isFinite(state.temperature) ? state.temperature.toFixed(1) : "--";
  elements.sampleRate.textContent = state.totalSamples ? state.sampleRate : "--";
  elements.sampleCount.textContent = state.totalSamples.toLocaleString("zh-CN");
  elements.sourceRed.textContent = formatRaw(metrics.values.sourceRed);
  elements.sourceIr.textContent = formatRaw(metrics.values.sourceIr);
  elements.detectorRed.textContent = formatRaw(metrics.values.detectorRed);
  elements.detectorIr.textContent = formatRaw(metrics.values.detectorIr);
  elements.linkState.textContent = metrics.saturated ? "信号饱和" : metrics.ready ? "光路在线" : "无有效光路";
  elements.linkState.classList.toggle("active", metrics.ready);
  elements.syncStatus.textContent = state.lastStatus
    ? `偏移 ${state.lastStatus.startOffsetUs ?? 0} µs · FIFO 差 ${state.lastStatus.fifoSkew ?? 0}`
    : state.mode === "demo" ? "合成同步信号" : "等待双模块握手";
  elements.chartEmpty.classList.toggle("hidden", state.trends.length > 1);
  renderMuscleState();
}

function renderMuscleState() {
  const muscle = state.muscleState;
  elements.muscleStatePanel.dataset.state = muscle.valid ? String(muscle.stateId) : "idle";
  elements.muscleStateNumber.textContent = muscle.valid ? muscle.stateId : "--";
  elements.muscleStateLabel.textContent = muscle.valid ? muscle.label : "等待基线";
  elements.muscleScore.textContent = Number.isFinite(muscle.score) ? muscle.score : "--";
  elements.muscleStressScore.textContent = state.muscleStressScore.toFixed(1);
  elements.muscleModelConfidence.textContent = `置信度 ${Math.round((muscle.confidence || 0) * 100)}%`;
  elements.recoveryGuidance.textContent = muscle.guidance;
}

function setControlsEnabled(enabled) {
  elements.applyButton.disabled = !enabled;
  elements.boostButton.disabled = !enabled;
  elements.syncButton.disabled = !enabled || state.mode === "demo";
  elements.diagnosticButton.disabled = !enabled || state.mode !== "serial";
  if (!enabled) {
    elements.calibrateButton.disabled = true;
    elements.recordButton.disabled = true;
  }
}

function setConnection(status, text) {
  elements.connectionPill.dataset.state = status;
  elements.connectionText.textContent = text;
}

function startRecording() {
  state.records = [];
  state.recording = true;
  state.recordStartedAt = Date.now();
  elements.recordButton.textContent = "停止记录";
  elements.exportButton.disabled = true;
  updateRecordStatus();
  state.recordTimer = setInterval(updateRecordStatus, 250);
}

function stopRecording() {
  state.recording = false;
  clearInterval(state.recordTimer);
  state.recordTimer = null;
  elements.recordButton.textContent = "开始记录";
  elements.exportButton.disabled = state.records.length === 0;
  updateRecordStatus();
}

function recordBatch(message) {
  const now = Date.now();
  const confidence = estimateNirsConfidence(state.metrics, state.diagnosticResult);
  const smo2 = estimateExperimentalSmo2(
    state.metrics,
    state.trends,
    Number(elements.smo2ReferenceInput.value) || 70,
    confidence.relative,
  );
  for (let index = 0; index < message.sourceRed.length; index += 1) {
    const offset = ((message.sourceRed.length - index - 1) / state.sampleRate) * 1000;
    state.records.push({
      timestamp: new Date(now - offset).toISOString(),
      elapsedMs: now - offset - state.recordStartedAt,
      sourceRed: message.sourceRed[index], sourceIr: message.sourceIr[index],
      detectorRed: message.detectorRed[index], detectorIr: message.detectorIr[index],
      oxygenationTrend: state.metrics.oxygenationTrend,
      bloodVolumeTrend: state.metrics.bloodVolumeTrend,
      deltaO2Hb: state.metrics.deltaO2Hb,
      deltaHHb: state.metrics.deltaHHb,
      deltaTHb: state.metrics.deltaTHb,
      hbDiff: state.metrics.hbDiff,
      relativeConfidence: estimateNirsConfidence(state.metrics, state.diagnosticResult).relative,
      muscleStateId: state.muscleState.stateId,
      muscleStateLabel: state.muscleState.label,
      muscleScore: state.muscleState.score,
      muscleStressScore: state.muscleStressScore,
      muscleConfidence: state.muscleState.confidence,
      experimentalSmo2: smo2.value,
      smo2Reference: smo2.reference,
      smo2Confidence: smo2.confidence,
      linkQuality: state.metrics.linkQuality,
      temperature: state.temperature,
    });
  }
  updateRecordStatus();
}

function updateRecordStatus() {
  const elapsed = state.recording ? Date.now() - state.recordStartedAt : state.records.at(-1)?.elapsedMs || 0;
  elements.recordTime.textContent = formatDuration(elapsed);
  elements.recordCount.textContent = state.records.length
    ? `已记录 ${state.records.length.toLocaleString("zh-CN")} 个光学样本`
    : state.recording ? "正在等待样本…" : "尚未记录数据";
}

function exportCsv() {
  if (!state.records.length) return;
  const blob = new Blob(["\uFEFF", csvFromRecords(state.records)], { type: "text/csv;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `dual-max30102-nirs-${new Date().toISOString().replaceAll(":", "-")}.csv`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function resetSession() {
  for (const key of Object.keys(state.channels)) state.channels[key] = [];
  state.totalSamples = 0;
  state.baseline = null;
  state.trends = [];
  state.metrics = calculateNirsMetrics({}, null, 100);
  state.lastStatus = null;
  state.diagnosticResult = null;
  state.diagnosticRunning = false;
  state.muscleState = evaluateMuscleState(null);
  state.muscleStressScore = 0;
  state.lastMuscleUpdateAt = null;
  state.pendingMuscleStateKey = null;
  state.pendingMuscleStateSinceAt = null;
  state.linkDropoutSinceAt = null;
  elements.diagnosticState.textContent = "未测试";
  elements.diagnosticCopy.textContent = "自动采集暗场，扫描完整 10 ms 周期的 41 个同步偏移，再验证红光和红外是否都到达接收模块。";
  elements.diagnosticProgress.style.width = "0";
  elements.diagnosticResult.hidden = true;
  delete elements.diagnosticPanel.dataset.result;
  elements.baselineState.textContent = "未校准";
  elements.baselineState.classList.remove("active");
  if (state.recording) stopRecording();
  updateDisplay();
}

function resizeCanvas() {
  const rect = elements.trendChart.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  state.canvasWidth = rect.width;
  state.canvasHeight = rect.height;
  elements.trendChart.width = Math.max(1, Math.round(rect.width * ratio));
  elements.trendChart.height = Math.max(1, Math.round(rect.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawChart() {
  const width = state.canvasWidth;
  const height = state.canvasHeight;
  context.clearRect(0, 0, width, height);
  if (width && height) {
    context.strokeStyle = "rgba(23,25,20,.09)";
    context.lineWidth = 1;
    for (let row = 1; row < 5; row += 1) {
      const y = (height * row) / 5;
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }
    for (let column = 1; column < 8; column += 1) {
      const x = (width * column) / 8;
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
    if (state.trends.length > 1) {
      const values = state.trends.flatMap((point) => [point.oxygenation, point.bloodVolume]);
      const extent = Math.max(10, ...values.map((value) => Math.abs(value))) * 1.15;
      drawSeries("oxygenation", "#34c7b7", extent);
      drawSeries("bloodVolume", "#665dd8", extent);
      context.strokeStyle = "rgba(23,25,20,.35)";
      context.beginPath(); context.moveTo(0, height / 2); context.lineTo(width, height / 2); context.stroke();
    }
  }
  requestAnimationFrame(drawChart);
}

function drawSeries(key, color, extent) {
  const first = state.trends[0].at;
  const last = state.trends.at(-1).at;
  const duration = Math.max(TREND_SECONDS * 1000, last - first);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  state.trends.forEach((point, index) => {
    const x = state.canvasWidth - ((last - point.at) / duration) * state.canvasWidth;
    const y = state.canvasHeight / 2 - (point[key] / extent) * (state.canvasHeight * .42);
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.stroke();
}

function formatTrend(value) {
  if (!Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}
function confidenceLabel(prefix, value) {
  const percent = Number.isFinite(value) ? Math.round(clamp(value, 0, 1) * 100) : 0;
  return `${prefix} · 置信度 ${percent}%`;
}
function currentFilterCutoff() {
  return clamp(Number(elements.filterSelect?.value) || 1, 0.5, 10);
}
function signedInteger(value) {
  if (!Number.isFinite(value)) return "--";
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
}
function signedPercent(value) {
  if (!Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}
function formatRaw(value) { return Number.isFinite(value) ? Math.round(value).toLocaleString("zh-CN") : "--"; }
function formatDuration(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
