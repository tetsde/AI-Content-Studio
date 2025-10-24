export type VideoAnalysisResult = {
  type: 'video';
  transcript: string;
  description: string;
};

export type ImageAnalysisResult = {
  type: 'image';
  description: string;
  textInImage: string;
};

export type AnalysisResult = VideoAnalysisResult | ImageAnalysisResult;

export type MediaItemStatus = 'pending' | 'loading' | 'success' | 'error';

export type SocialContentResult = {
  goal_summary: string;
  title: string;
  caption: string;
  hashtags: string[];
  suggested_image_ideas: string;
  optimal_post_time: string;
  optimization_tips: string[];
  implementation_notes: string[];
};

export type ContentGenerationState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  result: SocialContentResult | null;
  error: string | null;
  rating: number | null;
  feedbackText: string | null;
  prompt: string | null;
};

export type MediaItem = {
  id: string;
  file: File;
  type: 'video' | 'image';
  previewUrl: string;
  status: MediaItemStatus;
  result: AnalysisResult | null;
  error: string | null;
  content: {
    kids: ContentGenerationState;
    mg: ContentGenerationState;
  };
};