# JEPQ EP1 — README (render + replace voiceover)

## Render (Windows, Python + ffmpeg)
```
cd video/jepq
python render.py
```
Outputs: `jepq-ep1.mp4` (1080x1920, 30fps, H.264+AAC, ~85s), `subs.ass`,
`contact.jpg`, `thumb-jepq.jpg`. Verifies with ffprobe at the end.

## Voiceover status: DONE (v2)
Thai voiceover by edge-tts `th-TH-PremwadeeNeural`, timed to `subtitles.srt`
slots via `gen_audio.py` (clips auto-fitted with atempo ≤1.15x if needed).
Music bed replaced with soothing Am–F–C–G warm pad (~-21dBFS) under voice.

Regenerate audio only:
```
cd video/jepq
python gen_audio.py   # -> mix.wav
ffmpeg -y -i jepq-ep1.mp4 -i mix.wav -c:v copy -c:a aac -b:a 160k -shortest jepq-ep1-vo.mp4
```

## Files
- `SCRIPT_TH.md` narration+storyboard · `subtitles.srt` · `FACTCHECK.md`
- `render.py` frames(PIL, no Thai) + Thai text via libass + music bed
- `assets/tahoma*.ttf` fonts for subtitle burn-in
