# JEPQ EP1 — README (render + replace voiceover)

## Render (Windows, Python + ffmpeg)
```
cd video/jepq
python render.py
```
Outputs: `jepq-ep1.mp4` (1080x1920, 30fps, H.264+AAC, ~85s), `subs.ass`,
`contact.jpg`, `thumb-jepq.jpg`. Verifies with ffprobe at the end.

## Voiceover status: MISSING (honest)
No Thai TTS available in this environment, so the video ships with:
- timed Thai subtitles (burned in, from `subtitles.srt`)
- synthesized ambient music bed (numpy pad, -20dBFS, not speech)

To add real voiceover later:
1. Record/read `SCRIPT_TH.md` (12 cues, ~85s) as wav `voice.wav`
2. `ffmpeg -i jepq-ep1.mp4 -i voice.wav -filter_complex "[0:v]subtitles=subs.ass:fontsdir='assets'[v]" -map "[v]" -map 1:a -c:v copy -c:a aac -b:a 160k -shortest jepq-ep1-vo.mp4`
3. Re-time SRT to actual speech if pacing differs.

## Files
- `SCRIPT_TH.md` narration+storyboard · `subtitles.srt` · `FACTCHECK.md`
- `render.py` frames(PIL, no Thai) + Thai text via libass + music bed
- `assets/tahoma*.ttf` fonts for subtitle burn-in
