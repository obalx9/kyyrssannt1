export type UserRole = 'super_admin' | 'seller' | 'student';

export interface User {
  id: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  created_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: 'super_admin' | 'seller' | 'student';
  created_at: string;
}

export interface Seller {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  is_approved: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  created_at: string;
}

export interface LessonContent {
  id: string;
  lesson_id: string;
  content_type: 'video' | 'text' | 'file';
  video_url?: string;
  text_content?: string;
  file_url?: string;
  file_name?: string;
  order_index: number;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  granted_by: string;
  enrolled_at: string;
  expires_at?: string;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  completed: boolean;
  last_position_seconds: number;
  updated_at: string;
}
