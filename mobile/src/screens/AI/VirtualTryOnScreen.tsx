import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  CameraRoll,
  Linking,
  BackHandler,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useApi } from '../../hooks/useApi';
import { VirtualTryOnData, Product } from '../../types';
import { apiClient, endpoints } from '../../utils/api';
import { captureRef } from '../../services/poseDetectionService';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

interface VirtualTryOnScreenProps {
  // Navigation props are handled by TypeScript types from navigation
}

const VirtualTryOnScreen: React.FC<VirtualTryOnScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params as { productId?: string };

  const [hasPermission, setHasPermission] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [tryOnData, setTryOnData] = useState<VirtualTryOnData | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [product, setProduct] = useState<Product | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load product data
  const { data: productData } = useApi(
    () => productId ? apiClient.get(endpoints.PRODUCTS.DETAIL(productId)) : Promise.resolve(null),
    [productId],
    { immediate: !!productId }
  );

  useEffect(() => {
    if (productData) {
      setProduct(productData);
      // Set default size and color from first variant
      if (productData.variants.length > 0) {
        setSelectedSize(productData.variants[0].size);
        setSelectedColor(productData.variants[0].color);
      }
    }
  }, [productData]);

  // Check camera permissions
  useEffect(() => {
    checkCameraPermission();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (showResult) {
        setShowResult(false);
        return true;
      }
      if (isCameraActive) {
        setIsCameraActive(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [showResult, isCameraActive]);

  const checkCameraPermission = async () => {
    try {
      // In a real app, check actual permissions
      setHasPermission(true);
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      // Request camera permission
      setHasPermission(true);
    } catch (error) {
      console.error('Camera permission request error:', error);
      Alert.alert('Permission Required', 'Camera permission is required for virtual try-on');
    }
  };

  const switchCamera = useCallback(() => {
    setCameraType(prev => prev === 'back' ? 'front' : 'back');
  }, []);

  const startCamera = useCallback(async () => {
    if (!hasPermission) {
      await requestCameraPermission();
      return;
    }

    setIsCameraActive(true);
    setShowInstructions(false);
  }, [hasPermission]);

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo.base64) {
        setUserImage(`data:image/jpeg;base64,${photo.base64}`);
        await processVirtualTryOn(`data:image/jpeg;base64,${photo.base64}`);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to capture photo',
        position: 'bottom',
      });
    } finally {
      setIsProcessing(false);
      setIsCameraActive(false);
    }
  }, []);

  const processVirtualTryOn = async (imageData: string) => {
    try {
      setIsProcessing(true);

      // Detect pose landmarks
      const poseLandmarks = await captureRef(imageData);

      // Call AI service for virtual try-on
      const response = await apiClient.post(endpoints.AI.TRY_ON, {
        productId: product?.id,
        userImage: imageData,
        clothingImage: product?.images[0],
        poseLandmarks,
        size: selectedSize,
        color: selectedColor,
      });

      if (response.success) {
        setTryOnData(response.data);
        setResultImage(response.data.resultImage);
        setShowResult(true);
      } else {
        throw new Error(response.error || 'Virtual try-on failed');
      }
    } catch (error) {
      console.error('Virtual try-on error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to process virtual try-on',
        position: 'bottom',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [product, selectedSize, selectedColor]);

  const retakePhoto = useCallback(() => {
    setUserImage(null);
    setTryOnData(null);
    setResultImage(null);
    setShowResult(false);
    setIsCameraActive(true);
  }, []);

  const saveToGallery = useCallback(async () => {
    if (!resultImage) return;

    try {
      const permission = await CameraRoll.requestPermissionsAsync();
      if (permission.granted) {
        const asset = await CameraRoll.createAssetAsync('photo', resultImage);
        Alert.alert(
          'Saved to Gallery',
          'The virtual try-on result has been saved to your photo gallery',
          [
            { text: 'OK', onPress: () => {} },
            { text: 'View', onPress: () => Linking.openURL(asset.uri) },
          ]
        );
      }
    } catch (error) {
      console.error('Save to gallery error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save to gallery',
        position: 'bottom',
      });
    }
  }, [resultImage]);

  const shareResult = useCallback(async () => {
    if (!resultImage) return;

    try {
      const shareOptions = {
        url: resultImage,
        title: `Virtual Try-On: ${product?.name}`,
        message: `Check out how ${product?.name} looks on me!`,
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Share error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to share',
        position: 'bottom',
      });
    }
  }, [resultImage, product]);

  const addToCart = useCallback(async () => {
    if (!product) return;

    try {
      const selectedVariant = product.variants.find(
        variant => variant.size === selectedSize && variant.color === selectedColor
      );

      if (!selectedVariant) {
        Toast.show({
          type: 'error',
          text1: 'Selected variant not available',
          position: 'bottom',
        });
        return;
      }

      // Add to cart API call
      await apiClient.post(endpoints.CART.ADD, {
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: 1,
      });

      Toast.show({
        type: 'success',
        text1: 'Added to cart',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add to cart',
        position: 'bottom',
      });
    }
  }, [product, selectedSize, selectedColor]);

  const renderCameraView = () => {
    if (!hasPermission) {
      return (
        <View style={styles.permissionContainer}>
          <Icon name="camera-alt" size={80} color="#ccc" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to provide the virtual try-on experience
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestCameraPermission}
          >
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (showInstructions) {
      return (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Virtual Try-On Instructions</Text>
          <View style={styles.instructionItem}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Stand in a well-lit area facing forward
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Ensure your full body and face are visible
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Wear fitted clothing for best results
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Maintain a neutral expression and pose
            </Text>
          </View>
          <TouchableOpacity
            style={styles.startButton}
            onPress={startCamera}
          >
            <Text style={styles.startButtonText}>Start Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          ratio="16:9"
          captureAudio={false}
        />

        {/* Camera Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={switchCamera}
          >
            <Icon name="flip-camera-android" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isProcessing && styles.disabledButton]}
            onPress={capturePhoto}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Icon name="camera" size={30} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={stopCamera}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Product Info Overlay */}
        {product && (
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productVariant}>
              {selectedSize} • {selectedColor}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderResultView = () => {
    if (!userImage || !resultImage) return null;

    return (
      <Modal
        visible={showResult}
        animationType="fade"
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Virtual Try-On Result</Text>

          <View style={styles.resultImages}>
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Original</Text>
              <Image source={{ uri: userImage }} style={styles.resultImage} />
            </View>

            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Virtual Try-On</Text>
              <Image source={{ uri: resultImage }} style={styles.resultImage} />
            </View>
          </View>

          {tryOnData && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceText}>
                Confidence: {Math.round((tryOnData.confidence || 0) * 100)}%
              </Text>
              <Text style={styles.processingTime}>
                Processing time: {tryOnData.processingTime || 0}s
              </Text>
            </View>
          )}

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.resultButton}
              onPress={retakePhoto}
            >
              <Icon name="refresh" size={20} color="#E53935" />
              <Text style={styles.resultButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resultButton}
              onPress={saveToGallery}
            >
              <Icon name="download" size={20} color="#E53935" />
              <Text style={styles.resultButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resultButton}
              onPress={shareResult}
            >
              <Icon name="share" size={20} color="#E53935" />
              <Text style={styles.resultButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resultButton}
              onPress={addToCart}
            >
              <Icon name="shopping-cart" size={20} color="#E53935" />
              <Text style={styles.resultButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowResult(false)}
          >
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const renderSizeSelector = () => {
    if (!product) return null;

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const colors = ['Black', 'White', 'Navy', 'Red', 'Blue', 'Green'];

    return (
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowSizeGuide(!showSizeGuide)}
        >
          <Text style={styles.selectorButtonText}>Size Guide</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sizeOptions}>
            {sizes.map(size => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeOption,
                  selectedSize === size && styles.selectedOption
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[
                  styles.sizeText,
                  selectedSize === size && styles.selectedText
                ]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.colorOptions}>
            {colors.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  selectedColor === color && styles.selectedColorOption
                ]}
                onPress={() => setSelectedColor(color)}
              >
                <View style={[
                  styles.colorCircle,
                  { backgroundColor: color.toLowerCase() === 'black' ? '#000' : color.toLowerCase() === 'white' ? '#fff' : color.toLowerCase() }
                ]} />
                <Text style={styles.colorText}>{color}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isCameraActive ? renderSizeSelector() : null}
      {isCameraActive ? renderCameraView() : renderResultView()}
      {showResult && renderResultView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#E53935',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  productInfo: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  productVariant: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#E53935',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  instructionsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
    flex: 1,
  },
  startButton: {
    backgroundColor: '#E53935',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectorContainer: {
    backgroundColor: '#fff',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sizeOptions: {
    flexDirection: 'row',
    marginLeft: 20,
  },
  sizeOption: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  selectedOption: {
    backgroundColor: '#E53935',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
  colorOptions: {
    flexDirection: 'row',
    marginLeft: 20,
  },
  colorOption: {
    alignItems: 'center',
    marginRight: 15,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#E53935',
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 5,
  },
  colorText: {
    fontSize: 12,
    color: '#666',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultImages: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  resultImage: {
    width: 140,
    height: 200,
    borderRadius: 8,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  confidenceText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 5,
  },
  processingTime: {
    fontSize: 14,
    color: '#666',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  resultButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  resultButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginTop: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

export default VirtualTryOnScreen;