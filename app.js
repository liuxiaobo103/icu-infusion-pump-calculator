"use strict";

const STORAGE_KEY = "icuPumpCalculator.drugs.v2";
const ACTIVE_DRUG_KEY = "icuPumpCalculator.activeDrugId.v2";
const WEIGHT_KEY = "icuPumpCalculator.weight.v2";
const MODE_KEY = "icuPumpCalculator.mode.v2";
const PUMP_RATE_KEY = "icuPumpCalculator.pumpRate.v2";
const RATE_WARNING_LIMIT = 999.99;

const DEFAULT_DRUGS = [
  {
    id: "remifentanil",
    name: "瑞芬太尼",
    amount: 4,
    amountUnit: "mg",
    volume: 50,
    dose: 0.05,
    doseUnit: "ug/kg/min",
    amountType: "mass",
    editable: false,
    usage: "短效阿片类镇痛药，常用于麻醉诱导/维持、机械通气镇痛镇静的辅助。",
    caution: "可致呼吸抑制、心动过缓、低血压；停药后作用消退快，需准备替代镇痛方案。",
    limit: "ICU 常用 0.025-0.15 μg/kg/min；麻醉场景剂量范围更宽，应按说明书和院内方案复核。",
  },
  {
    id: "norepinephrine",
    name: "去甲肾上腺素",
    amount: 16,
    amountUnit: "mg",
    volume: 50,
    dose: 0.05,
    doseUnit: "ug/kg/min",
    amountType: "mass",
    editable: false,
    usage: "血管收缩药，常用于感染性休克或其他低血压状态下维持平均动脉压。",
    caution: "首选中心静脉；严防外渗坏死；持续监测血压、心率、末梢灌注和乳酸变化。",
    limit: "无统一绝对极量，常按效应滴定；>1 μg/kg/min 通常提示高剂量，需严密复核。",
  },
  {
    id: "epinephrine",
    name: "肾上腺素",
    amount: 1,
    amountUnit: "mg",
    volume: 50,
    dose: 0.05,
    doseUnit: "ug/kg/min",
    amountType: "mass",
    editable: false,
    usage: "强心升压药，常用于心脏骤停后、过敏反应、休克或严重低心排状态。",
    caution: "可致心动过速、心律失常、高乳酸和高血糖；需连续心电和血压监测。",
    limit: "休克连续泵入常见 0.01-1 μg/kg/min；需按病情、医嘱和说明书滴定。",
  },
  {
    id: "dopamine",
    name: "多巴胺",
    amount: 200,
    amountUnit: "mg",
    volume: 50,
    dose: 5,
    doseUnit: "ug/kg/min",
    amountType: "mass",
    editable: false,
    usage: "正性肌力和升压药，用于部分低血压、低心排或休克状态。",
    caution: "可明显增加心率和心律失常风险；外渗可导致组织损伤。",
    limit: "常用 2-20 μg/kg/min；超过 20 μg/kg/min 通常需重新评估方案。",
  },
  {
    id: "dobutamine",
    name: "多巴酚丁胺",
    amount: 250,
    amountUnit: "mg",
    volume: 50,
    dose: 5,
    doseUnit: "ug/kg/min",
    amountType: "mass",
    editable: false,
    usage: "正性肌力药，常用于低心排、心源性休克或心衰伴灌注不足。",
    caution: "可致心动过速、心律失常、血压波动；低血容量未纠正前效果差。",
    limit: "常用 2.5-20 μg/kg/min；高剂量需严密心电和血流动力学监测。",
  },
  {
    id: "dexmedetomidine",
    name: "右美托咪定",
    amount: 200,
    amountUnit: "ug",
    volume: 50,
    dose: 0.4,
    doseUnit: "ug/kg/h",
    amountType: "mass",
    editable: false,
    usage: "α2 受体激动剂，用于 ICU 镇静、程序镇静，可保留一定唤醒性。",
    caution: "常见心动过缓、低血压；负荷剂量更易血流动力学波动。",
    limit: "ICU 镇静常用 0.2-0.7 μg/kg/h；部分场景可更高，需按说明书和院内规范。",
  },
  {
    id: "propofol",
    name: "丙泊酚",
    amount: 500,
    amountUnit: "mg",
    volume: 50,
    dose: 1,
    doseUnit: "mg/kg/h",
    amountType: "mass",
    editable: false,
    usage: "静脉麻醉和 ICU 镇静药，起效快、恢复快。",
    caution: "可致低血压、呼吸抑制；长期大剂量警惕丙泊酚输注综合征，监测甘油三酯。",
    limit: "ICU 镇静通常不建议长期超过 4 mg/kg/h，且需结合疗程和风险复核。",
  },
  {
    id: "insulin",
    name: "胰岛素",
    amount: 50,
    amountUnit: "U",
    volume: 50,
    dose: 2,
    doseUnit: "U/h",
    amountType: "unit",
    editable: false,
    usage: "控制高血糖或糖尿病酮症酸中毒等场景的静脉胰岛素治疗。",
    caution: "需按血糖动态调整；警惕低血糖和低钾血症，配合血糖/电解质监测。",
    limit: "无固定极量，常按血糖方案滴定；DKA 常见起始约 0.1 U/kg/h，按院内流程执行。",
  },
  {
    id: "nitroglycerin",
    name: "硝酸甘油",
    amount: 50,
    amountUnit: "mg",
    volume: 50,
    dose: 10,
    doseUnit: "ug/min",
    amountType: "mass",
    editable: false,
    usage: "静脉扩血管药，常用于心绞痛、急性心衰/肺水肿、高血压急症等。",
    caution: "可致低血压、头痛、反射性心动过速；禁与 PDE-5 抑制剂合用。",
    limit: "常用 5-200 μg/min；高剂量或疗效下降需评估耐受和血压风险。",
  },
  {
    id: "nicardipine",
    name: "尼卡地平",
    amount: 25,
    amountUnit: "mg",
    volume: 50,
    dose: 5,
    doseUnit: "mg/h",
    amountType: "mass",
    editable: false,
    usage: "二氢吡啶类钙通道阻滞剂，常用于高血压急症或围术期血压控制。",
    caution: "可致低血压、心动过速、头痛；心衰或主动脉瓣狭窄等情况需谨慎。",
    limit: "静脉泵入常用 5-15 mg/h；达到 15 mg/h 后通常需复核降压策略。",
  },
];

const FORMULAS = {
  "ug/kg/min": {
    concentrationUnit: "ug/ml",
    requiresWeight: true,
    doseToRate: ({ dose, weight, concentration }) => (dose * weight * 60) / concentration,
    rateToDose: ({ rate, weight, concentration }) => (rate * concentration) / (weight * 60),
    process: ({ dose, rate, weight, concentration, result, mode }) =>
      mode === "doseToRate"
        ? [
            `每小时药量 = ${fmt(dose)} × ${fmt(weight)} × 60 = <strong>${fmt(dose * weight * 60)} μg/h</strong>`,
            `泵速 = 每小时药量 ÷ 浓度 = ${fmt(dose * weight * 60)} ÷ ${fmt(concentration)} = <strong>${fmt(result)} ml/h</strong>`,
          ]
        : [
            `每小时药量 = ${fmt(rate)} × ${fmt(concentration)} = <strong>${fmt(rate * concentration)} μg/h</strong>`,
            `实际剂量 = 每小时药量 ÷ 体重 ÷ 60 = <strong>${fmt(result)} μg/kg/min</strong>`,
          ],
  },
  "ug/kg/h": {
    concentrationUnit: "ug/ml",
    requiresWeight: true,
    doseToRate: ({ dose, weight, concentration }) => (dose * weight) / concentration,
    rateToDose: ({ rate, weight, concentration }) => (rate * concentration) / weight,
    process: ({ dose, rate, weight, concentration, result, mode }) =>
      mode === "doseToRate"
        ? [
            `每小时药量 = ${fmt(dose)} × ${fmt(weight)} = <strong>${fmt(dose * weight)} μg/h</strong>`,
            `泵速 = 每小时药量 ÷ 浓度 = <strong>${fmt(result)} ml/h</strong>`,
          ]
        : [
            `每小时药量 = ${fmt(rate)} × ${fmt(concentration)} = <strong>${fmt(rate * concentration)} μg/h</strong>`,
            `实际剂量 = 每小时药量 ÷ 体重 = <strong>${fmt(result)} μg/kg/h</strong>`,
          ],
  },
  "mg/kg/h": {
    concentrationUnit: "mg/ml",
    requiresWeight: true,
    doseToRate: ({ dose, weight, concentration }) => (dose * weight) / concentration,
    rateToDose: ({ rate, weight, concentration }) => (rate * concentration) / weight,
    process: ({ dose, rate, weight, concentration, result, mode }) =>
      mode === "doseToRate"
        ? [
            `每小时药量 = ${fmt(dose)} × ${fmt(weight)} = <strong>${fmt(dose * weight)} mg/h</strong>`,
            `泵速 = 每小时药量 ÷ 浓度 = <strong>${fmt(result)} ml/h</strong>`,
          ]
        : [
            `每小时药量 = ${fmt(rate)} × ${fmt(concentration)} = <strong>${fmt(rate * concentration)} mg/h</strong>`,
            `实际剂量 = 每小时药量 ÷ 体重 = <strong>${fmt(result)} mg/kg/h</strong>`,
          ],
  },
  "U/h": {
    concentrationUnit: "U/ml",
    requiresWeight: false,
    doseToRate: ({ dose, concentration }) => dose / concentration,
    rateToDose: ({ rate, concentration }) => rate * concentration,
    process: ({ dose, rate, concentration, result, mode }) =>
      mode === "doseToRate"
        ? [`泵速 = ${fmt(dose)} ÷ ${fmt(concentration)} = <strong>${fmt(result)} ml/h</strong>`]
        : [`实际剂量 = ${fmt(rate)} × ${fmt(concentration)} = <strong>${fmt(result)} U/h</strong>`],
  },
  "ug/min": {
    concentrationUnit: "ug/ml",
    requiresWeight: false,
    doseToRate: ({ dose, concentration }) => (dose * 60) / concentration,
    rateToDose: ({ rate, concentration }) => (rate * concentration) / 60,
    process: ({ dose, rate, concentration, result, mode }) =>
      mode === "doseToRate"
        ? [
            `每小时药量 = ${fmt(dose)} × 60 = <strong>${fmt(dose * 60)} μg/h</strong>`,
            `泵速 = 每小时药量 ÷ 浓度 = <strong>${fmt(result)} ml/h</strong>`,
          ]
        : [
            `每小时药量 = ${fmt(rate)} × ${fmt(concentration)} = <strong>${fmt(rate * concentration)} μg/h</strong>`,
            `实际剂量 = 每小时药量 ÷ 60 = <strong>${fmt(result)} μg/min</strong>`,
          ],
  },
  "mg/h": {
    concentrationUnit: "mg/ml",
    requiresWeight: false,
    doseToRate: ({ dose, concentration }) => dose / concentration,
    rateToDose: ({ rate, concentration }) => rate * concentration,
    process: ({ dose, rate, concentration, result, mode }) =>
      mode === "doseToRate"
        ? [`泵速 = ${fmt(dose)} ÷ ${fmt(concentration)} = <strong>${fmt(result)} ml/h</strong>`]
        : [`实际剂量 = ${fmt(rate)} × ${fmt(concentration)} = <strong>${fmt(result)} mg/h</strong>`],
  },
};

const elements = {
  drugSelect: document.getElementById("drugSelect"),
  amountInput: document.getElementById("amountInput"),
  amountUnitSelect: document.getElementById("amountUnitSelect"),
  volumeInput: document.getElementById("volumeInput"),
  weightInput: document.getElementById("weightInput"),
  doseUnitSelect: document.getElementById("doseUnitSelect"),
  targetDoseInput: document.getElementById("targetDoseInput"),
  targetDoseLabel: document.getElementById("targetDoseLabel"),
  pumpRateInput: document.getElementById("pumpRateInput"),
  targetDoseField: document.getElementById("targetDoseField"),
  pumpRateField: document.getElementById("pumpRateField"),
  weightNote: document.getElementById("weightNote"),
  resultLabel: document.getElementById("resultLabel"),
  resultValue: document.getElementById("resultValue"),
  resultUnit: document.getElementById("resultUnit"),
  concentrationText: document.getElementById("concentrationText"),
  messageList: document.getElementById("messageList"),
  processList: document.getElementById("processList"),
  usageText: document.getElementById("usageText"),
  cautionText: document.getElementById("cautionText"),
  limitText: document.getElementById("limitText"),
  addDrugButton: document.getElementById("addDrugButton"),
  deleteDrugButton: document.getElementById("deleteDrugButton"),
  resetButton: document.getElementById("resetButton"),
  modeButtons: [...document.querySelectorAll("[data-mode]")],
  dialog: document.getElementById("drugDialog"),
  newDrugNameInput: document.getElementById("newDrugNameInput"),
  newDrugDoseUnitSelect: document.getElementById("newDrugDoseUnitSelect"),
  confirmAddDrugButton: document.getElementById("confirmAddDrugButton"),
};

const state = {
  drugs: loadDrugs(),
  activeDrugId: localStorage.getItem(ACTIVE_DRUG_KEY) || "remifentanil",
  mode: localStorage.getItem(MODE_KEY) || "doseToRate",
};

initialize();

function initialize() {
  if (!state.drugs.some((drug) => drug.id === state.activeDrugId)) {
    state.activeDrugId = state.drugs[0].id;
  }

  elements.weightInput.value = localStorage.getItem(WEIGHT_KEY) || "";
  elements.pumpRateInput.value = localStorage.getItem(PUMP_RATE_KEY) || "";
  bindEvents();
  renderDrugSelect();
  loadDrugIntoForm(getActiveDrug());
  updateModeUI();
  calculateAndRender();
}

function bindEvents() {
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      localStorage.setItem(MODE_KEY, state.mode);
      updateModeUI();
      calculateAndRender();
    });
  });

  [elements.amountInput, elements.amountUnitSelect, elements.volumeInput, elements.doseUnitSelect, elements.targetDoseInput, elements.pumpRateInput].forEach((control) => {
    control.addEventListener("input", () => {
      saveActiveDrugFromForm();
      localStorage.setItem(PUMP_RATE_KEY, elements.pumpRateInput.value);
      updateModeUI();
      calculateAndRender();
    });
    control.addEventListener("change", () => {
      saveActiveDrugFromForm();
      localStorage.setItem(PUMP_RATE_KEY, elements.pumpRateInput.value);
      updateModeUI();
      calculateAndRender();
    });
  });

  elements.weightInput.addEventListener("input", () => {
    localStorage.setItem(WEIGHT_KEY, elements.weightInput.value);
    calculateAndRender();
  });

  elements.drugSelect.addEventListener("change", () => {
    state.activeDrugId = elements.drugSelect.value;
    localStorage.setItem(ACTIVE_DRUG_KEY, state.activeDrugId);
    loadDrugIntoForm(getActiveDrug());
    calculateAndRender();
  });

  elements.addDrugButton.addEventListener("click", () => {
    elements.newDrugNameInput.value = "";
    elements.newDrugDoseUnitSelect.value = "ug/kg/min";
    elements.dialog.showModal();
    elements.newDrugNameInput.focus();
  });

  elements.confirmAddDrugButton.addEventListener("click", createCustomDrug);

  elements.deleteDrugButton.addEventListener("click", deleteActiveDrug);

  elements.resetButton.addEventListener("click", () => {
    const confirmed = window.confirm("恢复默认会清除已保存的药物修改和自定义药物，是否继续？");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_DRUG_KEY);
    localStorage.removeItem(MODE_KEY);
    localStorage.removeItem(PUMP_RATE_KEY);
    state.drugs = clone(DEFAULT_DRUGS);
    state.activeDrugId = "remifentanil";
    state.mode = "doseToRate";
    renderDrugSelect();
    loadDrugIntoForm(getActiveDrug());
    updateModeUI();
    calculateAndRender();
  });
}

function loadDrugs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length > 0) {
      return mergeDefaultDrugUpdates(saved);
    }
  } catch {
    return clone(DEFAULT_DRUGS);
  }
  return clone(DEFAULT_DRUGS);
}

function mergeDefaultDrugUpdates(savedDrugs) {
  const byId = new Map(savedDrugs.map((drug) => [drug.id, drug]));
  const merged = DEFAULT_DRUGS.map((drug) => ({ ...drug, ...(byId.get(drug.id) || {}) }));
  const custom = savedDrugs.filter((drug) => !DEFAULT_DRUGS.some((item) => item.id === drug.id));
  return [...merged, ...custom];
}

function persistDrugs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.drugs));
  localStorage.setItem(ACTIVE_DRUG_KEY, state.activeDrugId);
}

function renderDrugSelect() {
  elements.drugSelect.innerHTML = state.drugs
    .map((drug) => `<option value="${escapeHtml(drug.id)}">${escapeHtml(drug.name)}</option>`)
    .join("");
  elements.drugSelect.value = state.activeDrugId;
}

function loadDrugIntoForm(drug) {
  elements.drugSelect.value = drug.id;
  elements.amountInput.value = drug.amount ?? "";
  elements.amountUnitSelect.value = drug.amountUnit || "mg";
  elements.volumeInput.value = drug.volume ?? "";
  elements.doseUnitSelect.value = drug.doseUnit;
  elements.targetDoseInput.value = drug.dose ?? "";
  elements.usageText.textContent = drug.usage || "自定义药物：请按药品说明书、医嘱和院内规范填写用途。";
  elements.cautionText.textContent = drug.caution || "自定义药物：请补充禁忌、监测指标和外渗/配伍注意事项。";
  elements.limitText.textContent = drug.limit || "未设置。请按说明书、院内规范和医嘱复核。";
  elements.deleteDrugButton.classList.toggle("hidden", !drug.editable);
}

function saveActiveDrugFromForm() {
  const drug = getActiveDrug();
  drug.doseUnit = elements.doseUnitSelect.value;
  const concentrationUnit = FORMULAS[drug.doseUnit].concentrationUnit;
  drug.amount = numberOrEmpty(elements.amountInput.value);
  drug.amountUnit = elements.amountUnitSelect.value;
  drug.volume = numberOrEmpty(elements.volumeInput.value);
  drug.dose = numberOrEmpty(elements.targetDoseInput.value);
  drug.amountType = concentrationUnit === "U/ml" ? "unit" : "mass";
  persistDrugs();
}

function updateModeUI() {
  elements.modeButtons.forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  elements.targetDoseField.classList.toggle("hidden", state.mode !== "doseToRate");
  elements.pumpRateField.classList.toggle("hidden", state.mode !== "rateToDose");
  elements.resultLabel.textContent = state.mode === "doseToRate" ? "计算泵速" : "实际剂量";
  elements.targetDoseLabel.textContent = `目标剂量 (${labelUnit(elements.doseUnitSelect.value || getActiveDrug().doseUnit)})`;
}

function calculateAndRender() {
  const drug = getActiveDrug();
  const formula = FORMULAS[drug.doseUnit];
  const input = readInput(drug);
  const validation = validateInput(drug, formula, input);
  const concentration = validation.hasError ? null : calculateConcentration(input, formula.concentrationUnit);
  const result = validation.hasError ? null : calculateResult(input, formula, concentration);
  const messages = [...validation.messages, ...validateResult(result)];

  elements.resultValue.textContent = result !== null && Number.isFinite(result) ? fmt(result) : "--";
  elements.resultUnit.textContent = state.mode === "doseToRate" ? "ml/h" : labelUnit(drug.doseUnit);
  elements.concentrationText.textContent =
    concentration !== null && Number.isFinite(concentration) ? `${fmt(concentration)} ${labelUnit(formula.concentrationUnit)}` : "--";
  elements.weightNote.textContent = formula.requiresWeight ? "当前剂量单位需要体重参与计算。" : "当前剂量单位不按体重计算，体重不会参与本次公式。";
  elements.targetDoseLabel.textContent = `目标剂量 (${labelUnit(drug.doseUnit)})`;

  renderMessages(messages);
  renderProcess(drug, formula, input, concentration, result, messages);
}

function readInput(drug) {
  return {
    amount: numeric(drug.amount),
    amountUnit: drug.amountUnit,
    volume: numeric(drug.volume),
    weight: numeric(elements.weightInput.value),
    dose: numeric(drug.dose),
    rate: numeric(elements.pumpRateInput.value),
  };
}

function validateInput(drug, formula, input) {
  const messages = [];
  addRequired(messages, input.amount, "药物总量为空");
  addRequired(messages, input.volume, "总体积为空");

  if (state.mode === "doseToRate") {
    addRequired(messages, input.dose, "默认给药剂量为空");
  } else {
    addRequired(messages, input.rate, "当前泵速为空");
  }

  if (formula.requiresWeight) {
    addRequired(messages, input.weight, "体重为空");
  }

  if (input.amount !== null && input.amount <= 0) messages.push(message("error", "药物总量需大于 0。"));
  if (input.volume !== null && input.volume <= 0) messages.push(message("error", "总体积需大于 0。"));
  if (input.weight !== null && input.weight < 0) messages.push(message("error", "体重不能为负数。"));
  if (input.dose !== null && input.dose < 0) messages.push(message("error", "给药剂量不能为负数。"));
  if (input.rate !== null && input.rate < 0) messages.push(message("error", "当前泵速不能为负数。"));

  if (drug.amountType === "unit" && input.amountUnit !== "U") {
    messages.push(message("error", "单位不匹配：该药物按 U 计算，总量单位应为 U。"));
  }

  if (drug.amountType === "mass" && input.amountUnit === "U") {
    messages.push(message("error", "单位不匹配：该药物按质量单位计算，总量单位应为 mg 或 μg。"));
  }

  return { messages, hasError: messages.some((item) => item.type === "error") };
}

function addRequired(messages, value, text) {
  if (value === null || value === "") {
    messages.push(message("error", text));
  }
}

function validateResult(result) {
  if (result === null || !Number.isFinite(result)) return [];
  if (result < 0) return [message("error", "结果为负数，请检查输入。")];
  if (result > RATE_WARNING_LIMIT) return [message("warning", `结果过大：超过 ${RATE_WARNING_LIMIT}，请复核单位、浓度和医嘱。`)];
  return [];
}

function calculateConcentration(input, targetUnit) {
  const convertedAmount = convertAmount(input.amount, input.amountUnit, targetUnit);
  return convertedAmount / input.volume;
}

function calculateResult(input, formula, concentration) {
  const payload = {
    dose: input.dose,
    rate: input.rate,
    weight: input.weight,
    concentration,
  };
  return state.mode === "doseToRate" ? formula.doseToRate(payload) : formula.rateToDose(payload);
}

function convertAmount(amount, sourceUnit, targetConcentrationUnit) {
  if (targetConcentrationUnit === "ug/ml") return sourceUnit === "mg" ? amount * 1000 : amount;
  if (targetConcentrationUnit === "mg/ml") return sourceUnit === "ug" ? amount / 1000 : amount;
  return amount;
}

function renderMessages(messages) {
  elements.messageList.innerHTML = messages.map((item) => `<div class="message ${item.type}">${escapeHtml(item.text)}</div>`).join("");
}

function renderProcess(drug, formula, input, concentration, result, messages) {
  if (messages.some((item) => item.type === "error") || result === null || !Number.isFinite(result)) {
    elements.processList.innerHTML = "<li>请先补全有效输入后再复核计算过程。</li>";
    return;
  }

  const convertedAmount = convertAmount(input.amount, input.amountUnit, formula.concentrationUnit);
  const amountLabel = formula.concentrationUnit.split("/")[0].replace("ug", "μg");
  const firstLine =
    state.mode === "doseToRate"
      ? `药物：<strong>${escapeHtml(drug.name)}</strong>，默认剂量：<strong>${fmt(input.dose)} ${labelUnit(drug.doseUnit)}</strong>`
      : `药物：<strong>${escapeHtml(drug.name)}</strong>，当前泵速：<strong>${fmt(input.rate)} ml/h</strong>`;

  const lines = [
    firstLine,
    `药物总量换算：${fmt(input.amount)} ${labelUnit(input.amountUnit)} = <strong>${fmt(convertedAmount)} ${amountLabel}</strong>`,
    `浓度 = ${fmt(convertedAmount)} ÷ ${fmt(input.volume)} = <strong>${fmt(concentration)} ${labelUnit(formula.concentrationUnit)}</strong>`,
    ...formula.process({
      dose: input.dose,
      rate: input.rate,
      weight: input.weight,
      concentration,
      result,
      mode: state.mode,
    }),
  ];

  elements.processList.innerHTML = lines.map((line) => `<li>${line}</li>`).join("");
}

function createCustomDrug() {
  const name = elements.newDrugNameInput.value.trim();
  const doseUnit = elements.newDrugDoseUnitSelect.value;
  if (!name) {
    elements.newDrugNameInput.focus();
    return;
  }

  const targetConcentration = FORMULAS[doseUnit].concentrationUnit;
  const isUnitDrug = targetConcentration === "U/ml";
  const drug = {
    id: `custom-${Date.now()}`,
    name,
    amount: "",
    amountUnit: isUnitDrug ? "U" : "mg",
    volume: 50,
    dose: "",
    doseUnit,
    amountType: isUnitDrug ? "unit" : "mass",
    editable: true,
    usage: "自定义药物：请按药品说明书、医嘱和院内规范填写用途。",
    caution: "自定义药物：请补充禁忌、监测指标和外渗/配伍注意事项。",
    limit: "未设置。请按说明书、院内规范和医嘱复核。",
  };

  state.drugs.push(drug);
  state.activeDrugId = drug.id;
  persistDrugs();
  elements.dialog.close();
  renderDrugSelect();
  loadDrugIntoForm(drug);
  calculateAndRender();
}

function deleteActiveDrug() {
  const drug = getActiveDrug();
  if (!drug.editable) return;
  const confirmed = window.confirm(`删除自定义药物“${drug.name}”？`);
  if (!confirmed) return;
  state.drugs = state.drugs.filter((item) => item.id !== drug.id);
  state.activeDrugId = state.drugs[0].id;
  persistDrugs();
  renderDrugSelect();
  loadDrugIntoForm(getActiveDrug());
  calculateAndRender();
}

function getActiveDrug() {
  return state.drugs.find((drug) => drug.id === state.activeDrugId) || state.drugs[0];
}

function numeric(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOrEmpty(value) {
  return value === "" ? "" : Number(value);
}

function fmt(value) {
  return Number(value).toFixed(2);
}

function labelUnit(unit) {
  return String(unit).replaceAll("ug", "μg");
}

function message(type, text) {
  return { type, text };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
