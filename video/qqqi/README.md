# QQQI EP1 — README (College Art film, 105s)

## Pipeline
```
cd video/qqqi
python render_qqqi.py   # frames + lo-fi music + burn subs -> qqqi-ep1.mp4 (temp audio)
python gen_qqqi_audio.py # Thai voiceover (edge-tts Premwadee) + mix under music -> mix.wav
ffmpeg -y -i qqqi-ep1.mp4 -i mix.wav -c:v copy -c:a aac -b:a 160k -shortest qqqi-ep1-vo.mp4
```
Then shrink if needed (`-crf 28`) and replace `qqqi-ep1.mp4`.

## Voiceover
Premwadee, 12 cues timed to `subtitles.srt` slots, atempo ≤1.15x on overflow.
Pronunciation: QQQI = "คิวคิวคิวไอ" (written in script).

## Files
- `SCRIPT_TH.md` narration+storyboard · `subtitles.srt` · `FACTCHECK.md`
- `render_qqqi.py` collage visuals (paper/tape/doodles) + Thai via libass
- `gen_qqqi_audio.py` voice + mix
