import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple
import base64
from app.routers.virtual_try_on import PoseData, SizeRecommendation
from services.pose_detection import PoseDetectionService

class VirtualTryOnService:
    def __init__(self):
        """Initialize virtual try-on service"""
        self.pose_service = PoseDetectionService()

        # Size charts (simplified for demonstration)
        self.size_charts = {
            'men': {
                'shirt': {
                    (165, 60): 'S', (170, 65): 'M', (175, 70): 'L', (180, 75): 'XL', (185, 80): 'XXL'
                },
                'pants': {
                    (165, 60): '30', (170, 65): '32', (175, 70): '34', (180, 75): '36', (185, 80): '38'
                }
            },
            'women': {
                'shirt': {
                    (155, 50): 'XS', (160, 55): 'S', (165, 60): 'M', (170, 65): 'L', (175, 70): 'XL', (180, 75): 'XXL'
                },
                'pants': {
                    (155, 50): '26', (160, 55): '28', (165, 60): '30', (170, 65): '32', (175, 70): '34'
                }
            }
        }

    async def generate_overlay(self, pose_data: Dict, processed_clothing: Dict, size: str, color: str) -> Dict:
        """
        Generate virtual try-on overlay

        Args:
            pose_data: Detected pose landmarks
            processed_clothing: Processed clothing data
            size: Selected size
            color: Selected color

        Returns:
            Dictionary with overlay image and metadata
        """
        try:
            # Convert pose data to PoseData object
            pose_obj = PoseData(
                landmarks=[lm for lm in pose_data['landmarks']],
                bbox=pose_data['bbox']
            )

            # Get clothing keypoints
            clothing_keypoints = processed_clothing.get('keypoints', [])
            if not clothing_keypoints:
                raise Exception("No clothing keypoints found")

            # Get processed clothing image
            clothing_image_data = processed_clothing.get('processed_image')
            if not clothing_image_data:
                raise Exception("No processed clothing image found")

            # Decode base64 image
            clothing_bytes = base64.b64decode(clothing_image_data)
            clothing_nparr = np.frombuffer(clothing_bytes, np.uint8)
            clothing_image = cv2.imdecode(clothing_nparr, cv2.IMREAD_UNCHANGED)

            if clothing_image is None:
                raise Exception("Invalid clothing image data")

            # Create a background frame (user video frame would go here)
            # For demo, create a simple background
            frame_height, frame_width = 480, 640
            frame = np.ones((frame_height, frame_width, 3), dtype=np.uint8) * 255

            # Draw a simple human figure based on pose
            self._draw_pose_skeleton(frame, pose_obj)

            # Overlay clothing
            overlay_result = await self._overlay_clothing_on_pose(
                frame,
                clothing_image,
                pose_obj,
                clothing_keypoints,
                size
            )

            # Encode result
            _, buffer = cv2.imencode('.png', overlay_result)
            overlay_image = base64.b64encode(buffer).decode('utf-8')

            return {
                "overlay_image": overlay_image,
                "confidence": self._calculate_confidence(pose_obj, clothing_keypoints),
                "recommendations": self._generate_fit_recommendations(pose_obj, size)
            }

        except Exception as e:
            raise Exception(f"Overlay generation failed: {str(e)}")

    async def get_size_recommendations(self, height: float, weight: float, gender: str = "unspecified", brand: Optional[str] = None, category: Optional[str] = None) -> Dict:
        """
        Get size recommendations based on body measurements

        Args:
            height: Height in cm
            weight: Weight in kg
            gender: Gender category
            brand: Brand name
            category: Clothing category

        Returns:
            Size recommendations dictionary
        """
        try:
            # Default to men's chart if unspecified
            gender_key = gender.lower() if gender != "unspecified" else "men"
            if gender_key not in self.size_charts:
                gender_key = "men"

            # Default to shirt category
            category_key = category.lower() if category else "shirt"
            if category_key not in self.size_charts[gender_key]:
                category_key = "shirt"

            size_chart = self.size_charts[gender_key][category_key]

            # Find best matching size
            best_size = self._find_best_size(height, weight, size_chart)

            # Generate alternatives
            alternatives = self._generate_alternative_sizes(height, weight, size_chart, best_size)

            return {
                "recommended_size": best_size,
                "alternatives": alternatives,
                "measurements": self._estimate_measurements(height, weight, gender_key)
            }

        except Exception as e:
            raise Exception(f"Size recommendation failed: {str(e)}")

    async def analyze_fit(self, user_image: str, product_image: str, size: str) -> Dict:
        """
        Analyze clothing fit

        Args:
            user_image: Base64 user image
            product_image: Base64 product image
            size: Product size

        Returns:
            Fit analysis results
        """
        try:
            # Decode user image and detect pose
            user_bytes = base64.b64decode(user_image)
            user_nparr = np.frombuffer(user_bytes, np.uint8)
            user_image = cv2.imdecode(user_nparr, cv2.IMREAD_COLOR)

            if user_image is None:
                raise Exception("Invalid user image data")

            pose_data = await self.pose_service.detect_pose(user_image)

            # Analyze measurements
            measurements = self.pose_service.extract_body_measurements(pose_data)

            # Fit analysis based on measurements and size
            fit_score = self._calculate_fit_score(measurements, size)
            fit_type = self._determine_fit_type(fit_score)

            # Generate recommendations
            recommendations = self._generate_fit_recommendations(measurements, fit_type)

            return {
                "fitScore": fit_score,
                "fitType": fit_type,
                "recommendations": recommendations,
                "measurements": {
                    "chestFit": measurements.get('chest', 0),
                    "waistFit": measurements.get('hip_width', 0),
                    "lengthFit": measurements.get('arm_length', 0)
                }
            }

        except Exception as e:
            raise Exception(f"Fit analysis failed: {str(e)}")

    def _draw_pose_skeleton(self, frame: np.ndarray, pose_data: PoseData) -> None:
        """Draw simple pose skeleton on frame"""
        if not pose_data.landmarks:
            return

        # Define connections for simple skeleton
        connections = [
            (11, 12),  # Shoulders
            (11, 13),  # Left arm
            (13, 15),  # Left forearm
            (12, 14),  # Right arm
            (14, 16),  # Right forearm
            (11, 23),  # Left torso
            (12, 24),  # Right torso
            (23, 25),  # Left leg
            (25, 27),  # Left shin
            (24, 26),  # Right leg
            (26, 28),  # Right shin
        ]

        # Draw connections
        for start_idx, end_idx in connections:
            if (start_idx < len(pose_data.landmarks) and end_idx < len(pose_data.landmarks)):
                start = pose_data.landmarks[start_idx]
                end = pose_data.landmarks[end_idx]

                # Scale coordinates to frame size
                start_x = int(start.x * frame.shape[1])
                start_y = int(start.y * frame.shape[0])
                end_x = int(end.x * frame.shape[1])
                end_y = int(end.y * frame.shape[0])

                cv2.line(frame, (start_x, start_y), (end_x, end_y), (0, 255, 0), 2)

        # Draw landmarks
        for landmark in pose_data.landmarks:
            x = int(landmark.x * frame.shape[1])
            y = int(landmark.y * frame.shape[0])
            cv2.circle(frame, (x, y), 3, (0, 0, 255), -1)

    async def _overlay_clothing_on_pose(self, frame: np.ndarray, clothing_image: np.ndarray, pose_data: PoseData, keypoints: List, size: str) -> np.ndarray:
        """Overlay clothing on pose"""
        try:
            # Get keypoints from pose service for clothing placement
            clothing_type = self._determine_clothing_type(keypoints)
            pose_keypoints = self.pose_service.get_clothing_keypoints(pose_data, clothing_type)

            if not pose_keypoints:
                return frame

            # Resize clothing based on size
            scale_factor = self._get_size_scale_factor(size)
            clothing_resized = self._resize_clothing(clothing_image, pose_keypoints, scale_factor)

            # Apply perspective transformation and overlay
            overlay = self._apply_perspective_overlay(
                frame,
                clothing_resized,
                pose_keypoints,
                keypoints
            )

            return overlay

        except Exception as e:
            print(f"Overlay error: {e}")
            return frame

    def _determine_clothing_type(self, keypoints: List) -> str:
        """Determine clothing type from keypoints"""
        if not keypoints:
            return "shirt"  # Default

        keypoint_types = [kp.type for kp in keypoints]

        if "shoulders" in keypoint_types and "hips" in keypoint_types:
            return "shirt"
        elif "waist" in keypoint_types and "hips" in keypoint_types:
            return "pants"
        elif "center" in keypoint_types and "collar" in keypoint_types:
            return "dress"
        else:
            return "shirt"  # Default

    def _get_size_scale_factor(self, size: str) -> float:
        """Get scale factor for clothing size"""
        size_scales = {
            'XS': 0.8, 'S': 0.9, 'M': 1.0,
            'L': 1.1, 'XL': 1.2, 'XXL': 1.3,
            '26': 0.8, '28': 0.9, '30': 1.0,
            '32': 1.1, '34': 1.2, '36': 1.3
        }
        return size_scales.get(size, 1.0)

    def _resize_clothing(self, clothing_image: np.ndarray, keypoints: Dict, scale_factor: float) -> np.ndarray:
        """Resize clothing based on body measurements"""
        try:
            if "shoulders" in keypoints and "hips" in keypoints:
                shoulder_width = abs(keypoints["shoulders"][1][0] - keypoints["shoulders"][0][0])
                target_width = int(shoulder_width * scale_factor)

                height, width = clothing_image.shape[:2]
                aspect_ratio = width / height

                new_height = int(target_width / aspect_ratio)
                new_width = target_width

                return cv2.resize(clothing_image, (new_width, new_height))
            else:
                return clothing_image

        except Exception:
            return clothing_image

    def _apply_perspective_overlay(self, frame: np.ndarray, clothing: np.ndarray, pose_keypoints: Dict, clothing_keypoints: List) -> np.ndarray:
        """Apply clothing overlay with perspective transformation"""
        try:
            # For simplicity, use basic overlay with keypoint alignment
            if "shoulders" in pose_keypoints and "center" in pose_keypoints:
                # Position clothing based on shoulders
                shoulder_left = pose_keypoints["shoulders"][0]
                shoulder_right = pose_keypoints["shoulders"][1]
                chest_center = pose_keypoints.get("center", [(shoulder_left[0] + shoulder_right[0]) / 2, (shoulder_left[1] + shoulder_right[1]) / 2])

                # Calculate transformation
                clothing_height, clothing_width = clothing.shape[:2]

                # Position clothing at chest area
                x_pos = int(chest_center[0] - clothing_width // 2)
                y_pos = int(chest_center[1] - clothing_height // 4)

                # Ensure within frame bounds
                x_pos = max(0, min(x_pos, frame.shape[1] - clothing_width))
                y_pos = max(0, min(y_pos, frame.shape[0] - clothing_height))

                # Create ROI for blending
                roi = frame[y_pos:y_pos + clothing_height, x_pos:x_pos + clothing_width]
                if roi.shape[:2] == clothing.shape[:2]:
                    # Blend clothing with frame
                    alpha = 0.8  # Clothing opacity
                    beta = 1.0 - alpha
                    blended = cv2.addWeighted(clothing, alpha, roi, beta)
                    frame[y_pos:y_pos + clothing_height, x_pos:x_pos + clothing_width] = blended

            return frame

        except Exception as e:
            print(f"Perspective overlay error: {e}")
            return frame

    def _calculate_confidence(self, pose_data: PoseData, keypoints: List) -> float:
        """Calculate confidence score for try-on"""
        try:
            # Base confidence from pose detection
            visible_landmarks = [lm for lm in pose_data.landmarks if lm.visibility and lm.visibility > 0.5]
            pose_confidence = len(visible_landmarks) / len(pose_data.landmarks) if pose_data.landmarks else 0

            # Keypoint detection confidence
            keypoint_confidence = min(len(keypoints) / 3, 1.0)  # Expect at least 3 keypoints

            # Overall confidence
            overall_confidence = (pose_confidence * 0.6) + (keypoint_confidence * 0.4)

            return min(overall_confidence, 1.0)

        except Exception:
            return 0.5  # Default confidence

    def _generate_fit_recommendations(self, pose_data: PoseData, size: str) -> List[str]:
        """Generate fit recommendations based on pose data"""
        recommendations = []

        try:
            measurements = self.pose_service.extract_body_measurements(pose_data)

            # Simple fit analysis
            if "chest" in measurements and "shoulder_width" in measurements:
                chest_width = measurements["chest"]
                expected_chest = {"S": 90, "M": 96, "L": 102, "XL": 110, "XXL": 118}.get(size, 96)

                if chest_width < expected_chest * 0.9:
                    recommendations.append("Consider trying a smaller size for better fit")
                elif chest_width > expected_chest * 1.1:
                    recommendations.append("Consider trying a larger size for better fit")
                else:
                    recommendations.append("Good fit! This size appears suitable for your measurements")

        except Exception:
            recommendations.append("Unable to determine fit recommendations")

        return recommendations

    def _find_best_size(self, height: float, weight: float, size_chart: Dict) -> str:
        """Find best matching size from chart"""
        best_match = "M"  # Default
        min_difference = float('inf')

        for (h, w), size in size_chart.items():
            height_diff = abs(height - h)
            weight_diff = abs(weight - w)
            total_diff = height_diff + weight_diff

            if total_diff < min_difference:
                min_difference = total_diff
                best_match = size

        return best_match

    def _generate_alternative_sizes(self, height: float, weight: float, size_chart: Dict, best_size: str) -> List[SizeRecommendation]:
        """Generate alternative size recommendations"""
        alternatives = []
        sizes = list(size_chart.values())

        # Find index of best size
        try:
            best_index = sizes.index(best_size)

            # Get nearby sizes
            for i in range(max(0, best_index - 1), min(len(sizes), best_index + 2)):
                if i < len(sizes):
                    h, w = list(size_chart.keys())[i]
                    height_diff = abs(height - h)
                    weight_diff = abs(weight - w)
                    confidence = max(0, 1 - (height_diff + weight_diff) / 200)

                    alternatives.append(SizeRecommendation(
                        size=sizes[i],
                        fit="regular" if abs(i - best_index) <= 1 else "loose" if i > best_index else "tight",
                        confidence=confidence
                    ))
        except ValueError:
            pass  # Best size not in chart

        return alternatives[:3]  # Return top 3 alternatives

    def _estimate_measurements(self, height: float, weight: float, gender: str) -> Dict:
        """Estimate body measurements from height and weight"""
        # Simple estimation based on averages
        return {
            "chest": weight * 1.2,
            "waist": weight * 0.85,
            "hips": weight * 0.95,
            "height": height
        }

    def _calculate_fit_score(self, measurements: Dict, size: str) -> float:
        """Calculate fit score based on measurements and size"""
        # Simplified fit scoring
        base_measurements = {
            "S": {"chest": 86, "waist": 70, "hips": 90},
            "M": {"chest": 94, "waist": 76, "hips": 98},
            "L": {"chest": 102, "waist": 82, "hips": 106},
            "XL": {"chest": 110, "waist": 88, "hips": 114},
            "XXL": {"chest": 118, "waist": 94, "hips": 122}
        }

        expected = base_measurements.get(size, base_measurements["M"])
        actual_measurements = {
            "chest": measurements.get("chest", 0),
            "waist": measurements.get("waist", 0),
            "hips": measurements.get("hip_width", 0)
        }

        # Calculate fit score
        score = 0
        for measurement, actual_val in actual_measurements.items():
            expected_val = expected.get(measurement, 0)
            if expected_val > 0:
                diff_ratio = abs(actual_val - expected_val) / expected_val
                score += max(0, 1 - diff_ratio) * 0.33

        return min(score, 1.0)

    def _determine_fit_type(self, score: float) -> str:
        """Determine fit type from score"""
        if score >= 0.8:
            return "regular"
        elif score >= 0.6:
            return "loose"
        else:
            return "tight"