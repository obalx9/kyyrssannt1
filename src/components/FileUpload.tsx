import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Upload, X, Loader } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://keykurs.ru';

interface FileUploadProps {
  courseId: string;
  lessonId?: string;
  onUploadComplete: (storagePath: string, fileSize: number, fileName: string) => void;
}

export default function FileUpload({ courseId, lessonId, onUploadComplete }: FileUploadProps) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      };

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Invalid response'));
            }
          } else {
            reject(new Error(xhr.statusText || 'Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));

        const params = new URLSearchParams();
        params.append('courseId', courseId);
        if (lessonId) params.append('lessonId', lessonId);

        const uploadUrl = `${API_URL}/api/upload?${params.toString()}`;
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const result = await uploadPromise;
      setUploadProgress(100);
      onUploadComplete(result.filePath, file.size, file.name);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-not-allowed'
            : 'border-teal-300 dark:border-teal-600 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
        }`}>
          {uploading ? (
            <div className="space-y-2">
              <Loader className="w-8 h-8 mx-auto text-teal-500 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('uploading')}...</p>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-teal-500 dark:text-teal-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('clickToUpload')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {t('supportedFormats')}
              </p>
            </div>
          )}
        </div>
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
