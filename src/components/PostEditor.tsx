import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { processImageUrl } from '../utils/imageHelper'
import { X, Save, Calendar } from 'lucide-react'
import ImageUpload from './ImageUpload'
import RichTextEditor from './RichTextEditor'

interface PostEditorProps {
  post?: any
  onSave?: (postData: any) => void
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function PostEditor({ post, onSave }: PostEditorProps) {
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [status, setStatus] = useState(post?.status || 'draft')
  const [category, setCategory] = useState(post?.category_id || '')
  const [coverImage, setCoverImage] = useState(post?.cover_image || '')
  const [processedCoverImage, setProcessedCoverImage] = useState('')
  const [publishDate, setPublishDate] = useState(
    post?.published_at ? new Date(post.published_at).toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  
  // 调试：打印传入的 post 对象和 cover_image
  console.log('PostEditor 初始化:', { post, coverImage: post?.cover_image })

  // 处理封面图片URL
  useEffect(() => {
    const processImage = async () => {
      if (coverImage) {
        console.log('开始处理封面图片URL:', coverImage)
        const processedUrl = await processImageUrl(coverImage)
        console.log('处理后的封面图片URL:', processedUrl)
        setProcessedCoverImage(processedUrl)
      } else {
        setProcessedCoverImage('')
      }
    }
    
    processImage()
  }, [coverImage])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!slug || slug === generateSlug(post?.title || '')) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      const postData = {
        id: post?.id,
        title,
        content,
        excerpt,
        slug: slug || generateSlug(title),
        cover_image: coverImage || null,
        status,
        category_id: category ? category : null,
        published_at: status === 'published' 
          ? (publishDate ? new Date(publishDate).toISOString() : new Date().toISOString())
          : null
      }

      // 如果有 onSave 回调，则调用它（用于 AdminDashboard）
      if (onSave) {
        onSave(postData)
        setMessage('文章保存成功!')
      } else {
        // 直接保存到数据库（用于独立使用）
        if (post) {
          // 更新文章
          const { error } = await supabase
            .from('posts')
            .update({ ...postData, updated_at: new Date().toISOString() })
            .eq('id', post.id)

          if (error) throw error
          setMessage('文章更新成功!')
        } else {
          // 创建新文章
          const { error } = await supabase
            .from('posts')
            .insert([{ ...postData, author_id: user.id }])

          if (error) throw error
          setMessage('文章创建成功!')
        }
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{post ? '编辑文章' : '新建文章'}</h2>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? '保存中...' : '保存文章'}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-md ${
            message.includes('成功') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入文章标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL 别名
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="文章-url-别名"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            摘要
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="文章摘要（可选）"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            内容 *
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="开始编写文章内容..."
            className="w-full"
          />
        </div>

        {/* 封面图片上传 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            封面图片
          </label>
          <ImageUpload
            onImageUpload={(url) => {
              console.log('图片上传成功，URL:', url)
              setCoverImage(url)
            }}
            onImageRemove={(url) => {
              console.log('图片删除，URL:', url)
              setCoverImage('')
            }}
            folder="post-covers"
            className="mb-6"
          />
          {coverImage && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">当前封面图片预览：</p>
              <div className="flex items-start">
                <div className="relative">
                  <img
                    src={processedCoverImage || coverImage}
                    alt="封面预览"
                    className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                    onError={(e) => {
                      console.error('封面图片加载失败:', e)
                      console.log('失败的图片URL:', processedCoverImage || coverImage)
                      console.log('原始图片URL:', coverImage)
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement?.classList.add('bg-red-100')
                    }}
                    onLoad={() => {
                      console.log('封面图片加载成功:', processedCoverImage || coverImage)
                    }}
                  />
                  <div className="hidden absolute inset-0 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-xs text-center p-2">图片加载失败</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="ml-3 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                  title="删除图片"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-xs text-blue-600 font-medium mb-1">原始图片URL:</p>
                <p className="text-xs text-blue-600 break-all bg-blue-100 p-2 rounded mb-2">{coverImage}</p>
                {processedCoverImage && processedCoverImage !== coverImage && (
                  <>
                    <p className="text-xs text-green-600 font-medium mb-1">处理后图片URL:</p>
                    <p className="text-xs text-green-600 break-all bg-green-100 p-2 rounded mb-2">{processedCoverImage}</p>
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.open(coverImage, '_blank')
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700 underline"
                  >
                    打开原始链接
                  </button>
                  {processedCoverImage && processedCoverImage !== coverImage && (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(processedCoverImage, '_blank')
                      }}
                      className="text-xs text-green-500 hover:text-green-700 underline"
                    >
                      打开处理后链接
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">无分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              发布日期
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}