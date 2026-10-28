import cv2
import sys

video_path = r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\assets\hero section change vedio.mp4"
cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("Cannot open video:", video_path)
    sys.exit(1)

fps = cap.get(cv2.CAP_PROP_FPS)
frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
duration = frames / fps if fps > 0 else 0

print(f"Video resolution: {w}x{h}, FPS: {fps}, Frames: {frames}, Duration: {duration:.2f}s")

ret, frame = cap.read()
if ret:
    cv2.imwrite(r"d:\INTERNSHIPS\SOCIAL MEDIA MANANGMENT[SKILLNEX]\WEBSITES\AvenueBuilders\scratch\hero_frame_0.jpg", frame)
    print("Saved first frame to scratch/hero_frame_0.jpg")
cap.release()
