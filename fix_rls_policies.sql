-- 安全地修复RLS策略 - 避免重复创建错误

-- 1. 首先创建管理员检查函数（如果不存在）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- 首先检查用户是否存在
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid()) THEN
    RETURN false;
  END IF;

  -- 然后检查用户角色
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 安全地删除现有策略（如果存在）
DO $$
BEGIN
  -- profiles表策略
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '管理员可以管理所有用户资料' AND tablename = 'profiles') THEN
    DROP POLICY "管理员可以管理所有用户资料" ON profiles;
  END IF;

  -- posts表策略
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '管理员可以管理所有文章' AND tablename = 'posts') THEN
    DROP POLICY "管理员可以管理所有文章" ON posts;
  END IF;

  -- comments表策略
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '管理员可以管理所有评论' AND tablename = 'comments') THEN
    DROP POLICY "管理员可以管理所有评论" ON comments;
  END IF;

  -- categories表策略
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '管理员可以管理分类' AND tablename = 'categories') THEN
    DROP POLICY "管理员可以管理分类" ON categories;
  END IF;

  -- tags表策略
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '管理员可以管理标签' AND tablename = 'tags') THEN
    DROP POLICY "管理员可以管理标签" ON tags;
  END IF;

  -- post_tags表策略
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '管理员可以管理所有文章标签' AND tablename = 'post_tags') THEN
    DROP POLICY "管理员可以管理所有文章标签" ON post_tags;
  END IF;
END
$$;

-- 3. 安全地重新创建所有策略（兼容旧版本PostgreSQL）
DO $
BEGIN
  -- profiles表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以读取用户资料' AND tablename = 'profiles') THEN
    CREATE POLICY "任何人都可以读取用户资料" ON profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能更新自己的资料' AND tablename = 'profiles') THEN
    CREATE POLICY "用户只能更新自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  CREATE POLICY "管理员可以管理所有用户资料" ON profiles FOR ALL USING (is_admin());

  -- posts表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以读取已发布的文章' AND tablename = 'posts') THEN
    CREATE POLICY "任何人都可以读取已发布的文章" ON posts FOR SELECT USING (status = 'published');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '作者可以管理自己的文章' AND tablename = 'posts') THEN
    CREATE POLICY "作者可以管理自己的文章" ON posts FOR ALL USING (auth.uid() = author_id);
  END IF;
  
  CREATE POLICY "管理员可以管理所有文章" ON posts FOR ALL USING (is_admin());

  -- comments表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以读取已审核的评论' AND tablename = 'comments') THEN
    CREATE POLICY "任何人都可以读取已审核的评论" ON comments FOR SELECT USING (status = 'approved');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户可以创建评论' AND tablename = 'comments') THEN
    CREATE POLICY "用户可以创建评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能更新自己的评论' AND tablename = 'comments') THEN
    CREATE POLICY "用户只能更新自己的评论" ON comments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  CREATE POLICY "管理员可以管理所有评论" ON comments FOR ALL USING (is_admin());

  -- categories表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以读取分类' AND tablename = 'categories') THEN
    CREATE POLICY "任何人都可以读取分类" ON categories FOR SELECT USING (true);
  END IF;
  
  CREATE POLICY "管理员可以管理分类" ON categories FOR ALL USING (is_admin());

  -- tags表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以读取标签' AND tablename = 'tags') THEN
    CREATE POLICY "任何人都可以读取标签" ON tags FOR SELECT USING (true);
  END IF;
  
  CREATE POLICY "管理员可以管理标签" ON tags FOR ALL USING (is_admin());

  -- 文章标签关联表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以读取文章标签' AND tablename = 'post_tags') THEN
    CREATE POLICY "任何人都可以读取文章标签" ON post_tags FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '作者可以管理自己文章的标签' AND tablename = 'post_tags') THEN
    CREATE POLICY "作者可以管理自己文章的标签" ON post_tags FOR ALL USING (
      EXISTS (SELECT 1 FROM posts WHERE id = post_tags.post_id AND author_id = auth.uid())
    );
  END IF;
  
  CREATE POLICY "管理员可以管理所有文章标签" ON post_tags FOR ALL USING (is_admin());
END
$;

-- 4. 验证修复
COMMENT ON FUNCTION is_admin() IS '安全的管理员权限检查函数，避免RLS递归';