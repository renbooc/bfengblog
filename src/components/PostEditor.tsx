import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Save, Calendar, X } from 'lucide-react'
import ImageUpload from './ImageUpload'

interface PostEditorProps {
  post?: any
  onSave?: () => void
}

export default function PostEditor({ post, onSave }: PostEditorProps) {
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [status, setStatus] = useState(post?.status || 'draft')
  const [category, setCategory] = useState(post?.category_id || '')
  const [coverImage, setCoverImage] = useState(post?.cover_image || '')
  const [publishDate, setPublishDate] = useState(
    post?.published_at ? new Date(post.published_at).toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
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
        title,
        content,
        excerpt,
        slug: slug || generateSlug(title),
        cover_image: coverImage || null,
        status,
        category_id: category || null,
        published_at: status === 'published' 
          ? (publishDate ? new Date(publishDate).toISOString() : new Date().toISOString())
          : null
      }

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

      onSave?.()
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
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            placeholder="使用 Markdown 格式编写内容..."
          />
        </div>

        {/* 封面图片上传 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            封面图片
          </label>
          <ImageUpload
            onImageUpload={(url) => setCoverImage(url)}
            onImageRemove={() => setCoverImage('')}
            folder="post-covers"
            className="mb-6"
          />
          {coverImage && (
            <div className="mt-2 flex items-start">
              <img
                src={coverImage}
                alt="封面预览"
                className="w-32 h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                title="删除图片"
              >
                <X className="w-5 h-5" />
              </button>
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
              <option value="">选择分类</option>
              <option value="technology">技术</option>
              <option value="life">生活</option>
              <option value="travel">旅行</option>
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