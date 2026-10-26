import cv2
import numpy as np
import os

base_dir = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders"
video_path = os.path.join(base_dir, "references", "avenue logo intro.mp4")

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps

print(f"FPS: {fps}, Total Frames: {total_frames}, Duration: {duration:.2f}s")

# Let's inspect average color or center pixel changes over time
frame_idx = 0
changes = []
while True:
    ret, frame = cap.read()
    if not ret:
        break
    t = frame_idx / fps
    # sample center region
    h, w, _ = frame.shape
    center_roi = frame[h//3:2*h//3, w//3:2*w//3]
    mean_val = center_roi.mean(axis=(0,1)) # BGR
    # sample top left (where browser header was) or background area (e.g. at 100, 100)
    bg_roi = frame[200:300, 100:200]
    bg_mean = bg_roi.mean(axis=(0,1))
    
    if frame_idx % 5 == 0:
        changes.append((round(t, 2), frame_idx, [round(x, 1) for x in bg_mean], [round(x, 1) for x in mean_val]))
    frame_idx += 1

cap.release()

print("Sampled timeline (t, frame_idx, bg_bgr, center_bgr):")
for item in changes[:40]:
    print(item)
print("...")
for item in changes[40:70]:
    print(item)
