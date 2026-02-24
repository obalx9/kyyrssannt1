const API_URL = import.meta.env.VITE_API_URL || '';

export class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async telegramAuth(telegramData: any) {
    const data = await this.request('/api/telegram-auth', {
      method: 'POST',
      body: JSON.stringify(telegramData),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async getUser() {
    return this.request('/api/user');
  }

  async getTelegramBot() {
    return this.request('/api/telegram-bot');
  }

  async getCourses() {
    return this.request('/api/courses');
  }

  async getCourse(courseId: string) {
    return this.request(`/api/courses/${courseId}`);
  }

  async createCourse(data: {
    title: string;
    description: string;
    price: number;
    is_published?: boolean;
    telegram_group_id?: string;
    theme_config?: any;
    watermark_text?: string;
  }) {
    return this.request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(courseId: string, data: Partial<{
    title: string;
    description: string;
    price: number;
    is_published: boolean;
    telegram_group_id: string;
    theme_config: any;
    watermark_text: string;
  }>) {
    return this.request(`/api/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(courseId: string) {
    return this.request(`/api/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  async getCoursePosts(courseId: string, limit = 50, offset = 0) {
    return this.request(`/api/courses/${courseId}/posts?limit=${limit}&offset=${offset}`);
  }

  async createCoursePost(courseId: string, data: {
    text_content?: string;
    media_group_id?: string;
    media?: Array<{
      media_type: string;
      file_path?: string;
      telegram_file_id?: string;
      thumbnail_path?: string;
      file_size?: number;
      mime_type?: string;
      duration?: number;
      width?: number;
      height?: number;
      caption?: string;
    }>;
  }) {
    return this.request(`/api/courses/${courseId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePost(postId: string) {
    return this.request(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async getSellerProfile() {
    return this.request('/api/sellers/me');
  }

  async createSellerProfile(data: {
    business_name: string;
    description?: string;
    contact_email?: string;
    telegram_channel?: string;
  }) {
    return this.request('/api/sellers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSellerCourses() {
    return this.request('/api/sellers/me/courses');
  }

  async getStudentProfile() {
    return this.request('/api/students/me');
  }

  async getStudentEnrollments() {
    return this.request('/api/students/me/enrollments');
  }

  async getCourseStudents(courseId: string) {
    return this.request(`/api/courses/${courseId}/students`);
  }

  async enrollStudent(courseId: string, studentId?: string) {
    return this.request(`/api/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
    });
  }

  async removeEnrollment(courseId: string, studentId: string) {
    return this.request(`/api/enrollments/${courseId}/${studentId}`, {
      method: 'DELETE',
    });
  }

  async getPinnedPosts(courseId: string) {
    return this.request(`/api/students/me/pinned-posts?course_id=${courseId}`);
  }

  async pinPost(postId: string) {
    return this.request('/api/students/me/pinned-posts', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId }),
    });
  }

  async unpinPost(postId: string) {
    return this.request(`/api/students/me/pinned-posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async getTelegramBots() {
    return this.request('/api/telegram-bots');
  }

  async createTelegramBot(data: {
    bot_username: string;
    bot_token: string;
    course_id?: string;
  }) {
    return this.request('/api/telegram-bots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdminStats() {
    return this.request('/api/admin/stats');
  }

  async getPendingSellers() {
    return this.request('/api/admin/sellers/pending');
  }

  async approveSeller(sellerId: string) {
    return this.request(`/api/admin/sellers/${sellerId}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectSeller(sellerId: string) {
    return this.request(`/api/admin/sellers/${sellerId}`, {
      method: 'DELETE',
    });
  }

  async searchUsers(query: string) {
    return this.request(`/api/users/search?query=${encodeURIComponent(query)}`);
  }

  async getCourseStudentsFull(courseId: string) {
    return this.request(`/api/courses/${courseId}/students-full`);
  }

  async getPendingEnrollments(courseId: string) {
    return this.request(`/api/courses/${courseId}/pending-enrollments`);
  }

  async createPendingEnrollment(courseId: string, data: {
    telegram_id?: string | null;
    telegram_username?: string | null;
    expires_at?: string | null;
  }) {
    return this.request(`/api/courses/${courseId}/pending-enrollments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePendingEnrollment(courseId: string, enrollmentId: string) {
    return this.request(`/api/courses/${courseId}/pending-enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  async removeEnrollmentById(enrollmentId: string) {
    return this.request(`/api/enrollments/by-enrollment-id/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  async enrollStudentByUserId(courseId: string, studentUserId: string, expiresAt: string | null) {
    return this.request(`/api/courses/${courseId}/enroll-by-identifier`, {
      method: 'POST',
      body: JSON.stringify({ student_user_id: studentUserId, expires_at: expiresAt }),
    });
  }

  async updatePost(postId: string, data: Partial<{
    title: string;
    text_content: string;
    storage_path: string | null;
    file_name: string | null;
    file_size: number | null;
    media_type: string | null;
    telegram_file_id: string | null;
    telegram_thumbnail_file_id: string | null;
    has_error: boolean;
    error_message: string | null;
    media_count: number;
  }>) {
    return this.request(`/api/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPostMedia(postId: string) {
    return this.request(`/api/posts/${postId}/media`);
  }

  async addPostMedia(postId: string, data: {
    media_type: string;
    storage_path?: string | null;
    telegram_file_id?: string | null;
    telegram_thumbnail_file_id?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    order_index?: number;
  }) {
    return this.request(`/api/posts/${postId}/media`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePostMedia(postId: string, mediaId: string, data: { order_index: number }) {
    return this.request(`/api/posts/${postId}/media/${mediaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePostMedia(postId: string, mediaId: string) {
    return this.request(`/api/posts/${postId}/media/${mediaId}`, {
      method: 'DELETE',
    });
  }

  getMediaUrl(storagePath: string): string {
    if (storagePath.startsWith('http')) {
      if (storagePath.includes('s3.twcstorage.ru')) {
        return `${API_URL}/api/s3/proxy?url=${encodeURIComponent(storagePath)}`;
      }
      return storagePath;
    }
    const s3Endpoint = import.meta.env.VITE_S3_ENDPOINT || 'https://s3.twcstorage.ru';
    const s3Bucket = import.meta.env.VITE_S3_BUCKET || 'media';
    const fullUrl = `${s3Endpoint}/${s3Bucket}/${storagePath}`;
    return `${API_URL}/api/s3/proxy?url=${encodeURIComponent(fullUrl)}`;
  }

  async getTelegramFileUrl(fileId: string, courseId: string): Promise<string> {
    const token = this.token || localStorage.getItem('token') || '';
    const response = await fetch(
      `${API_URL}/api/telegram/file/${encodeURIComponent(fileId)}?course_id=${encodeURIComponent(courseId)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error(`Failed to fetch Telegram file: ${response.status}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  buildTelegramFileUrl(fileId: string, courseId: string): string {
    const token = this.token || localStorage.getItem('token') || '';
    return `${API_URL}/api/telegram/file/${encodeURIComponent(fileId)}?course_id=${encodeURIComponent(courseId)}&token=${encodeURIComponent(token)}`;
  }

  async downloadTelegramMediaToS3(postId: string, fileId: string, filename: string, contentType: string = 'application/octet-stream') {
    return this.request('/api/telegram/download-to-s3', {
      method: 'POST',
      body: JSON.stringify({
        fileId,
        postId,
        filename,
        contentType,
      }),
    });
  }
}

export const apiClient = new ApiClient();
