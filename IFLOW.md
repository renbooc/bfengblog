# IFLOW.md - 博客系统项目文档

## 项目概述

这是一个基于 React + TypeScript + Vite 构建的现代化博客系统，使用 Supabase 作为后端数据库和认证服务。项目采用现代化的技术栈，支持用户认证、文章管理、评论系统等功能。

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **样式**: Tailwind CSS
- **路由**: React Router DOM
- **后端**: Supabase (PostgreSQL + 认证)
- **图标**: Lucide React
- **代码质量**: ESLint + TypeScript

## 项目结构

```
blog-system/
├── src/
│   ├── components/     # 可复用组件
│   │   ├── Auth.tsx           # 认证组件
│   │   ├── CommentSystem.tsx  # 评论系统
│   │   ├── Layout.tsx         # 布局组件
│   │   └── PostEditor.tsx     # 文章编辑器
│   ├── lib/
│   │   └── supabase.ts        # Supabase 客户端配置
│   ├── pages/         # 页面组件
│   │   ├── About.tsx         # 关于页面
│   │   ├── Dashboard.tsx     # 仪表板
│   │   ├── Home.tsx          # 首页
│   │   └── Posts.tsx         # 文章页面
│   ├── App.tsx       # 主应用组件
│   └── main.tsx      # 应用入口
├── supabase/
│   └── schema.sql    # 数据库架构
├── package.json      # 项目依赖
└── 配置文件
```

## 数据库架构

项目使用 Supabase PostgreSQL 数据库，包含以下主要表：

1. **profiles** - 用户资料表
2. **posts** - 文章表
3. **categories** - 分类表
4. **comments** - 评论表

支持行级安全策略 (RLS) 和自动触发器。

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览生产构建
npm run preview
```

## 环境配置

复制 `.env.example` 为 `.env` 并配置以下变量：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 功能特性

### 已实现功能
- ✅ 用户注册/登录（邮箱 + GitHub OAuth）
- ✅ 文章创建、编辑、发布
- ✅ 文章分类管理
- ✅ Markdown 内容支持
- ✅ 响应式设计
- ✅ 现代化 UI 设计

### 待实现功能
- 🔄 评论系统完善
- 🔄 文章搜索功能
- 🔄 图片上传支持
- 🔄 管理员后台
- 🔄 文章标签系统

## 开发约定

1. **代码风格**: 使用 ESLint 进行代码检查
2. **类型安全**: 全面使用 TypeScript
3. **组件设计**: 函数式组件 + Hooks
4. **状态管理**: 使用 React 内置状态管理
5. **样式方案**: Tailwind CSS 原子化样式

## 部署说明

1. 配置 Supabase 项目并获取 URL 和密钥
2. 设置环境变量
3. 运行 `npm run build` 构建项目
4. 部署 `dist` 目录到静态托管服务

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 运行测试和代码检查
5. 提交 Pull Request

## 相关链接

- [Supabase 文档](https://supabase.com/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [Vite 文档](https://vite.dev)

---

*最后更新: 2025-09-02*