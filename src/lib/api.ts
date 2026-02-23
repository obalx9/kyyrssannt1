const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
  }

  async getTelegramBot() {
    return this.request('/api/telegram-bot');
  }

  async telegramAuth(userData: any) {
    return this.request('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser() {
    return this.request('/api/user');
  }

  async getCoursePosts(courseId: string, limit = 200, offset = 0) {
    return this.request(`/api/courses/${courseId}/posts?limit=${limit}&offset=${offset}`);
  }

  async createCoursePost(courseId: string, postData: any) {
    return this.request(`/api/courses/${courseId}/posts`, {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updatePost(postId: string, updates: any) {
    return this.request(`/api/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deletePost(postId: string) {
    return this.request(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async addPostMedia(postId: string, mediaData: any) {
    return this.request(`/api/posts/${postId}/media`, {
      method: 'POST',
      body: JSON.stringify(mediaData),
    });
  }

  async updatePostMedia(postId: string, mediaId: string, updates: any) {
    return this.request(`/api/posts/${postId}/media/${mediaId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deletePostMedia(postId: string, mediaId: string) {
    return this.request(`/api/posts/${postId}/media/${mediaId}`, {
      method: 'DELETE',
    });
  }

  async downloadTelegramMediaToS3(postId: string, mediaData: any) {
    return this.request(`/api/posts/${postId}/download-telegram-media`, {
      method: 'POST',
      body: JSON.stringify(mediaData),
    });
  }

  getMediaUrl(storagePath: string) {
    return `${API_BASE_URL}/api/media/${encodeURIComponent(storagePath)}`;
  }

  async getTelegramFileUrl(fileId: string, courseId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/telegram/file/${fileId}?course_id=${courseId}`,
      {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get file URL');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async getPinnedPosts(courseId: string) {
    return this.request(`/api/courses/${courseId}/pinned-posts`);
  }

  async pinPost(postId: string) {
    return this.request(`/api/posts/${postId}/pin`, {
      method: 'POST',
    });
  }

  async unpinPost(postId: string) {
    return this.request(`/api/posts/${postId}/pin`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
