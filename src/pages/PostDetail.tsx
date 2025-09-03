import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CommentSystem from '../components/CommentSystem'
import { Calendar, User, ArrowLeft, AlertCircle, Clock } from 'lucide-react'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadPost(id)
    }
  }, [id])

  const loadPost = async (postId: string) => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username, avatar_url),
          categories:category_id (name, slug)
        `)
        .eq('id', postId)
        .eq('status', 'published')
        .single()

      if (error) throw error
      setPost(data)
    } catch (error: any) {
      console.error('加载文章详情失败:', error)
      setError(error.message || '文章不存在或加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">加载失败</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/posts"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            返回文章列表
          </Link>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">文章不存在</h2>
          <Link
            to="/posts"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            返回文章列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Link
        to="/posts"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回文章列表
      </Link>

      {/* 文章头部 */}
      <div className="mb-8">
        {/* 分类标签 */}
        {post.categories && (
          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full mb-4">
            {post.categories.name}
          </span>
        )}
        
        {/* 标题 */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* 元信息 */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="font-medium">{post.profiles?.username || '未知作者'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              {post.published_at ? new Date(post.published_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '未发布'}
            </span>
          </div>
          {post.read_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{post.read_time} 分钟阅读</span>
            </div>
          )}
        </div>

        {/* 封面图片 */}
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-64 object-cover rounded-xl shadow-lg mb-8"
          />
        )}

        {/* 摘要 */}
        {post.excerpt && (
          <p className="text-lg text-gray-700 leading-relaxed mb-6 italic border-l-4 border-primary-500 pl-4">
            {post.excerpt}
          </p>
        )}
      </div>

      {/* 文章内容 */}
      <article className="prose prose-lg max-w-none">
        <div 
          className="text-gray-800 leading-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* 底部信息 */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>发布于 {new Date(post.published_at).toLocaleDateString('zh-CN')}</span>
          <span>最后更新于 {new Date(post.updated_at).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      {/* 评论系统 */}
      <div className="mt-16">
        <CommentSystem postId={post.id} />
      </div>
    </div>
  )
}