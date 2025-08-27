// Media utility functions
export const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  const lowerUrl = url?.toLowerCase() || '';
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('video_');
};

// Add other media-related utility functions here if needed
