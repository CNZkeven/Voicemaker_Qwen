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





## ⚠️ Important Warnings and Usage Notice ⚠️

This project (Voicemaker, powered by Qwen) is intended strictly for educational, research, and technical exchange purposes. By using it, you agree to comply with the following terms:

## Compliance with Local Laws

Ensure your use of this application complies with all applicable laws and regulations in your jurisdiction. Text-to-speech (TTS) and voice cloning technologies may involve sensitive legal areas, including privacy rights, biometric data (e.g., voiceprints), and intellectual property. Do not generate, imitate, or impersonate the voice of any individual without their explicit consent.

## API Key Security

Your DASHSCOPE_API_KEY is a sensitive credential. Never expose it publicly, share it, or commit it to version control. It is strongly recommended to set it via environment variables (e.g., using setx on Windows or .env files) rather than hardcoding it in source files.

## No Commercial Use Without Authorization

This project does not grant any commercial license. Any use of the application or its generated audio for commercial purposes (e.g., advertising, customer service bots, monetized audiobooks, etc.) is strictly prohibited unless you have obtained proper legal permissions from all relevant rights holders and service providers (e.g., Tongyi Lab / DashScope).

## Technical Limitations

The real-time TTS output is wrapped in WAV format (from PCM) for browser playback compatibility. Audio quality, naturalness, and language support depend on the backend model (see default settings in app.py) and do not represent a production-grade service.

## Disclaimer of Liability

The developers assume no responsibility for any legal disputes, privacy violations, reputational harm, or other consequences arising from misuse of this software. Your use constitutes acceptance of these terms.

✅ Recommendation: Only run this application in controlled experimental environments or scenarios where you have obtained clear authorization. Always respect individuals’ voice rights and promote the ethical use of AI.

## — For learning and non-commercial exchange only. Unauthorized, illegal, or unethical use is strictly prohibited. —


