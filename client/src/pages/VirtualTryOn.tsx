import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiCamera, FiCameraOff, FiDownload, FiShoppingCart, FiX, FiChevronLeft } from 'react-icons/fi';
import { RootState } from '../store';
import { addToast } from '../store/slices/uiSlice';
import { aiAPI } from '../services/api';

const VirtualTryOn: React.FC = () => {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { product } = useSelector((state: RootState) => state.products);
  const { user } = useSelector((state: RootState) => state.auth);

  const [isVideoActive, setIsVideoActive] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsVideoActive(true);
        dispatch(addToast({
          type: 'success',
          message: 'Camera started successfully'
        }));
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to access camera. Please check permissions.'
      }));
    }
  }, [dispatch]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoActive(false);
  }, []);

  // Capture photo from video
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !product) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Send to AI service for processing
    processVirtualTryOn(imageData);
  }, [product]);

  // Process virtual try-on
  const processVirtualTryOn = useCallback(async (imageData: string) => {
    if (!selectedSize || !selectedColor) {
      dispatch(addToast({
        type: 'warning',
        message: 'Please select size and color first'
      }));
      return;
    }

    setIsProcessing(true);

    try {
      // First, detect pose
      const poseResponse = await aiAPI.detectPose({
        image_data: imageData
      });

      if (!poseResponse.success || !poseResponse.data) {
        throw new Error('Failed to detect pose');
      }

      // Generate virtual try-on overlay
      const tryOnResponse = await aiAPI.generateVirtualTryOn({
        pose_data: poseResponse.data,
        product_image: product.images[0],
        size: selectedSize,
        color: selectedColor,
        user_measurements: {
          height: 170, // Mock data - would come from user profile
          weight: 70
        }
      });

      if (tryOnResponse.success && tryOnResponse.data) {
        setOverlayImage(tryOnResponse.data.processed_image);
        dispatch(addToast({
          type: 'success',
          message: 'Virtual try-on generated successfully!'
        }));
      } else {
        throw new Error('Failed to generate virtual try-on');
      }
    } catch (error) {
      console.error('Virtual try-on error:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to process virtual try-on. Please try again.'
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch, selectedSize, selectedColor, product]);

  // Add to cart from try-on
  const addToCartFromTryOn = useCallback(() => {
    if (!product || !selectedSize || !selectedColor) return;

    // This would integrate with cart actions
    dispatch(addToast({
      type: 'success',
      message: 'Product added to cart successfully!'
    }));

    // Navigate to cart
    navigate('/cart');
  }, [product, selectedSize, selectedColor, dispatch, navigate]);

  // Download try-on image
  const downloadImage = useCallback(() => {
    if (!overlayImage) return;

    const link = document.createElement('a');
    link.href = overlayImage;
    link.download = `virtual-try-on-${productId}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [overlayImage, productId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/products/${productId}`)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FiChevronLeft className="mr-2 h-5 w-5" />
              Back to Product
            </button>

            <button
              onClick={() => navigate('/products')}
              className="text-gray-600 hover:text-gray-900"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Info and Controls */}
          <div className="space-y-6">
            {/* Product Information */}
            {product && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Virtual Try-On</h2>

                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-gray-600">{product.brand}</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{product.discountPrice || product.price}
                      {product.discountPrice && (
                        <span className="text-lg text-gray-500 line-through ml-2">
                          ₹{product.price}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded-md transition-colors ${
                          selectedSize === size
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-gray-300 hover:border-red-600 hover:text-red-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Color
                  </label>
                  <div className="flex space-x-2">
                    {product.colors.map(color => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex items-center space-x-2 px-4 py-2 border rounded-md transition-colors ${
                          selectedColor === color.name
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-gray-300 hover:border-red-600'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border-2 border-gray-400"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Recommendations */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Size Tip:</strong> Based on typical measurements,
                    size <strong>M</strong> might be a good fit for you.
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">How to Use</h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li>1. Click "Start Camera" to begin</li>
                <li>2. Position yourself in good lighting</li>
                <li>3. Select your size and color</li>
                <li>4. Click "Capture Photo" to process</li>
                <li>5. Download or add to cart if you like it!</li>
              </ol>
            </div>
          </div>

          {/* Right Column - Camera/Video Feed */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Camera View</h3>

                <button
                  onClick={isVideoActive ? stopCamera : startCamera}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    isVideoActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  disabled={isLoading || isProcessing}
                >
                  {isVideoActive ? (
                    <>
                      <FiCameraOff className="mr-2 h-5 w-5" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <FiCamera className="mr-2 h-5 w-5" />
                      Start Camera
                    </>
                  )}
                </button>
              </div>

              {/* Video/Canvas Container */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '480px' }}>
                {isVideoActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[480px]">
                    <p className="text-gray-500">Camera is off. Click "Start Camera" to begin.</p>
                  </div>
                )}

                {isLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white">Loading...</div>
                  </div>
                )}
              </div>

              {/* Capture Button */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={capturePhoto}
                  disabled={!isVideoActive || isLoading || isProcessing}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Capture Photo'}
                </button>
              </div>
            </div>

            {/* Result Image */}
            {overlayImage && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Result</h3>
                  <button
                    onClick={downloadImage}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <FiDownload className="mr-2 h-5 w-5" />
                    Download
                  </button>
                </div>

                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={overlayImage}
                    alt="Virtual try-on result"
                    className="w-full h-auto"
                  />
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={addToCartFromTryOn}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <FiShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </button>

                  <button
                    onClick={() => setOverlayImage(null)}
                    className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;