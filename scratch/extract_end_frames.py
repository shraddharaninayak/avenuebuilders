import subprocess
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
video_path = os.path.join(base_dir, "references", "avenue logo intro.mp4")
output_dir = os.path.join(base_dir, "scratch", "end_frames")
os.makedirs(output_dir, exist_ok=True)

subprocess.run([
    "ffmpeg", "-y",
    "-ss", "3.0",
    "-i", video_path,
    "-vf", "fps=4",
    os.path.join(output_dir, "end_%03d.jpg")
], capture_output=True, text=True)

print("Frames extracted:", sorted(os.listdir(output_dir)))
