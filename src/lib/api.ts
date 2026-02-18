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
}

export const apiClient = new ApiClient();
