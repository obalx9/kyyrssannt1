import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface MediaDownloadButtonProps {
  postId: string;
  fileId: string;
  fileName: string;
  mimeType?: string;
  onSuccess?: (s3Url: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export const MediaDownloadButton: React.FC<MediaDownloadButtonProps> = ({
  postId,
  fileId,
  fileName,
  mimeType = 'application/octet-stream',
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.downloadTelegramMediaToS3(
        postId,
        fileId,
        fileName,
        mimeType
      );

      setIsDone(true);
      onSuccess?.(result.s3Url);

      setTimeout(() => setIsDone(false), 2000);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Download failed');
      console.error('Media download error:', err);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || isLoading}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
        isDone
          ? 'bg-green-100 text-green-700'
          : isLoading
            ? 'bg-blue-100 text-blue-700 cursor-wait'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isDone ? 'Downloaded to S3' : 'Download to S3 for faster access'}
    >
      {isLoading ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : isDone ? (
        <span className="text-green-600">✓</span>
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isLoading ? 'Downloading...' : isDone ? 'Downloaded' : 'Download'}
    </button>
  );
};
