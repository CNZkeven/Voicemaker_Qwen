const designCreateBtn = document.getElementById("designCreateBtn");
const designTtsBtn = document.getElementById("designTtsBtn");
const enrollCreateBtn = document.getElementById("enrollCreateBtn");
const enrollTtsBtn = document.getElementById("enrollTtsBtn");

let designVoice = "";
let enrollVoice = "";

function getApiKey() {
  return document.getElementById("apiKey").value.trim();
}

function setStatus(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.style.color = isError ? "#b42318" : "#5b6b85";
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

async function postForm(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

function formatToMime(format) {
  const lower = (format || "").toLowerCase();
  if (lower === "mp3") {
    return "audio/mpeg";
  }
  if (lower === "wav") {
    return "audio/wav";
  }
  return "audio/wav";
}

function setAudioPlayer(playerId, base64, mimeType) {
  const player = document.getElementById(playerId);
  if (!base64) {
    player.removeAttribute("src");
    return;
  }
  player.src = `data:${mimeType};base64,${base64}`;
}

async function handleDesignCreate() {
  setStatus("designStatus", "正在生成音色...");
  designCreateBtn.disabled = true;

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
    designVoice = data.voice;
    document.getElementById("designVoiceName").textContent = designVoice || "-";

    if (data.preview_audio_base64) {
      const mimeType = formatToMime(data.preview_audio_format);
      setAudioPlayer("designPreviewPlayer", data.preview_audio_base64, mimeType);
    }

    setStatus("designStatus", "音色已生成。");
  } catch (error) {
    setStatus("designStatus", error.message, true);
  } finally {
    designCreateBtn.disabled = false;
  }
}

async function handleDesignTts() {
  setStatus("designStatus", "正在合成...");
  designTtsBtn.disabled = true;

  try {
    const payload = {
      api_key: getApiKey(),
      voice: designVoice,
      text: document.getElementById("designTtsText").value,
      model: document.getElementById("designModel").value,
      sample_rate: Number(document.getElementById("designSampleRate").value),
      format: "wav",
    };

    const data = await postJson("/api/tts", payload);
    setAudioPlayer("designTtsPlayer", data.audio_base64, data.mime_type);

    setStatus("designStatus", "合成完成。");
  } catch (error) {
    setStatus("designStatus", error.message, true);
  } finally {
    designTtsBtn.disabled = false;
  }
}

async function handleEnrollCreate() {
  setStatus("enrollStatus", "正在上传并创建音色...");
  enrollCreateBtn.disabled = true;

  try {
    const fileInput = document.getElementById("enrollAudio");
    if (!fileInput.files.length) {
      throw new Error("请先选择音频文件。");
    }

    const formData = new FormData();
    formData.append("api_key", getApiKey());
    formData.append("audio", fileInput.files[0]);
    formData.append("preferred_name", document.getElementById("enrollName").value);
    formData.append("audio_mime_type", document.getElementById("enrollMime").value);
    formData.append("target_model", document.getElementById("enrollModel").value);

    const data = await postForm("/api/enroll-voice", formData);
    enrollVoice = data.voice;
    document.getElementById("enrollVoiceName").textContent = enrollVoice || "-";

    setStatus("enrollStatus", "音色已创建。");
  } catch (error) {
    setStatus("enrollStatus", error.message, true);
  } finally {
    enrollCreateBtn.disabled = false;
  }
}

async function handleEnrollTts() {
  setStatus("enrollStatus", "正在合成...");
  enrollTtsBtn.disabled = true;

  try {
    const payload = {
      api_key: getApiKey(),
      voice: enrollVoice,
      text: document.getElementById("enrollTtsText").value,
      model: document.getElementById("enrollModel").value,
      sample_rate: 24000,
      format: "wav",
    };

    const data = await postJson("/api/tts", payload);
    setAudioPlayer("enrollTtsPlayer", data.audio_base64, data.mime_type);

    setStatus("enrollStatus", "合成完成。");
  } catch (error) {
    setStatus("enrollStatus", error.message, true);
  } finally {
    enrollTtsBtn.disabled = false;
  }
}

designCreateBtn.addEventListener("click", handleDesignCreate);
designTtsBtn.addEventListener("click", handleDesignTts);
enrollCreateBtn.addEventListener("click", handleEnrollCreate);
enrollTtsBtn.addEventListener("click", handleEnrollTts);
