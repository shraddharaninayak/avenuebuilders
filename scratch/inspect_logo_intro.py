import os
import subprocess
import json

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
video_path = os.path.join(base_dir, "references", "avenue logo intro.mp4")

print("Checking video exists:", os.path.exists(video_path))
print("File size:", os.path.getsize(video_path) if os.path.exists(video_path) else 0)

# Probe video metadata
cmd = [
    "ffprobe",
    "-v", "error",
    "-show_entries", "format=duration,size,bit_rate",
    "-show_entries", "stream=width,height,r_frame_rate,duration,nb_frames,codec_name",
    "-of", "json",
    video_path
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("FFPROBE STDOUT:\n", res.stdout)
if res.stderr:
    print("FFPROBE STDERR:\n", res.stderr)

# Extract frames every 0.5 seconds or 1 second to inspect visually
output_dir = os.path.join(base_dir, "scratch", "logo_intro_frames")
os.makedirs(output_dir, exist_ok=True)

extract_cmd = [
    "ffmpeg",
    "-y",
    "-i", video_path,
    "-vf", "fps=2",
    os.path.join(output_dir, "frame_%03d.jpg")
]
subprocess.run(extract_cmd, capture_output=True, text=True)

extracted = sorted(os.listdir(output_dir))
print("Extracted frames:", len(extracted), extracted[:10], "...", extracted[-5:] if len(extracted) > 5 else "")
