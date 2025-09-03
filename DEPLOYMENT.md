# 博客系统部署指南

本文档详细说明了如何部署这个基于 React + Vite + Supabase 的博客系统。

## 部署前准备

确保你已经：

1. 完成了博客系统的开发
2. 有一个 Supabase 账户和项目
3. 有一个 GitHub 账户（用于 Vercel/Netlify 部署）
4. 获取了以下信息：
   - Supabase 项目 URL
   - Supabase 项目匿名密钥

## 部署选项

### 选项A：Vercel部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 访问 [Vercel](https://vercel.com/) 并使用 GitHub 账户登录
3. 点击 "New Project"
4. 选择你的博客系统仓库
5. 配置项目：
   - Framework Preset: Vite
   - Root Directory: /
   - Build and Output Settings:
     - Build Command: `npm run build`
     - Output Directory: `dist`
6. 在 "Environment Variables" 部分添加以下环境变量：
   - `VITE_SUPABASE_URL`: 你的 Supabase 项目 URL
   - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase 项目匿名密钥
7. 点击 "Deploy" 开始部署
8. 部署完成后，Vercel 会提供一个 URL 来访问你的博客

### 选项B：Netlify部署

1. 将代码推送到 GitHub 仓库
2. 访问 [Netlify](https://netlify.com/) 并使用 GitHub 账户登录
3. 点击 "New site from Git"
4. 选择你的博客系统仓库
5. 配置部署设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 在 "Environment variables" 部分添加以下环境变量：
   - `VITE_SUPABASE_URL`: 你的 Supabase 项目 URL
   - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase 项目匿名密钥
7. 点击 "Deploy site" 开始部署
8. 部署完成后，Netlify 会提供一个 URL 来访问你的博客

### 选项C：传统服务器部署

1. 构建生产版本：
   ```bash
   npm run build
   ```
2. 将 `dist` 目录中的所有文件上传到你的服务器
3. 配置你的 Web 服务器（如 Nginx 或 Apache）以提供静态文件服务
4. 在服务器上设置环境变量或在构建时将它们注入到应用中

## Supabase 数据库配置

1. 登录到 [Supabase](https://supabase.com/)
2. 进入你的项目控制台
3. 在 SQL 编辑器中运行 `supabase/schema.sql` 文件中的脚本
4. 确保行级安全策略（RLS）已正确配置
5. 在 "Authentication" 设置中配置认证提供者（如 GitHub OAuth）

## 环境变量配置

无论选择哪种部署方式，都需要配置以下环境变量：

```env
VITE_SUPABASE_URL=你的 Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=你的 Supabase 项目匿名密钥
```

## 域名配置（可选）

### Vercel 域名配置
1. 在 Vercel 项目设置中进入 "Domains" 部分
2. 添加你的自定义域名
3. 按照指示在你的域名注册商处配置 DNS 记录

### Netlify 域名配置
1. 在 Netlify 项目设置中进入 "Domain management" 部分
2. 添加你的自定义域名
3. 按照指示在你的域名注册商处配置 DNS 记录

## 测试和验证

部署完成后，请执行以下测试：

1. 访问部署的网站 URL
2. 测试用户注册和登录功能
3. 测试文章创建、编辑和发布功能
4. 测试评论系统
5. 验证所有页面都能正常加载
6. 在不同设备和浏览器上测试响应式设计

## 故障排除

如果遇到问题，请检查：

1. 环境变量是否正确配置
2. Supabase 数据库连接是否正常
3. 控制台是否有任何错误消息
4. 网络请求是否成功（使用浏览器开发者工具检查）

## 后续维护

部署后，你可以通过以下方式更新网站：

1. 将更改推送到 GitHub 仓库
2. 如果使用 Vercel 或 Netlify，它们会自动重新部署
3. 如果使用传统服务器，需要重新构建并上传文件

如有任何问题，请参考相关文档或寻求社区支持。