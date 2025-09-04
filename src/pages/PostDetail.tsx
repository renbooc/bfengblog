import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CommentSystem from '../components/CommentSystem'
import { Calendar, User, ArrowLeft, AlertCircle, Clock } from 'lucide-react'
import DOMPurify from 'dompurify'
import { processImageUrl } from '../utils/imageHelper'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processedCoverImage, setProcessedCoverImage] = useState('')

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
      console.log('PostDetail loadPost:', data)
      setPost(data)
      
      // 处理封面图片URL
      if (data?.cover_image) {
        console.log('PostDetail 开始处理封面图片URL:', data.cover_image)
        const processedUrl = await processImageUrl(data.cover_image)
        console.log('PostDetail 处理后的封面图片URL:', processedUrl)
        setProcessedCoverImage(processedUrl)
      }
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
          <div className="mb-8">
            <div className="relative">
              <img
                src={processedCoverImage || post.cover_image}
                alt={post.title}
                className="w-full h-64 object-cover rounded-xl shadow-lg"
                onError={(e) => {
                  console.error('PostDetail 封面图片加载失败:', e)
                  console.log('PostDetail 失败的图片URL:', processedCoverImage || post.cover_image)
                  console.log('PostDetail 原始图片URL:', post.cover_image)
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement?.classList.add('bg-red-100', 'p-8', 'rounded-xl')
                }}
                onLoad={() => {
                  console.log('PostDetail 封面图片加载成功:', processedCoverImage || post.cover_image)
                }}
              />
              <div className="hidden absolute inset-0 bg-red-100 rounded-xl flex flex-col items-center justify-center">
                <span className="text-red-600 text-lg font-medium mb-2">图片加载失败</span>
                <span className="text-red-500 text-sm mb-4">请检查图片链接是否有效</span>
                <button
                  onClick={() => window.open(post.cover_image, '_blank')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  尝试直接打开链接
                </button>
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">封面图片</p>
              <button
                onClick={() => window.open(post.cover_image, '_blank')}
                className="text-xs text-blue-500 hover:text-blue-700 underline mt-1"
              >
                查看原图
              </button>
              {processedCoverImage && processedCoverImage !== post.cover_image && (
                <button
                  onClick={() => window.open(processedCoverImage, '_blank')}
                  className="text-xs text-green-500 hover:text-green-700 underline mt-1 ml-2"
                >
                  查看处理后图片
                </button>
              )}
            </div>
          </div>
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
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(post.content, {
              ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'br', 'hr'],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'title']
            })
          }}
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