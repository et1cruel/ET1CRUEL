"""Pronunciation audit: whisper transcript vs script per cue (0-1 match)."""
import difflib
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
t = json.load(open(os.path.join(HERE, "timing.json"), encoding="utf-8"))
w = {x["i"]: "".join(z["w"] for z in x["words"])
     for x in json.load(open(os.path.join(HERE, "words.json"), encoding="utf-8"))}
for c in t["cues"]:
    a = c["text"].replace(" ", "")
    b = w.get(c["i"], "").replace(" ", "")
    r = difflib.SequenceMatcher(None, a, b).ratio()
    print(f"cue{c['i']} match={r:.2f} whisper={b[:45]}")
