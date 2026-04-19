const designCreateBtn = document.getElementById("designCreateBtn");
const designTtsBtn = document.getElementById("designTtsBtn");
const enrollCreateBtn = document.getElementById("enrollCreateBtn");
const enrollTtsBtn = document.getElementById("enrollTtsBtn");
const enrollAudioInput = document.getElementById("enrollAudio");
const enrollMimeInput = document.getElementById("enrollMime");
const presetModelSelect = document.getElementById("presetModel");
const presetVoiceSelect = document.getElementById("presetVoice");
const presetInstructionsField = document.getElementById("presetInstructionsField");
const presetInstructionsInput = document.getElementById("presetInstructions");
const presetOptimizeInput = document.getElementById("presetOptimize");
const presetInstructionExampleBtn = document.getElementById("presetInstructionExample");
const presetVoiceHint = document.getElementById("presetVoiceHint");
const presetModelHint = document.getElementById("presetModelHint");
const presetTtsBtn = document.getElementById("presetTtsBtn");
const presetTextInput = document.getElementById("presetText");

let designVoice = "";
let enrollVoice = "";
const progressState = {
  design: null,
  enroll: null,
  preset: null,
};
const audioObjectUrls = new Map();

function getApiKey() {
  return document.getElementById("apiKey").value.trim();
}

function setStatus(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.style.color = isError ? "#b42318" : "#5b6b85";
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error || "请求失败");
}

function getProgressElements(scope) {
  return {
    wrap: document.getElementById(`${scope}ProgressWrap`),
    bar: document.getElementById(`${scope}ProgressBar`),
    text: document.getElementById(`${scope}ProgressText`),
  };
}

function renderProgress(scope, value) {
  const { wrap, bar, text } = getProgressElements(scope);
  const bounded = Math.max(0, Math.min(100, Math.floor(value)));
  wrap.classList.remove("hidden");
  bar.style.width = `${bounded}%`;
  text.textContent = `${bounded}%`;
}

function hideProgress(scope) {
  const { wrap, bar, text } = getProgressElements(scope);
  wrap.classList.add("hidden");
  bar.style.width = "0%";
  text.textContent = "0%";
}

function beginProgress(scope, statusElementId, actionText) {
  const previous = progressState[scope];
  if (previous && previous.timer) {
    clearInterval(previous.timer);
  }

  const state = {
    value: 0,
    timer: null,
  };
  progressState[scope] = state;

  renderProgress(scope, 0);
  setStatus(statusElementId, `${actionText} 0%`);

  state.timer = setInterval(() => {
    if (progressState[scope] !== state) {
      clearInterval(state.timer);
      return;
    }
    if (state.value >= 92) {
      return;
    }

    const step = state.value < 60 ? Math.random() * 5 + 2 : Math.random() * 2 + 1;
    state.value = Math.min(92, state.value + step);
    renderProgress(scope, state.value);
    setStatus(statusElementId, `${actionText} ${Math.floor(state.value)}%`);
  }, 220);

  return {
    complete(message) {
      if (progressState[scope] !== state) {
        return;
      }
      clearInterval(state.timer);
      renderProgress(scope, 100);
      setStatus(statusElementId, `${message}（100%）`);
    },
    fail(message) {
      if (progressState[scope] !== state) {
        return;
      }
      clearInterval(state.timer);
      hideProgress(scope);
      setStatus(statusElementId, message, true);
    },
  };
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = null;
    }
  }
  if (!response.ok) {
    const message = (data && data.error) || text || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data || {};
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}

async function postForm(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response);
}

function formatToMime(format) {
  const lower = (format || "").toLowerCase();
  if (lower === "mp3") {
    return "audio/mpeg";
  }
  return "audio/wav";
}

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType || "application/octet-stream" });
}

function setAudioPlayer(playerId, base64, mimeType) {
  const player = document.getElementById(playerId);
  const previousUrl = audioObjectUrls.get(playerId);
  if (previousUrl) {
    URL.revokeObjectURL(previousUrl);
    audioObjectUrls.delete(playerId);
  }

  if (!base64) {
    player.removeAttribute("src");
    player.load();
    return;
  }

  const blob = base64ToBlob(base64, mimeType);
  const url = URL.createObjectURL(blob);
  audioObjectUrls.set(playerId, url);
  player.src = url;
  player.load();
}

function updateTtsButtonsEnabled() {
  designTtsBtn.disabled = !designVoice;
  enrollTtsBtn.disabled = !enrollVoice;
}

const SPEECH_RATE_MIN = 0.5;
const SPEECH_RATE_MAX = 2.0;
const SPEECH_RATE_DEFAULT = 1.0;

function readSpeechRate(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return SPEECH_RATE_DEFAULT;
  const raw = el.value.trim();
  if (!raw) return SPEECH_RATE_DEFAULT;
  const value = Number(raw);
  if (!Number.isFinite(value)) return SPEECH_RATE_DEFAULT;
  const clamped = Math.min(SPEECH_RATE_MAX, Math.max(SPEECH_RATE_MIN, value));
  if (clamped !== value) {
    el.value = String(clamped);
  }
  return clamped;
}

function setDesignVoice(name) {
  designVoice = name || "";
  document.getElementById("designVoiceName").textContent = designVoice || "-";
  updateTtsButtonsEnabled();
}

function setEnrollVoice(name) {
  enrollVoice = name || "";
  document.getElementById("enrollVoiceName").textContent = enrollVoice || "-";
  updateTtsButtonsEnabled();
}

async function handleDesignCreate() {
  const progress = beginProgress("design", "designStatus", "正在生成音色...");
  designCreateBtn.disabled = true;
  designTtsBtn.disabled = true;

  try {
    const payload = {
      api_key: getApiKey(),
      voice_prompt: document.getElementById("designPrompt").value,
      preview_text: document.getElementById("designPreview").value,
      preferred_name: document.getElementById("designName").value,
      language: document.getElementById("designLang").value,
      target_model: document.getElementById("designModel").value,
      sample_rate: Number(document.getElementById("designSampleRate").value),
      response_format: document.getElementById("designResponseFormat").value,
    };

    const data = await postJson("/api/design-voice", payload);
    setDesignVoice(data.voice);

    if (data.preview_audio_base64) {
      const mimeType = formatToMime(data.preview_audio_format);
      setAudioPlayer("designPreviewPlayer", data.preview_audio_base64, mimeType);
    } else {
      setAudioPlayer("designPreviewPlayer", null);
    }

    progress.complete("音色已生成。");
  } catch (error) {
    progress.fail(getErrorMessage(error));
  } finally {
    designCreateBtn.disabled = false;
    updateTtsButtonsEnabled();
  }
}

async function handleDesignTts() {
  if (!designVoice) {
    setStatus("designStatus", "请先生成音色后再合成。", true);
    return;
  }
  const text = document.getElementById("designTtsText").value.trim();
  if (!text) {
    setStatus("designStatus", "请填写要合成的文本。", true);
    return;
  }

  const progress = beginProgress("design", "designStatus", "正在合成...");
  designTtsBtn.disabled = true;
  designCreateBtn.disabled = true;

  try {
    const payload = {
      api_key: getApiKey(),
      voice: designVoice,
      text,
      model: document.getElementById("designModel").value,
      sample_rate: Number(document.getElementById("designSampleRate").value),
      format: "wav",
      speech_rate: readSpeechRate("designSpeechRate"),
    };

    const data = await postJson("/api/tts", payload);
    setAudioPlayer("designTtsPlayer", data.audio_base64, data.mime_type);

    progress.complete("合成完成。");
  } catch (error) {
    progress.fail(getErrorMessage(error));
  } finally {
    designCreateBtn.disabled = false;
    updateTtsButtonsEnabled();
  }
}

async function handleEnrollCreate() {
  if (!enrollAudioInput.files.length) {
    setStatus("enrollStatus", "请先选择音频文件。", true);
    return;
  }

  const progress = beginProgress("enroll", "enrollStatus", "正在上传并创建音色...");
  enrollCreateBtn.disabled = true;
  enrollTtsBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("api_key", getApiKey());
    formData.append("audio", enrollAudioInput.files[0]);
    formData.append("preferred_name", document.getElementById("enrollName").value);
    formData.append("audio_mime_type", enrollMimeInput.value);
    formData.append("target_model", document.getElementById("enrollModel").value);

    const data = await postForm("/api/enroll-voice", formData);
    setEnrollVoice(data.voice);

    progress.complete("音色已创建。");
  } catch (error) {
    progress.fail(getErrorMessage(error));
  } finally {
    enrollCreateBtn.disabled = false;
    updateTtsButtonsEnabled();
  }
}

async function handleEnrollTts() {
  if (!enrollVoice) {
    setStatus("enrollStatus", "请先创建音色后再合成。", true);
    return;
  }
  const text = document.getElementById("enrollTtsText").value.trim();
  if (!text) {
    setStatus("enrollStatus", "请填写要合成的文本。", true);
    return;
  }

  const progress = beginProgress("enroll", "enrollStatus", "正在合成...");
  enrollTtsBtn.disabled = true;
  enrollCreateBtn.disabled = true;

  try {
    const payload = {
      api_key: getApiKey(),
      voice: enrollVoice,
      text,
      model: document.getElementById("enrollModel").value,
      sample_rate: 24000,
      format: "wav",
      speech_rate: readSpeechRate("enrollSpeechRate"),
    };

    const data = await postJson("/api/tts", payload);
    setAudioPlayer("enrollTtsPlayer", data.audio_base64, data.mime_type);

    progress.complete("合成完成。");
  } catch (error) {
    progress.fail(getErrorMessage(error));
  } finally {
    enrollCreateBtn.disabled = false;
    updateTtsButtonsEnabled();
  }
}

function handleEnrollFileChange() {
  const file = enrollAudioInput.files && enrollAudioInput.files[0];
  if (!file) {
    return;
  }
  if (file.type) {
    enrollMimeInput.value = file.type;
  } else if (/\.wav$/i.test(file.name)) {
    enrollMimeInput.value = "audio/wav";
  } else if (/\.mp3$/i.test(file.name)) {
    enrollMimeInput.value = "audio/mpeg";
  } else if (/\.m4a$/i.test(file.name) || /\.aac$/i.test(file.name)) {
    enrollMimeInput.value = "audio/aac";
  } else if (/\.ogg$/i.test(file.name)) {
    enrollMimeInput.value = "audio/ogg";
  }
}

designCreateBtn.addEventListener("click", handleDesignCreate);
designTtsBtn.addEventListener("click", handleDesignTts);
enrollCreateBtn.addEventListener("click", handleEnrollCreate);
enrollTtsBtn.addEventListener("click", handleEnrollTts);
enrollAudioInput.addEventListener("change", handleEnrollFileChange);

updateTtsButtonsEnabled();

// ---------- Preset voice + instructions ----------

function getCurrentModelOption() {
  const value = presetModelSelect.value;
  return TTS_MODEL_OPTIONS.find((opt) => opt.value === value) || null;
}

function getCurrentVoice() {
  const value = presetVoiceSelect.value;
  return PRESET_VOICES.find((v) => v.voice === value) || null;
}

function populateModelOptions() {
  presetModelSelect.innerHTML = "";
  for (const option of TTS_MODEL_OPTIONS) {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    presetModelSelect.appendChild(el);
  }
}

function groupVoicesByDialect(voices) {
  const groups = new Map();
  for (const voice of voices) {
    if (!groups.has(voice.dialect)) {
      groups.set(voice.dialect, []);
    }
    groups.get(voice.dialect).push(voice);
  }
  return groups;
}

function populateVoiceOptions(preferredVoice) {
  const model = getCurrentModelOption();
  presetVoiceSelect.innerHTML = "";

  if (!model) {
    presetVoiceHint.textContent = "请选择一个模型。";
    return;
  }

  const supported = PRESET_VOICES.filter((voice) => voice.tags.includes(model.tag));
  if (supported.length === 0) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "（该模型暂无预设音色）";
    presetVoiceSelect.appendChild(placeholder);
    presetVoiceHint.textContent = "该模型当前版本没有预设音色，请换一个模型。";
    return;
  }

  const groups = groupVoicesByDialect(supported);
  const dialectOrder = ["普通话"];
  const otherDialects = [...groups.keys()].filter((d) => !dialectOrder.includes(d)).sort();
  const orderedDialects = [...dialectOrder, ...otherDialects].filter((d) => groups.has(d));

  for (const dialect of orderedDialects) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = dialect;
    for (const voice of groups.get(dialect)) {
      const el = document.createElement("option");
      el.value = voice.voice;
      el.textContent = `${voice.voice} · ${voice.nameCn} · ${voice.gender}`;
      optgroup.appendChild(el);
    }
    presetVoiceSelect.appendChild(optgroup);
  }

  let nextValue = "";
  if (preferredVoice && supported.some((v) => v.voice === preferredVoice)) {
    nextValue = preferredVoice;
  } else {
    nextValue = supported[0].voice;
  }
  presetVoiceSelect.value = nextValue;
  updatePresetVoiceHint();
}

function updatePresetVoiceHint() {
  const voice = getCurrentVoice();
  if (!voice) {
    presetVoiceHint.textContent = "先选择模型，再从对应支持的音色中挑选。";
    return;
  }
  presetVoiceHint.textContent = `${voice.nameCn} · ${voice.gender} · ${voice.dialect} — ${voice.description}`;
}

function updatePresetInstructionsVisibility() {
  const model = getCurrentModelOption();
  if (!model) {
    presetInstructionsField.classList.add("hidden");
    presetModelHint.textContent = "";
    return;
  }
  if (model.supportsInstructions) {
    presetInstructionsField.classList.remove("hidden");
    presetModelHint.textContent = "该模型支持 instructions，可通过指令定制情绪与节奏。";
  } else {
    presetInstructionsField.classList.add("hidden");
    presetModelHint.textContent = "该模型不支持 instructions，直接合成即可。";
  }
}

function pickRandomInstruction() {
  if (!Array.isArray(PRESET_INSTRUCTION_EXAMPLES) || PRESET_INSTRUCTION_EXAMPLES.length === 0) {
    return;
  }
  const current = presetInstructionsInput.value.trim();
  let pick = current;
  let guard = 0;
  while ((pick === current || !pick) && guard < 10) {
    pick = PRESET_INSTRUCTION_EXAMPLES[Math.floor(Math.random() * PRESET_INSTRUCTION_EXAMPLES.length)];
    guard += 1;
  }
  presetInstructionsInput.value = pick;
}

async function handlePresetTts() {
  const voice = presetVoiceSelect.value;
  if (!voice) {
    setStatus("presetStatus", "请选择音色。", true);
    return;
  }
  const text = presetTextInput.value.trim();
  if (!text) {
    setStatus("presetStatus", "请填写要合成的文本。", true);
    return;
  }

  const model = getCurrentModelOption();
  if (!model) {
    setStatus("presetStatus", "请选择目标模型。", true);
    return;
  }

  const progress = beginProgress("preset", "presetStatus", "正在合成...");
  presetTtsBtn.disabled = true;

  try {
    const payload = {
      api_key: getApiKey(),
      voice,
      text,
      model: model.value,
      sample_rate: 24000,
      format: "wav",
      speech_rate: readSpeechRate("presetSpeechRate"),
    };
    if (model.supportsInstructions) {
      const instructions = presetInstructionsInput.value.trim();
      if (instructions) {
        payload.instructions = instructions;
        payload.optimize_instructions = !!presetOptimizeInput.checked;
      }
    }

    const data = await postJson("/api/tts", payload);
    setAudioPlayer("presetTtsPlayer", data.audio_base64, data.mime_type);
    progress.complete("合成完成。");
  } catch (error) {
    progress.fail(getErrorMessage(error));
  } finally {
    presetTtsBtn.disabled = false;
  }
}

function handleModelChange() {
  const previousVoice = presetVoiceSelect.value;
  updatePresetInstructionsVisibility();
  populateVoiceOptions(previousVoice);
}

populateModelOptions();
presetModelSelect.value = TTS_MODEL_OPTIONS[0].value;
updatePresetInstructionsVisibility();
populateVoiceOptions();

presetModelSelect.addEventListener("change", handleModelChange);
presetVoiceSelect.addEventListener("change", updatePresetVoiceHint);
presetInstructionExampleBtn.addEventListener("click", pickRandomInstruction);
presetTtsBtn.addEventListener("click", handlePresetTts);

// ---------- Voice catalog (bottom reference) ----------

const catalogGrid = document.getElementById("catalogGrid");
const catalogSearchInput = document.getElementById("catalogSearch");
const catalogDialectSelect = document.getElementById("catalogDialect");
const catalogGenderSelect = document.getElementById("catalogGender");
const catalogModelTagSelect = document.getElementById("catalogModelTag");
const catalogCountEl = document.getElementById("catalogCount");
const catalogEmptyEl = document.getElementById("catalogEmpty");

function populateCatalogDialectOptions() {
  const dialects = Array.from(new Set(PRESET_VOICES.map((v) => v.dialect))).sort((a, b) => {
    if (a === "普通话") return -1;
    if (b === "普通话") return 1;
    return a.localeCompare(b, "zh-CN");
  });
  for (const dialect of dialects) {
    const el = document.createElement("option");
    el.value = dialect;
    el.textContent = dialect;
    catalogDialectSelect.appendChild(el);
  }
}

function renderCatalog() {
  const query = catalogSearchInput.value.trim().toLowerCase();
  const dialect = catalogDialectSelect.value;
  const gender = catalogGenderSelect.value;
  const modelTag = catalogModelTagSelect.value;

  const filtered = PRESET_VOICES.filter((voice) => {
    if (dialect && voice.dialect !== dialect) return false;
    if (gender && voice.gender !== gender) return false;
    if (modelTag && !voice.tags.includes(modelTag)) return false;
    if (!query) return true;
    const hay = `${voice.voice} ${voice.nameCn} ${voice.description} ${voice.dialect}`.toLowerCase();
    return hay.includes(query);
  });

  catalogGrid.innerHTML = "";
  if (filtered.length === 0) {
    catalogEmptyEl.classList.remove("hidden");
  } else {
    catalogEmptyEl.classList.add("hidden");
  }

  const fragment = document.createDocumentFragment();
  for (const voice of filtered) {
    const card = document.createElement("div");
    card.className = "voice-card";
    card.dataset.voice = voice.voice;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `选择音色 ${voice.voice} ${voice.nameCn}`);

    const head = document.createElement("div");
    head.className = "voice-card-head";
    const name = document.createElement("span");
    name.className = "voice-card-name";
    name.textContent = voice.voice;
    const cn = document.createElement("span");
    cn.className = "voice-card-cn";
    cn.textContent = voice.nameCn;
    head.appendChild(name);
    head.appendChild(cn);

    const desc = document.createElement("p");
    desc.className = "voice-card-desc";
    desc.textContent = voice.description;

    const meta = document.createElement("div");
    meta.className = "voice-card-meta";

    const genderTag = document.createElement("span");
    genderTag.className = `voice-tag ${voice.gender === "女" ? "gender-female" : "gender-male"}`;
    genderTag.textContent = voice.gender;
    meta.appendChild(genderTag);

    const dialectTag = document.createElement("span");
    dialectTag.className = "voice-tag dialect";
    dialectTag.textContent = voice.dialect;
    meta.appendChild(dialectTag);

    for (const tag of voice.tags) {
      const modelTagEl = document.createElement("span");
      modelTagEl.className = "voice-tag model";
      modelTagEl.textContent = MODEL_TAG_LABEL[tag] || tag;
      meta.appendChild(modelTagEl);
    }

    card.appendChild(head);
    card.appendChild(desc);
    card.appendChild(meta);
    fragment.appendChild(card);
  }
  catalogGrid.appendChild(fragment);
  highlightActiveCatalogCard();
}

function highlightActiveCatalogCard() {
  const activeVoice = presetVoiceSelect.value;
  const cards = catalogGrid.querySelectorAll(".voice-card");
  cards.forEach((card) => {
    if (card.dataset.voice === activeVoice) {
      card.classList.add("is-active");
    } else {
      card.classList.remove("is-active");
    }
  });
}

function selectVoiceFromCatalog(voiceName) {
  const voice = PRESET_VOICES.find((v) => v.voice === voiceName);
  if (!voice) return;

  const currentModel = getCurrentModelOption();
  if (!currentModel || !voice.tags.includes(currentModel.tag)) {
    const fallback = TTS_MODEL_OPTIONS.find((m) => voice.tags.includes(m.tag));
    if (fallback) {
      presetModelSelect.value = fallback.value;
      updatePresetInstructionsVisibility();
      populateVoiceOptions(voiceName);
    }
  } else {
    presetVoiceSelect.value = voiceName;
    updatePresetVoiceHint();
  }
  highlightActiveCatalogCard();

  const presetCard = document.getElementById("presetCard");
  if (presetCard) {
    presetCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

populateCatalogDialectOptions();
catalogCountEl.textContent = `· 共 ${PRESET_VOICES.length} 种预设音色`;
renderCatalog();

catalogSearchInput.addEventListener("input", renderCatalog);
catalogDialectSelect.addEventListener("change", renderCatalog);
catalogGenderSelect.addEventListener("change", renderCatalog);
catalogModelTagSelect.addEventListener("change", renderCatalog);
catalogGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".voice-card");
  if (card && card.dataset.voice) {
    selectVoiceFromCatalog(card.dataset.voice);
  }
});
catalogGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".voice-card");
  if (card && card.dataset.voice) {
    event.preventDefault();
    selectVoiceFromCatalog(card.dataset.voice);
  }
});
presetVoiceSelect.addEventListener("change", highlightActiveCatalogCard);
presetModelSelect.addEventListener("change", highlightActiveCatalogCard);

// ---------- Speech rate preset buttons ----------

document.querySelectorAll(".field.speech-rate").forEach((field) => {
  const input = field.querySelector(".speech-rate-input");
  if (!input) return;
  field.querySelectorAll(".speech-rate-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.dataset.rate;
    });
  });
});
