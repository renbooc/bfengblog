import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash2, Eye, BarChart3 } from 'lucide-react'
import PostEditor from '../components/PostEditor'

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([])
  const [editingPost, setEditingPost] = useState<any>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0
  })

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPosts(data || [])
      
      // 计算统计信息
      setStats({
        total: data?.length || 0,
        published: data?.filter(p => p.status === 'published').length || 0,
        drafts: data?.filter(p => p.status === 'draft').length || 0
      })
    } catch (error) {
      console.error('加载文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      
      loadPosts() // 重新加载列表
    } catch (error) {
      console.error('删除文章失败:', error)
    }
  }

  const handleEdit = (post: any) => {
    setEditingPost(post)
    setShowEditor(true)
  }

  const handleNewPost = () => {
    setEditingPost(null)
    setShowEditor(true)
  }

  const handleEditorClose = () => {
    setShowEditor(false)
    setEditingPost(null)
    loadPosts() // 重新加载列表
  }

  if (showEditor) {
    return <PostEditor post={editingPost} onSave={handleEditorClose} />
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">文章管理</h1>
        <button onClick={handleNewPost} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          新建文章
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-gray-600">总文章数</div>
        </div>
        
        <div className="card p-6 text-center">
          <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-gray-900">{stats.published}</div>
          <div className="text-gray-600">已发布</div>
        </div>
        
        <div className="card p-6 text-center">
          <Edit className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
          <div className="text-2xl font-bold text-gray-900">{stats.drafts}</div>
          <div className="text-gray-600">草稿</div>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">文章列表</h2>
        </div>
        
        <div className="divide-y">
          {posts.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              还没有文章，点击"新建文章"开始创作吧！
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{post.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {post.excerpt || '暂无摘要'}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="capitalize px-2 py-1 rounded-full bg-gray-100">
                        {post.status}
                      </span>
                      <span>创建于: {new Date(post.created_at).toLocaleDateString()}</span>
                      {post.published_at && (
                        <span>发布于: {new Date(post.published_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}