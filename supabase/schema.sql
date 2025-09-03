-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  role TEXT DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 文章表
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  slug TEXT UNIQUE NOT NULL,
  cover_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 行级安全策略 (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- profiles表策略
CREATE POLICY "任何人都可以读取用户资料" ON profiles FOR SELECT USING (true);
CREATE POLICY "用户只能更新自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "管理员可以管理所有用户资料" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- posts表策略
CREATE POLICY "任何人都可以读取已发布的文章" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "作者可以管理自己的文章" ON posts FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "管理员可以管理所有文章" ON posts FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- comments表策略
CREATE POLICY "任何人都可以读取已审核的评论" ON comments FOR SELECT USING (status = 'approved');
CREATE POLICY "用户可以创建评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的评论" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "管理员可以管理所有评论" ON comments FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- categories表策略
CREATE POLICY "任何人都可以读取分类" ON categories FOR SELECT USING (true);
CREATE POLICY "管理员可以管理分类" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 自动更新updated_at字段的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 用户注册后自动创建profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    'subscriber'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 文章标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

-- 评论点赞表策略
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户可以管理自己的点赞" ON comment_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "任何人都可以读取点赞" ON comment_likes FOR SELECT USING (true);

-- 标签表策略
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "任何人都可以读取标签" ON tags FOR SELECT USING (true);
CREATE POLICY "管理员可以管理标签" ON tags FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 文章标签关联表策略
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "任何人都可以读取文章标签" ON post_tags FOR SELECT USING (true);
CREATE POLICY "作者可以管理自己文章的标签" ON post_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM posts WHERE id = post_tags.post_id AND author_id = auth.uid())
);
CREATE POLICY "管理员可以管理所有文章标签" ON post_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 插入示例数据
INSERT INTO categories (name, slug, description) VALUES
('技术', 'technology', '关于编程和技术的文章'),
('生活', 'life', '日常生活和感悟'),
('旅行', 'travel', '旅行见闻和攻略')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 新增功能 - 添加时间: 2025-09-02
-- ============================================

-- 插入示例标签数据
INSERT INTO tags (name, slug, description, color) VALUES
('React', 'react', 'React 相关技术文章', '#61DAFB'),
('TypeScript', 'typescript', 'TypeScript 语言相关', '#3178C6'),
('Node.js', 'nodejs', 'Node.js 后端开发', '#339933'),
('前端开发', 'frontend', '前端开发技术', '#FF6B35'),
('数据库', 'database', '数据库相关知识', '#FF9A3E'),
('算法', 'algorithm', '算法与数据结构', '#4ECDC4'),
('设计模式', 'design-patterns', '软件设计模式', '#9C27B0'),
('DevOps', 'devops', '开发运维相关', '#00BCD4')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 系统设置功能 - 添加时间: 2025-09-02
-- ============================================

-- 系统设置表（键值对存储）
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 网站基本信息表
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT 'My Blog',
  site_description TEXT DEFAULT 'A modern personal blog system',
  site_url TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  footer_text TEXT DEFAULT 'Powered by Blog System',
  meta_keywords TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 评论设置表
CREATE TABLE IF NOT EXISTS comment_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  enable_comments BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT true,
  allow_anonymous BOOLEAN DEFAULT false,
  enable_reply BOOLEAN DEFAULT true,
  min_length INTEGER DEFAULT 1,
  max_length INTEGER DEFAULT 1000,
  blocked_keywords TEXT[],
  auto_approve_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 邮件设置表
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT,
  from_email TEXT,
  from_name TEXT DEFAULT 'Blog System',
  enable_ssl BOOLEAN DEFAULT true,
  enable_notifications BOOLEAN DEFAULT true,
  new_comment_notification BOOLEAN DEFAULT true,
  user_registration_notification BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 安全设置表
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  enable_registration BOOLEAN DEFAULT true,
  require_email_verification BOOLEAN DEFAULT true,
  enable_captcha BOOLEAN DEFAULT false,
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_lowercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_special_chars BOOLEAN DEFAULT false,
  session_timeout INTEGER DEFAULT 3600,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration INTEGER DEFAULT 900,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 设置表策略
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "任何人都可以读取公开设置" ON settings FOR SELECT USING (is_public = true);
CREATE POLICY "管理员可以管理所有设置" ON settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 网站设置表策略
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "任何人都可以读取网站设置" ON site_settings FOR SELECT USING (true);
CREATE POLICY "管理员可以管理网站设置" ON site_settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 评论设置表策略
ALTER TABLE comment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "任何人都可以读取评论设置" ON comment_settings FOR SELECT USING (true);
CREATE POLICY "管理员可以管理评论设置" ON comment_settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 邮件设置表策略
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "管理员可以管理邮件设置" ON email_settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 安全设置表策略
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "管理员可以管理安全设置" ON security_settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 更新设置表的触发器
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_settings_updated_at BEFORE UPDATE ON comment_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at BEFORE UPDATE ON email_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at BEFORE UPDATE ON security_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认设置数据
INSERT INTO site_settings (site_name, site_description, site_url, meta_keywords, meta_description) VALUES
('My Blog', 'A modern personal blog system', 'https://myblog.example.com', 'blog, technology, life', 'A modern personal blog system for sharing thoughts and experiences')
ON CONFLICT DO NOTHING;

INSERT INTO comment_settings (enable_comments, require_approval, allow_anonymous, enable_reply, min_length, max_length) VALUES
(true, true, false, true, 1, 1000)
ON CONFLICT DO NOTHING;

INSERT INTO email_settings (from_email, from_name, enable_ssl, enable_notifications, new_comment_notification, user_registration_notification) VALUES
('noreply@myblog.example.com', 'Blog System', true, true, true, true)
ON CONFLICT DO NOTHING;

INSERT INTO security_settings (enable_registration, require_email_verification, enable_captcha, password_min_length, password_require_uppercase, password_require_lowercase, password_require_numbers, password_require_special_chars, session_timeout, max_login_attempts, lockout_duration) VALUES
(true, true, false, 8, true, true, true, false, 3600, 5, 900)
ON CONFLICT DO NOTHING;

-- 插入通用设置
INSERT INTO settings (key, value, description, type, category, is_public) VALUES
('posts_per_page', '10', '每页显示的文章数量', 'number', 'general', true),
('enable_rss', 'true', '是否启用RSS订阅', 'boolean', 'general', true),
('enable_sitemap', 'true', '是否启用站点地图', 'boolean', 'general', true),
('maintenance_mode', 'false', '是否启用维护模式', 'boolean', 'general', false),
('analytics_code', '', '网站分析代码', 'string', 'analytics', false),
('custom_css', '', '自定义CSS代码', 'string', 'appearance', false),
('custom_js', '', '自定义JavaScript代码', 'string', 'appearance', false)
ON CONFLICT (key) DO NOTHING;