import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 数据库表类型定义
export interface Profile {
  id: string
  username: string
  avatar_url?: string
  bio?: string
  website?: string
  role: 'subscriber' | 'editor' | 'admin'
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  slug: string
  cover_image?: string
  status: 'draft' | 'published' | 'archived'
  author_id: string
  category_id?: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  created_at: string
}

export interface Comment {
  id: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  post_id: string
  user_id: string
  parent_id?: string
  created_at: string
  updated_at: string
}

// 系统设置相关接口
export interface Setting {
  id: string
  key: string
  value: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'json'
  category: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface SiteSettings {
  id: string
  site_name: string
  site_description: string
  site_url?: string
  logo_url?: string
  favicon_url?: string
  footer_text: string
  meta_keywords?: string
  meta_description?: string
  created_at: string
  updated_at: string
}

export interface CommentSettings {
  id: string
  enable_comments: boolean
  require_approval: boolean
  allow_anonymous: boolean
  enable_reply: boolean
  min_length: number
  max_length: number
  blocked_keywords: string[]
  auto_approve_keywords: string[]
  created_at: string
  updated_at: string
}

export interface EmailSettings {
  id: string
  smtp_host?: string
  smtp_port: number
  smtp_username?: string
  smtp_password?: string
  from_email?: string
  from_name: string
  enable_ssl: boolean
  enable_notifications: boolean
  new_comment_notification: boolean
  user_registration_notification: boolean
  created_at: string
  updated_at: string
}

export interface SecuritySettings {
  id: string
  enable_registration: boolean
  require_email_verification: boolean
  enable_captcha: boolean
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_special_chars: boolean
  session_timeout: number
  max_login_attempts: number
  lockout_duration: number
  created_at: string
  updated_at: string
}