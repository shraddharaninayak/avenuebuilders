import subprocess
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
video_path = r"C:\Users\nshra\.gemini\antigravity-ide\brain\62620005-20aa-4ed0-8f2c-b50e0785315d\logo_intro_test_1792990944572.webp"
output_dir = os.path.join(base_dir, "scratch", "recording_frames")
os.makedirs(output_dir, exist_ok=True)

subprocess.run([
    "ffmpeg", "-y",
    "-i", video_path,
    "-vf", "fps=2",
    os.path.join(output_dir, "rec_%03d.jpg")
], capture_output=True, text=True)

frames = sorted(os.listdir(output_dir))
print(f"Extracted {len(frames)} frames from recording:")
print(frames[:10])
