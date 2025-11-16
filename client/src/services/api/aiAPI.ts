import { aiService } from './index';
import { ApiResponse } from './index';

export interface PoseData {
  landmarks: Array<{
    x: number;
    y: number;
    z?: number;
    visibility?: number;
  }>;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VirtualTryOnRequest {
  poseData: PoseData;
  productImage: string; // Base64 or URL
  productImageUrl: string;
  size: string;
  color: string;
  userMeasurements?: {
    height: number;
    weight: number;
    chest?: number;
    waist?: number;
    hips?: number;
  };
}

export interface VirtualTryOnResponse {
  processedImage: string; // Base64 processed image
  confidence: number;
  recommendations?: {
    size: string;
    fit: 'tight' | 'regular' | 'loose';
    confidence: number;
  };
}

export interface ClothingProcessRequest {
  productImage: string;
  removeBackground: boolean;
  extractClothing: boolean;
}

export interface ClothingProcessResponse {
  processedImage: string;
  mask: string;
  keypoints: Array<{
    x: number;
    y: number;
    type: string;
  }>;
}

export const aiAPI = {
  // Process clothing image for virtual try-on
  processClothingImage: (request: ClothingProcessRequest): Promise<ApiResponse<ClothingProcessResponse>> => {
    return aiService.post('/process-clothing', request);
  },

  // Generate virtual try-on overlay
  generateVirtualTryOn: (request: VirtualTryOnRequest): Promise<ApiResponse<VirtualTryOnResponse>> => {
    return aiService.post('/generate-overlay', request);
  },

  // Detect pose from user camera/image
  detectPose: (imageData: string): Promise<ApiResponse<PoseData>> => {
    return aiService.post('/detect-pose', { imageData });
  },

  // Get size recommendations
  getSizeRecommendations: (params: {
    height: number;
    weight: number;
    gender: 'male' | 'female' | 'other';
    brand?: string;
    category?: string;
  }): Promise<ApiResponse<{
    recommendedSize: string;
    alternatives: Array<{
      size: string;
      fit: 'tight' | 'regular' | 'loose';
      confidence: number;
    }>;
    measurements: {
      chest: number;
      waist: number;
      hips: number;
    };
  }>> => {
    return aiService.post('/size-recommendations', params);
  },

  // Analyze clothing fit
  analyzeFit: (params: {
    userImage: string;
    productImage: string;
    size: string;
  }): Promise<ApiResponse<{
    fitScore: number;
    fitType: 'tight' | 'regular' | 'loose';
    recommendations: string[];
    measurements: {
      chestFit: number;
      waistFit: number;
      lengthFit: number;
    };
  }>> => {
    return aiService.post('/analyze-fit', params);
  },

  // Generate style recommendations
  getStyleRecommendations: (params: {
    productIds: string[];
    userPreferences?: {
      style: string[];
      colors: string[];
      occasions: string[];
    };
  }): Promise<ApiResponse<{
    recommendations: Array<{
      productId: string;
      reason: string;
      confidence: number;
    }>;
  }>> => {
    return aiService.post('/style-recommendations', params);
  },

  // Check AI service health
  checkHealth: (): Promise<ApiResponse<{
    status: 'healthy' | 'unhealthy';
    version: string;
    models: string[];
  }>> => {
    return aiService.get('/health');
  },

  // Get supported clothing types
  getSupportedClothingTypes: (): Promise<ApiResponse<{
    categories: Array<{
      name: string;
      supported: boolean;
      recommendedModels: string[];
    }>;
  }>> => {
    return aiService.get('/supported-clothing-types');
  },

  // Batch process multiple clothing items
  batchProcess: (requests: ClothingProcessRequest[]): Promise<ApiResponse<ClothingProcessResponse[]>> => {
    return aiService.post('/batch-process', { requests });
  },
};