class MediaCache {
  private cache: Map<string, string> = new Map();
  private loading: Map<string, Promise<string>> = new Map();

  private isDirectS3Url(url: string): boolean {
    return url.includes('s3.twcstorage.ru') && url.startsWith('http');
  }

  private isProxyUrl(url: string): boolean {
    return url.includes('/api/') && !url.startsWith('http://localhost');
  }

  async getMedia(fileId: string, mediaUrl: string): Promise<string> {
    if (this.cache.has(fileId)) {
      return this.cache.get(fileId)!;
    }

    if (this.loading.has(fileId)) {
      return this.loading.get(fileId)!;
    }

    const loadPromise = this.isDirectS3Url(mediaUrl)
      ? this.fetchDirectMedia(fileId, mediaUrl)
      : this.fetchMedia(fileId, mediaUrl);

    this.loading.set(fileId, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(fileId, result);
      return result;
    } catch (error) {
      if (this.isDirectS3Url(mediaUrl) && this.isProxyUrl(mediaUrl)) {
        console.warn('Direct S3 fetch failed, fallback not available for direct URLs');
      }
      throw error;
    } finally {
      this.loading.delete(fileId);
    }
  }

  private async fetchDirectMedia(fileId: string, mediaUrl: string): Promise<string> {
    const response = await fetch(mediaUrl);

    if (!response.ok) {
      throw new Error(`Failed to load S3 media: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  private async fetchMedia(fileId: string, mediaUrl: string): Promise<string> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('File is too large (over 20 MB) to be streamed through Telegram. Please ask the course creator to use a smaller file.');
      }

      let errorMessage = `Failed to load media: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If JSON parsing fails, use default error message
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  preload(fileId: string, mediaUrl: string): void {
    if (!this.cache.has(fileId) && !this.loading.has(fileId)) {
      this.getMedia(fileId, mediaUrl).catch(err => {
        console.warn('Preload failed for', fileId, err);
      });
    }
  }

  clear(): void {
    this.cache.forEach(url => URL.revokeObjectURL(url));
    this.cache.clear();
    this.loading.clear();
  }

  remove(fileId: string): void {
    const url = this.cache.get(fileId);
    if (url) {
      URL.revokeObjectURL(url);
      this.cache.delete(fileId);
    }
  }
}

export const mediaCache = new MediaCache();
