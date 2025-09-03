-- 修复系统设置表的RLS策略
-- 这个脚本需要手动在Supabase SQL编辑器中运行

-- 删除现有的RLS策略
DROP POLICY IF EXISTS "任何人都可以读取公开设置" ON settings;
DROP POLICY IF EXISTS "管理员可以管理所有设置" ON settings;

DROP POLICY IF EXISTS "任何人都可以读取网站设置" ON site_settings;
DROP POLICY IF EXISTS "管理员可以管理网站设置" ON site_settings;

DROP POLICY IF EXISTS "任何人都可以读取评论设置" ON comment_settings;
DROP POLICY IF EXISTS "管理员可以管理评论设置" ON comment_settings;

DROP POLICY IF EXISTS "管理员可以管理邮件设置" ON email_settings;

DROP POLICY IF EXISTS "管理员可以管理安全设置" ON security_settings;

-- 创建新的RLS策略
CREATE POLICY "任何人都可以读取公开设置" ON settings FOR SELECT USING (is_public = true);
CREATE POLICY "管理员可以管理所有设置" ON settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "任何人都可以读取网站设置" ON site_settings FOR SELECT USING (true);
CREATE POLICY "管理员可以管理网站设置" ON site_settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "任何人都可以读取评论设置" ON comment_settings FOR SELECT USING (true);
CREATE POLICY "管理员可以管理评论设置" ON comment_settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "管理员可以管理邮件设置" ON email_settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "管理员可以管理安全设置" ON security_settings FOR ALL USING (
  auth.uid() IS NOT NULL
  AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);