import os
import subprocess

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
video_path = os.path.join(base_dir, "references", "avenue logo intro.mp4")
output_dir = os.path.join(base_dir, "scratch", "logo_detailed_frames")
os.makedirs(output_dir, exist_ok=True)

# Extract frames for the first 3.5 seconds at 10 fps
extract_cmd = [
    "ffmpeg",
    "-y",
    "-ss", "0",
    "-t", "3.5",
    "-i", video_path,
    "-vf", "fps=10",
    os.path.join(output_dir, "f_%03d.jpg")
]
subprocess.run(extract_cmd, capture_output=True, text=True)

frames = sorted(os.listdir(output_dir))
print("Extracted", len(frames), "detailed frames.")
