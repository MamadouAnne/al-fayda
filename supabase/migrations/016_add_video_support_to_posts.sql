-- Add video support to posts bucket

-- Update posts bucket to support videos as well as images
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800, -- 50MB limit for videos
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/avi'
  ]
WHERE id = 'posts';

-- Also increase stories bucket limit and add more video formats
UPDATE storage.buckets 
SET 
  file_size_limit = 104857600, -- 100MB limit for stories
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/avi',
    'video/mov'
  ]
WHERE id = 'stories';