# Voicemaker（Powered by Qwen）

A small full-stack Python app for creating a custom voice (design or enrollment) and running realtime TTS. The frontend is iOS-inspired with gradients and scale animations.

## Setup

1. Create a virtual environment (optional).
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set your API key (recommended):

```bash
setx DASHSCOPE_API_KEY "your-key"
```

4. Run the app:

```bash
python app.py
```

Open `http://localhost:8000`.

## Notes

- You can also paste the API key in the UI (useful for quick testing).
- Default models and sample rate are in `app.py`.
- The app wraps realtime PCM output into WAV for browser playback.

