import base64
import io
import os
import sys
import threading
import wave
import webbrowser
from typing import Optional, Tuple

import requests
from flask import Flask, jsonify, render_template, request

import dashscope
from dashscope.audio.qwen_tts_realtime import (
    QwenTtsRealtime,
    QwenTtsRealtimeCallback,
    AudioFormat,
)

APP_TITLE = "KK工作室(Powered by Qwen)"

DASHSCOPE_HTTP_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization"
DASHSCOPE_WSS_URL = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime"

# Adjust defaults here as needed.
DEFAULT_DESIGN_MODEL = "qwen3-tts-vd-realtime-2025-12-16"
DEFAULT_ENROLL_MODEL = "qwen3-tts-vc-realtime-2026-01-15"
DEFAULT_SAMPLE_RATE = 24000
DEFAULT_RESPONSE_FORMAT = "wav"

API_KEY_ENV = "your-key"

def resource_path(relative_path: str) -> str:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath(os.path.dirname(__file__))
    return os.path.join(base_path, relative_path)


app = Flask(
    __name__,
    template_folder=resource_path("templates"),
    static_folder=resource_path("static"),
)

AUDIO_FORMAT_BY_RATE = {
    24000: AudioFormat.PCM_24000HZ_MONO_16BIT,
}


def resolve_api_key(inbound_key: Optional[str]) -> str:
    env_key = os.getenv(API_KEY_ENV, "").strip()
    if env_key:
        return env_key
    return (inbound_key or "").strip()


def dashscope_headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def create_voice_design(
    api_key: str,
    voice_prompt: str,
    preview_text: str,
    preferred_name: str,
    language: str,
    target_model: str,
    sample_rate: int,
    response_format: str,
) -> Tuple[str, Optional[str]]:
    payload = {
        "model": "qwen-voice-design",
        "input": {
            "action": "create",
            "target_model": target_model,
            "voice_prompt": voice_prompt,
            "preview_text": preview_text,
            "preferred_name": preferred_name,
            "language": language,
        },
        "parameters": {
            "sample_rate": sample_rate,
            "response_format": response_format,
        },
    }

    resp = requests.post(
        DASHSCOPE_HTTP_URL,
        headers=dashscope_headers(api_key),
        json=payload,
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Design request failed: {resp.status_code} {resp.text}")

    data = resp.json()
    voice_name = data["output"]["voice"]
    preview_audio = data["output"].get("preview_audio", {}).get("data")
    return voice_name, preview_audio


def create_voice_enrollment(
    api_key: str,
    audio_bytes: bytes,
    audio_mime_type: str,
    preferred_name: str,
    target_model: str,
) -> str:
    audio_b64 = base64.b64encode(audio_bytes).decode("ascii")
    data_uri = f"data:{audio_mime_type};base64,{audio_b64}"

    payload = {
        "model": "qwen-voice-enrollment",
        "input": {
            "action": "create",
            "target_model": target_model,
            "preferred_name": preferred_name,
            "audio": {"data": data_uri},
        },
    }

    resp = requests.post(
        DASHSCOPE_HTTP_URL,
        headers=dashscope_headers(api_key),
        json=payload,
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Enrollment failed: {resp.status_code} {resp.text}")

    data = resp.json()
    return data["output"]["voice"]


class CollectingCallback(QwenTtsRealtimeCallback):
    def __init__(self) -> None:
        self.complete_event = threading.Event()
        self.audio_bytes = bytearray()
        self.last_error: Optional[Exception] = None

    def on_open(self) -> None:
        pass

    def on_close(self, close_status_code, close_msg) -> None:
        self.complete_event.set()

    def on_event(self, response: dict) -> None:
        try:
            event_type = response.get("type", "")
            if event_type == "response.audio.delta":
                chunk = base64.b64decode(response["delta"])
                self.audio_bytes.extend(chunk)
            elif event_type in ("response.done", "session.finished"):
                self.complete_event.set()
        except Exception as exc:
            self.last_error = exc
            self.complete_event.set()

    def wait_for_finished(self, timeout: int = 60) -> None:
        self.complete_event.wait(timeout=timeout)


def synthesize_realtime(
    api_key: str,
    model: str,
    voice: str,
    text: str,
    sample_rate: int,
) -> bytes:
    dashscope.api_key = api_key

    audio_format = AUDIO_FORMAT_BY_RATE.get(sample_rate)
    if audio_format is None:
        raise RuntimeError(
            f"Unsupported sample_rate {sample_rate}. Update AUDIO_FORMAT_BY_RATE to add new formats."
        )

    callback = CollectingCallback()
    client = QwenTtsRealtime(model=model, callback=callback, url=DASHSCOPE_WSS_URL)
    client.connect()
    client.update_session(
        voice=voice,
        response_format=audio_format,
        mode="server_commit",
    )
    client.append_text(text)
    client.finish()

    callback.wait_for_finished(timeout=60)

    if callback.last_error:
        raise RuntimeError(f"Realtime synthesis failed: {callback.last_error}")

    if not callback.audio_bytes:
        raise RuntimeError("No audio data received from realtime synthesis")

    return bytes(callback.audio_bytes)


def pcm_to_wav(pcm_bytes: bytes, sample_rate: int) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_bytes)
    return buffer.getvalue()


@app.get("/")
def index() -> str:
    return render_template("index.html", app_title=APP_TITLE)


@app.post("/api/design-voice")
def api_design_voice():
    payload = request.get_json(force=True)
    api_key = resolve_api_key(payload.get("api_key"))
    if not api_key:
        return jsonify({"error": f"缺少 API Key，请设置 {API_KEY_ENV} 或在页面中填写 api_key。"}), 400

    voice_prompt = (payload.get("voice_prompt") or "").strip()
    preview_text = (payload.get("preview_text") or "").strip()
    preferred_name = (payload.get("preferred_name") or "").strip()
    language = (payload.get("language") or "zh").strip()
    target_model = (payload.get("target_model") or DEFAULT_DESIGN_MODEL).strip()
    sample_rate = int(payload.get("sample_rate") or DEFAULT_SAMPLE_RATE)
    response_format = (payload.get("response_format") or DEFAULT_RESPONSE_FORMAT).strip()

    if not voice_prompt:
        return jsonify({"error": "必须填写声音描述（voice_prompt）"}), 400
    if not preview_text:
        return jsonify({"error": "必须填写预览文本（preview_text）"}), 400

    voice_name, preview_audio = create_voice_design(
        api_key=api_key,
        voice_prompt=voice_prompt,
        preview_text=preview_text,
        preferred_name=preferred_name,
        language=language,
        target_model=target_model,
        sample_rate=sample_rate,
        response_format=response_format,
    )

    return jsonify(
        {
            "voice": voice_name,
            "preview_audio_base64": preview_audio,
            "preview_audio_format": response_format,
        }
    )


@app.post("/api/enroll-voice")
def api_enroll_voice():
    api_key = resolve_api_key(request.form.get("api_key"))
    if not api_key:
        return jsonify({"error": f"缺少 API Key，请设置 {API_KEY_ENV} 或在页面中填写 api_key。"}), 400

    file = request.files.get("audio")
    if file is None:
        return jsonify({"error": "必须上传音频文件"}), 400

    audio_bytes = file.read()
    audio_mime_type = (request.form.get("audio_mime_type") or file.mimetype or "audio/mpeg").strip()
    preferred_name = (request.form.get("preferred_name") or "").strip()
    target_model = (request.form.get("target_model") or DEFAULT_ENROLL_MODEL).strip()

    voice_name = create_voice_enrollment(
        api_key=api_key,
        audio_bytes=audio_bytes,
        audio_mime_type=audio_mime_type,
        preferred_name=preferred_name,
        target_model=target_model,
    )

    return jsonify({"voice": voice_name})


@app.post("/api/tts")
def api_tts():
    payload = request.get_json(force=True)
    api_key = resolve_api_key(payload.get("api_key"))
    if not api_key:
        return jsonify({"error": f"缺少 API Key，请设置 {API_KEY_ENV} 或在页面中填写 api_key。"}), 400

    voice = (payload.get("voice") or "").strip()
    text = (payload.get("text") or "").strip()
    model = (payload.get("model") or DEFAULT_DESIGN_MODEL).strip()
    sample_rate = int(payload.get("sample_rate") or DEFAULT_SAMPLE_RATE)
    output_format = (payload.get("format") or "wav").strip().lower()

    if not voice:
        return jsonify({"error": "必须填写音色名称（voice）"}), 400
    if not text:
        return jsonify({"error": "必须填写合成文本（text）"}), 400

    pcm_audio = synthesize_realtime(
        api_key=api_key,
        model=model,
        voice=voice,
        text=text,
        sample_rate=sample_rate,
    )

    if output_format == "pcm":
        audio_bytes = pcm_audio
        mime_type = "audio/pcm"
    else:
        audio_bytes = pcm_to_wav(pcm_audio, sample_rate)
        mime_type = "audio/wav"

    audio_base64 = base64.b64encode(audio_bytes).decode("ascii")

    return jsonify({"audio_base64": audio_base64, "mime_type": mime_type})


if __name__ == "__main__":
    server_url = "http://127.0.0.1:8000"

    if os.environ.get("QWEN_AUTO_OPEN", "1") != "0":
        threading.Timer(1.0, lambda: webbrowser.open(server_url)).start()

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=not getattr(sys, "frozen", False),
        use_reloader=False,
    )
