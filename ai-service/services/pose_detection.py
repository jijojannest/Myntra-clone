import cv2
import numpy as np
import mediapipe as mp
from typing import List, Optional, Tuple
from dataclasses import dataclass
from app.routers.pose import Landmark, BoundingBox, PoseData

@dataclass
class PoseDetectionResult:
    landmarks: List[Landmark]
    bbox: BoundingBox

class PoseDetectionService:
    def __init__(self):
        """Initialize MediaPipe pose detection"""
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils

    async def detect_pose(self, image: np.ndarray) -> PoseData:
        """
        Detect pose in the given image

        Args:
            image: OpenCV image in BGR format

        Returns:
            PoseData with landmarks and bounding box
        """
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Process the image and detect pose
            results = self.pose.process(rgb_image)

            if results.pose_landmarks is None:
                # No pose detected
                return PoseData(
                    landmarks=[],
                    bbox=BoundingBox(x=0, y=0, width=0, height=0)
                )

            # Extract landmarks
            landmarks = []
            for landmark in results.pose_landmarks.landmark:
                landmarks.append(Landmark(
                    x=landmark.x,
                    y=landmark.y,
                    z=landmark.z if landmark.z else 0.0,
                    visibility=landmark.visibility if landmark.visibility else 0.0
                ))

            # Calculate bounding box from landmarks
            h, w, _ = image.shape

            # Get all visible landmark coordinates
            visible_landmarks = [
                (lm.x * w, lm.y * h)
                for lm in results.pose_landmarks.landmark
                if lm.visibility and lm.visibility > 0.5
            ]

            if visible_landmarks:
                x_coords = [pt[0] for pt in visible_landmarks]
                y_coords = [pt[1] for pt in visible_landmarks]

                min_x = max(0, min(x_coords) - 20)
                min_y = max(0, min(y_coords) - 20)
                max_x = min(w, max(x_coords) + 20)
                max_y = min(h, max(y_coords) + 20)

                bbox = BoundingBox(
                    x=min_x,
                    y=min_y,
                    width=max_x - min_x,
                    height=max_y - min_y
                )
            else:
                bbox = BoundingBox(x=0, y=0, width=w, height=h)

            return PoseData(
                landmarks=landmarks,
                bbox=bbox
            )

        except Exception as e:
            raise Exception(f"Pose detection failed: {str(e)}")

    def extract_body_measurements(self, pose_data: PoseData) -> dict:
        """
        Extract body measurements from pose landmarks

        Args:
            pose_data: Detected pose data

        Returns:
            Dictionary with body measurements
        """
        if not pose_data.landmarks:
            return {}

        # MediaPipe landmark indices
        landmarks = {i: lm for i, lm in enumerate(pose_data.landmarks)}

        measurements = {}

        try:
            # Shoulder width
            if 11 in landmarks and 12 in landmarks:
                shoulder_width = abs(landmarks[11].x - landmarks[12].x)
                measurements['shoulder_width'] = shoulder_width

            # Chest width (using shoulders)
            if 11 in landmarks and 12 in landmarks:
                chest_width = abs(landmarks[11].x - landmarks[12].x)
                measurements['chest'] = chest_width

            # Hip width
            if 23 in landmarks and 24 in landmarks:
                hip_width = abs(landmarks[23].x - landmarks[24].x)
                measurements['hip_width'] = hip_width

            # Arm length (shoulder to elbow)
            if 11 in landmarks and 13 in landmarks:
                arm_length = abs(landmarks[11].y - landmarks[13].y)
                measurements['arm_length'] = arm_length

            # Leg length (hip to knee)
            if 23 in landmarks and 25 in landmarks:
                leg_length = abs(landmarks[23].y - landmarks[25].y)
                measurements['leg_length'] = leg_length

            # Body height
            visible_ys = [lm.y for lm in pose_data.landmarks if lm.visibility and lm.visibility > 0.5]
            if visible_ys:
                height = max(visible_ys) - min(visible_ys)
                measurements['height'] = height

        except Exception as e:
            print(f"Error extracting measurements: {e}")

        return measurements

    def get_clothing_keypoints(self, pose_data: PoseData, clothing_type: str) -> dict:
        """
        Get key points for clothing placement based on pose

        Args:
            pose_data: Detected pose data
            clothing_type: Type of clothing ('shirt', 'pants', 'dress', etc.)

        Returns:
            Dictionary with key points for clothing overlay
        """
        if not pose_data.landmarks:
            return {}

        landmarks = {i: lm for i, lm in enumerate(pose_data.landmarks)}
        keypoints = {}

        try:
            if clothing_type in ['shirt', 'tshirt', 'top']:
                # For shirts: use shoulders and torso points
                if 11 in landmarks and 12 in landmarks:  # Shoulders
                    keypoints['shoulders'] = [
                        (landmarks[11].x, landmarks[11].y),
                        (landmarks[12].x, landmarks[12].y)
                    ]

                if 23 in landmarks and 24 in landmarks:  # Hips
                    keypoints['hips'] = [
                        (landmarks[23].x, landmarks[23].y),
                        (landmarks[24].x, landmarks[24].y)
                    ]

                if 0 in landmarks:  # Nose/center chest
                    keypoints['chest_center'] = (landmarks[0].x, landmarks[0].y)

            elif clothing_type in ['pants', 'trousers', 'jeans']:
                # For pants: use waist and hips
                if 23 in landmarks and 24 in landmarks:  # Hips
                    keypoints['hips'] = [
                        (landmarks[23].x, landmarks[23].y),
                        (landmarks[24].x, landmarks[24].y)
                    ]

                if 11 in landmarks and 12 in landmarks:  # Shoulders for waist calculation
                    waist_y = (landmarks[11].y + landmarks[12].y) / 2
                    keypoints['waist'] = [
                        (landmarks[11].x, waist_y),
                        (landmarks[12].x, waist_y)
                    ]

        except Exception as e:
            print(f"Error getting keypoints: {e}")

        return keypoints