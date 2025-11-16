import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
import base64
from app.routers.clothing import KeyPoint
from sklearn.cluster import KMeans

class ClothingProcessingService:
    def __init__(self):
        """Initialize clothing processing service"""
        self.background_subtractor = cv2.createBackgroundSubtractorMOG2(
            detectShadows=True,
            history=500,
            varThreshold=50,
            learningRate=0.01
        )

    async def process_clothing_image(self, image: np.ndarray, remove_background: bool = True, extract_clothing: bool = True) -> Dict:
        """
        Process clothing image for virtual try-on

        Args:
            image: OpenCV image in BGR format
            remove_background: Whether to remove background
            extract_clothing: Whether to extract clothing keypoints

        Returns:
            Dictionary with processed data
        """
        try:
            # Initialize result dictionary
            result = {
                "processed_image": None,
                "mask": None,
                "keypoints": []
            }

            # Convert to different color spaces
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)

            # Background removal
            if remove_background:
                mask = self._remove_background(image, hsv, gray)
                result["mask"] = self._encode_image(mask)
                processed_image = cv2.bitwise_and(image, image, mask=mask)
            else:
                processed_image = image.copy()
                mask = np.ones(image.shape[:2], dtype=np.uint8) * 255
                result["mask"] = self._encode_image(mask)

            # Clothing extraction and keypoints
            if extract_clothing:
                keypoints = self._extract_clothing_keypoints(processed_image, gray)
                result["keypoints"] = keypoints

            # Enhance processed image
            enhanced_image = self._enhance_clothing_image(processed_image)
            result["processed_image"] = self._encode_image(enhanced_image)

            return result

        except Exception as e:
            raise Exception(f"Clothing processing failed: {str(e)}")

    def _remove_background(self, image: np.ndarray, hsv: np.ndarray, gray: np.ndarray) -> np.ndarray:
        """
        Remove background from clothing image

        Args:
            image: Original image
            hsv: HSV version of image
            gray: Grayscale version of image

        Returns:
            Background mask
        """
        # Method 1: Color-based segmentation
        # Define clothing color ranges
        lower_clothing = np.array([0, 20, 50])  # Lower HSV range for clothing
        upper_clothing = np.array([180, 255, 255])  # Upper HSV range for clothing

        # Create mask for clothing colors
        color_mask = cv2.inRange(hsv, lower_clothing, upper_clothing)

        # Method 2: Edge detection combined with color segmentation
        edges = cv2.Canny(gray, 50, 150)
        dilated_edges = cv2.dilate(edges, None, iterations=2)

        # Combine color and edge masks
        combined_mask = cv2.bitwise_or(color_mask, dilated_edges)

        # Morphological operations to clean up mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        # Find contours and keep largest ones
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if contours:
            # Create mask from largest contours
            mask = np.zeros(image.shape[:2], dtype=np.uint8)

            # Filter contours by area
            min_area = image.shape[0] * image.shape[1] * 0.01  # 1% of image area
            valid_contours = [c for c in contours if cv2.contourArea(c) > min_area]

            # Sort by area and take top 5
            valid_contours.sort(key=cv2.contourArea, reverse=True)

            for contour in valid_contours[:5]:
                cv2.drawContours(mask, [contour], -1, 255, thickness=cv2.FILLED)

        return mask

    def _extract_clothing_keypoints(self, image: np.ndarray, gray: np.ndarray) -> List[KeyPoint]:
        """
        Extract keypoints from clothing image

        Args:
            image: Processed clothing image
            gray: Grayscale version

        Returns:
            List of keypoints
        """
        keypoints = []

        try:
            # Find corners and edges of clothing
            edges = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if contours:
                # Sort contours by area
                contours.sort(key=cv2.contourArea, reverse=True)

                # Extract key points from largest contours
                for i, contour in enumerate(contours[:3]):  # Top 3 largest contours
                    if cv2.contourArea(contour) > 1000:  # Minimum area threshold
                        # Get bounding rectangle
                        x, y, w, h = cv2.boundingRect(contour)

                        # Add keypoints for different parts of clothing
                        if i == 0:  # Main clothing item
                            keypoints.append(KeyPoint(x=x + w//2, y=y + h//2, type="center"))
                            keypoints.append(KeyPoint(x=x, y=y + h//2, type="top_left"))
                            keypoints.append(KeyPoint(x=x + w, y=y + h//2, type="top_right"))
                            keypoints.append(KeyPoint(x=x + w//2, y=y + h, type="bottom_center"))

                        # Shoulder points for tops
                        if h > w:  # Likely a top
                            keypoints.append(KeyPoint(x=x + w*0.3, y=y, type="left_shoulder"))
                            keypoints.append(KeyPoint(x=x + w*0.7, y=y, type="right_shoulder"))

                        # Collar points
                        if i == 0:  # Main item
                            keypoints.append(KeyPoint(x=x + w//2, y=y + h*0.1, type="collar"))

        except Exception as e:
            print(f"Error extracting keypoints: {e}")

        return keypoints

    def _enhance_clothing_image(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance clothing image for better processing

        Args:
            image: Input image

        Returns:
            Enhanced image
        """
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Apply CLAHE to L-channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)

        # Merge channels back
        enhanced_lab = cv2.merge((l, a, b))
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # Apply sharpening
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]])
        enhanced = cv2.filter2D(enhanced, -1, kernel)

        # Remove noise while preserving edges
        enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)

        return enhanced

    def _encode_image(self, image: np.ndarray) -> str:
        """
        Encode image to base64 string

        Args:
            image: OpenCV image

        Returns:
            Base64 encoded string
        """
        _, buffer = cv2.imencode('.png', image)
        return base64.b64encode(buffer).decode('utf-8')

    def create_clothing_mask_advanced(self, image: np.ndarray) -> np.ndarray:
        """
        Advanced clothing segmentation using multiple techniques

        Args:
            image: Input image

        Returns:
            Refined clothing mask
        """
        # Convert to different color spaces
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Initialize mask
        mask = np.zeros(image.shape[:2], dtype=np.uint8)

        # Method 1: Saturation-based segmentation
        saturation = hsv[:, :, 1]
        sat_mask = cv2.threshold(saturation, 30, 255, cv2.THRESH_BINARY)[1]

        # Method 2: L-channel based segmentation
        l_channel = lab[:, :, 0]
        l_mask = cv2.threshold(l_channel, 128, 255, cv2.THRESH_BINARY_INV)[1]

        # Method 3: Texture-based segmentation
        # Use Local Binary Patterns for texture analysis
        lbp = self._compute_lbp(gray)
        lbp_mask = cv2.threshold(lbp, 50, 255, cv2.THRESH_BINARY)[1]

        # Combine masks
        combined = cv2.bitwise_and(sat_mask, l_mask)
        combined = cv2.bitwise_and(combined, lbp_mask)

        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
        combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel)

        # Find and filter contours
        contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if contours:
            # Filter by aspect ratio and area
            image_area = image.shape[0] * image.shape[1]
            valid_contours = []

            for contour in contours:
                area = cv2.contourArea(contour)
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = float(w) / h

                # Filter criteria
                if (area > image_area * 0.01 and  # At least 1% of image area
                    0.2 < aspect_ratio < 5.0):     # Reasonable aspect ratio
                    valid_contours.append(contour)

            # Create final mask from valid contours
            for contour in valid_contours:
                cv2.drawContours(mask, [contour], -1, 255, thickness=cv2.FILLED)

        return mask

    def _compute_lbp(self, image: np.ndarray, radius: int = 1, neighbors: int = 8) -> np.ndarray:
        """
        Compute Local Binary Pattern (LBP) for texture analysis

        Args:
            image: Grayscale image
            radius: Radius for LBP computation
            neighbors: Number of neighbors for LBP

        Returns:
            LBP image
        """
        lbp = np.zeros_like(image)
        height, width = image.shape

        for i in range(radius, height - radius):
            for j in range(radius, width - radius):
                center = image[i, j]
                binary_string = ""

                for n in range(neighbors):
                    # Calculate neighbor position
                    angle = 2 * np.pi * n / neighbors
                    x = int(i + radius * np.cos(angle))
                    y = int(j - radius * np.sin(angle))

                    # Boundary check
                    if 0 <= x < height and 0 <= y < width:
                        neighbor = image[x, y]
                    else:
                        neighbor = center

                    # Compare with center
                    if neighbor >= center:
                        binary_string += "1"
                    else:
                        binary_string += "0"

                # Convert binary string to decimal
                lbp[i, j] = int(binary_string, 2)

        return lbp