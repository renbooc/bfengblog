import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSettings } from '../contexts/SettingsContext'
import { 
  updateSiteSettings,
  updateCommentSettings,
  updateEmailSettings,
  updateSecuritySettings,
  setSettingValue
} from '../lib/settings'
import { 
  Edit, 
  Trash2, 
  Plus, 
  X,
  BarChart3,
  FileText,
  Users,
  MessageSquare,
  Settings,
  CheckCircle,
  Shield,
  Save,
  Globe,
  Mail,
  Zap
} from 'lucide-react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    comments: 0,
    publishedPosts: 0
  })
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [editingPost, setEditingPost] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  
  // 使用设置Context
  const { 
    siteSettings, 
    commentSettings, 
    emailSettings, 
    securitySettings, 
    generalSettings,
    setSiteSettings,
    setCommentSettings,
    setEmailSettings,
    setSecuritySettings,
    setGeneralSettings,
    refreshSettings 
  } = useSettings()

  // 自动隐藏通知
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  useEffect(() => {
    loadStats()
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'posts') {
      loadPosts()
      loadCategories()
    }
    if (activeTab === 'comments') loadComments()
  }, [activeTab])

  const loadStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: postsCount },
        { count: commentsCount },
        { count: publishedCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('posts').select('*', { count: 'exact' }),
        supabase.from('comments').select('*', { count: 'exact' }),
        supabase.from('posts').select('*', { count: 'exact' }).eq('status', 'published')
      ])

      setStats({
        users: usersCount || 0,
        posts: postsCount || 0,
        comments: commentsCount || 0,
        publishedPosts: publishedCount || 0
      })
    } catch (error) {
      console.error('加载统计信息失败:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('加载用户失败:', error)
    }
  }

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          categories(*),
          profiles(username)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('加载文章失败:', error)
    }
  }

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

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          posts:post_id (title),
          profiles:user_id (username)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('加载评论失败:', error)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      loadUsers()
    } catch (error) {
      console.error('更新用户角色失败:', error)
    }
  }

  const updateCommentStatus = async (commentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status })
        .eq('id', commentId)

      if (error) throw error
      loadComments()
    } catch (error) {
      console.error('更新评论状态失败:', error)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      loadComments()
    } catch (error) {
      console.error('删除评论失败:', error)
    }
  }

  const savePost = async (postData: any) => {
    try {
      // 验证必填字段
      if (!postData.title || !postData.content) {
        setNotification({ type: 'error', message: '标题和内容不能为空' })
        return
      }

      // 处理分类ID，确保是有效的UUID或null
      const categoryId = postData.category_id && isValidUUID(postData.category_id) ? postData.category_id : null
      
      // 生成slug（将标题转换为URL友好的格式）
      const generateSlug = (title: string) => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 100)
      }
      
      let postId: string
      
      if (postData.id) {
        // 更新文章
        postId = postData.id
        const { error } = await supabase
          .from('posts')
          .update({
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt || '',
            category_id: categoryId,
            status: postData.status || 'draft',
            published_at: postData.status === 'published' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', postData.id)

        if (error) throw error
        setNotification({ type: 'success', message: '文章更新成功！' })
      } else {
        // 创建新文章
        const user = await supabase.auth.getUser()
        if (!user.data.user?.id) {
          throw new Error('用户未登录')
        }

        const slug = generateSlug(postData.title) + '-' + Date.now()

        const { data, error } = await supabase
          .from('posts')
          .insert({
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt || '',
            slug: slug,
            category_id: categoryId,
            status: postData.status || 'draft',
            published_at: postData.status === 'published' ? new Date().toISOString() : null,
            author_id: user.data.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (error) throw error
        postId = data.id
        setNotification({ type: 'success', message: '文章创建成功！' })
      }

      // 处理标签（如果有的话）
      if (postData.tags && postData.tags.length > 0) {
        await handlePostTags(postId, postData.tags)
      }

      setEditingPost(null)
      setIsCreating(false)
      loadPosts()
    } catch (error: any) {
      console.error('保存文章失败:', error)
      setNotification({ type: 'error', message: `保存失败: ${error.message}` })
    }
  }

  const handlePostTags = async (postId: string, tagNames: string[]) => {
    try {
      // 首先获取或创建标签
      const tagIds = []
      for (const tagName of tagNames) {
        if (tagName.trim()) {
          // 检查标签是否已存在
          const { data: existingTags } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName.trim())
            .limit(1)

          let tagId
          if (existingTags && existingTags.length > 0) {
            tagId = existingTags[0].id
          } else {
            // 创建新标签
            const slug = tagName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
            const { data: newTag } = await supabase
              .from('tags')
              .insert({
                name: tagName.trim(),
                slug: slug
              })
              .select('id')
              .single()
            tagId = newTag?.id || ''
          }
          tagIds.push(tagId)
        }
      }

      // 删除现有的文章标签关联
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId)

      // 创建新的文章标签关联
      if (tagIds.length > 0) {
        const tagInserts = tagIds.map(tagId => ({
          post_id: postId,
          tag_id: tagId
        }))

        const { error } = await supabase
          .from('post_tags')
          .insert(tagInserts)

        if (error) throw error
      }
    } catch (error) {
      console.error('处理标签失败:', error)
      // 不阻止文章保存，只是记录错误
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      loadPosts()
    } catch (error) {
      console.error('删除文章失败:', error)
    }
  }

  const startEditing = (post: any) => {
    // 确保使用正确的category_id字段，而不是joined的categories对象
    setEditingPost({
      ...post,
      category_id: post.category_id // 使用原始的category_id字段
    })
    setIsCreating(false)
  }

  const startCreating = () => {
    setEditingPost({
      title: '',
      content: '',
      excerpt: '',
      category_id: '',
      status: 'draft',
      tags: []
    })
    setIsCreating(true)
  }

  const cancelEditing = () => {
    setEditingPost(null)
    setIsCreating(false)
  }

  // 保存网站设置
  const saveSiteSettings = async () => {
    try {
      if (siteSettings) {
        await updateSiteSettings(siteSettings)
        setNotification({ type: 'success', message: '网站设置保存成功' })
        // 重新加载设置数据以同步到前端
        await refreshSettings()
      }
    } catch (error) {
      console.error('保存网站设置失败:', error)
      setNotification({ type: 'error', message: '保存网站设置失败' })
    }
  }

  // 保存评论设置
  const saveCommentSettings = async () => {
    try {
      if (commentSettings) {
        await updateCommentSettings(commentSettings)
        setNotification({ type: 'success', message: '评论设置保存成功' })
        // 重新加载设置数据以同步到前端
        await refreshSettings()
      }
    } catch (error) {
      console.error('保存评论设置失败:', error)
      setNotification({ type: 'error', message: '保存评论设置失败' })
    }
  }

  // 保存邮件设置
  const saveEmailSettings = async () => {
    try {
      if (emailSettings) {
        await updateEmailSettings(emailSettings)
        setNotification({ type: 'success', message: '邮件设置保存成功' })
        // 重新加载设置数据以同步到前端
        await refreshSettings()
      }
    } catch (error) {
      console.error('保存邮件设置失败:', error)
      setNotification({ type: 'error', message: '保存邮件设置失败' })
    }
  }

  // 保存安全设置
  const saveSecuritySettings = async () => {
    try {
      if (securitySettings) {
        await updateSecuritySettings(securitySettings)
        setNotification({ type: 'success', message: '安全设置保存成功' })
        // 重新加载设置数据以同步到前端
        await refreshSettings()
      }
    } catch (error) {
      console.error('保存安全设置失败:', error)
      setNotification({ type: 'error', message: '保存安全设置失败' })
    }
  }

  // 保存通用设置
  const saveGeneralSettings = async () => {
    try {
      await Promise.all([
        setSettingValue('posts_per_page', generalSettings.postsPerPage),
        setSettingValue('enable_rss', generalSettings.enableRss),
        setSettingValue('enable_sitemap', generalSettings.enableSitemap),
        setSettingValue('maintenance_mode', generalSettings.maintenanceMode),
        setSettingValue('custom_css', generalSettings.customCss),
        setSettingValue('custom_js', generalSettings.customJs)
      ])
      setNotification({ type: 'success', message: '通用设置保存成功' })
      // 重新加载设置数据以同步到前端
      await refreshSettings()
    } catch (error) {
      console.error('保存通用设置失败:', error)
      setNotification({ type: 'error', message: '保存通用设置失败' })
    }
  }

  // UUID验证函数
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3 },
    { id: 'posts', label: '文章管理', icon: FileText },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'comments', label: '评论审核', icon: MessageSquare },
    { id: 'settings', label: '系统设置', icon: Settings }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 通知 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`w-6 h-6 mr-3 ${
              notification.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {notification.type === 'success' ? (
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员面板</h1>
        <p className="text-gray-600">管理系统用户、内容和设置</p>
      </div>

      {/* 标签导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">系统概览</h2>
            
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{stats.users}</p>
                    <p className="text-blue-600">总用户数</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-green-600 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{stats.posts}</p>
                    <p className="text-green-600">总文章数</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center">
                  <MessageSquare className="w-8 h-8 text-purple-600 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900">{stats.comments}</p>
                    <p className="text-purple-600">总评论数</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-orange-600 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-orange-900">{stats.publishedPosts}</p>
                    <p className="text-orange-600">已发布文章</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">快速操作</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center space-x-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                  <Shield className="w-6 h-6 text-blue-600" />
                  <span>管理用户</span>
                </button>

                <button
                  onClick={() => setActiveTab('comments')}
                  className="flex items-center space-x-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                  <MessageSquare className="w-6 h-6 text-green-600" />
                  <span>审核评论</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center space-x-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                  <Settings className="w-6 h-6 text-purple-600" />
                  <span>系统设置</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">用户管理</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="subscriber">订阅者</option>
                          <option value="editor">编辑</option>
                          <option value="admin">管理员</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {/* 用户详情功能 */}}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">文章管理</h2>
              <button
                onClick={startCreating}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>新建文章</span>
              </button>
            </div>

            {isCreating || editingPost ? (
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {isCreating ? '新建文章' : '编辑文章'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">标题</label>
                    <input
                      type="text"
                      value={editingPost.title}
                      onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="输入文章标题"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">摘要</label>
                    <textarea
                      value={editingPost.excerpt}
                      onChange={(e) => setEditingPost({...editingPost, excerpt: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                      placeholder="输入文章摘要"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">内容</label>
                    <textarea
                      value={editingPost.content}
                      onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      rows={6}
                      placeholder="输入文章内容（支持Markdown）"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">分类</label>
                      <select
                        value={editingPost.category_id}
                        onChange={(e) => setEditingPost({...editingPost, category_id: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">选择分类</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">状态</label>
                      <select
                        value={editingPost.status}
                        onChange={(e) => setEditingPost({...editingPost, status: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="draft">草稿</option>
                        <option value="published">已发布</option>
                        <option value="archived">已归档</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">标签（逗号分隔）</label>
                    <input
                      type="text"
                      value={editingPost.tags?.join(', ')}
                      onChange={(e) => setEditingPost({...editingPost, tags: e.target.value.split(',').map(tag => tag.trim())})}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="例如：技术, React, 教程"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => savePost(editingPost)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作者</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {posts.map((post) => (
                      <tr key={post.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-gray-500">{post.excerpt}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {post.categories?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            post.status === 'published' ? 'bg-green-100 text-green-800' :
                            post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {post.status === 'published' ? '已发布' :
                             post.status === 'draft' ? '草稿' : '已归档'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {post.profiles?.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(post.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(post)}
                              className="text-blue-600 hover:text-blue-800"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="text-red-600 hover:text-red-800"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">评论审核</h2>
            
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">{comment.profiles?.username}</p>
                      <p className="text-sm text-gray-500">
                        评论于: {new Date(comment.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        文章: {comment.posts?.title}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      comment.status === 'approved' ? 'bg-green-100 text-green-800' :
                      comment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {comment.status === 'approved' ? '已通过' :
                       comment.status === 'rejected' ? '已拒绝' : '待审核'}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{comment.content}</p>
                  
                  <div className="flex space-x-2">
                    {comment.status !== 'approved' && (
                      <button
                        onClick={() => updateCommentStatus(comment.id, 'approved')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        通过
                      </button>
                    )}
                    {comment.status !== 'rejected' && (
                      <button
                        onClick={() => updateCommentStatus(comment.id, 'rejected')}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        拒绝
                      </button>
                    )}
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">系统设置</h2>
            
            {!siteSettings ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">加载设置中...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 基本设置 */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Globe className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium">基本设置</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">网站名称</label>
                      <input
                        type="text"
                        value={siteSettings?.site_name || ''}
                        onChange={(e) => siteSettings && setSiteSettings({...siteSettings, site_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="输入网站名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">网站URL</label>
                      <input
                        type="text"
                        value={siteSettings?.site_url || ''}
                        onChange={(e) => siteSettings && setSiteSettings({...siteSettings, site_url: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">网站描述</label>
                      <textarea
                        value={siteSettings?.site_description || ''}
                        onChange={(e) => siteSettings && setSiteSettings({...siteSettings, site_description: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        rows={3}
                        placeholder="输入网站描述"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Meta关键词</label>
                      <input
                        type="text"
                        value={siteSettings?.meta_keywords || ''}
                        onChange={(e) => siteSettings && setSiteSettings({...siteSettings, meta_keywords: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="关键词1, 关键词2, 关键词3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Meta描述</label>
                      <textarea
                        value={siteSettings?.meta_description || ''}
                        onChange={(e) => siteSettings && setSiteSettings({...siteSettings, meta_description: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        rows={2}
                        placeholder="搜索引擎描述"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Logo URL</label>
                      <input
                        type="text"
                        value={siteSettings?.logo_url || ''}
                        onChange={(e) => siteSettings && setSiteSettings({...siteSettings, logo_url: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Favicon URL</label>
                      <input
                        type="text"
                        value={siteSettings?.favicon_url || ''}
                        onChange={(e) => siteSettings && setSiteSettings({...siteSettings, favicon_url: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="https://example.com/favicon.ico"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">页脚文本</label>
                      <input
                        type="text"
                        value={siteSettings?.footer_text || ''}
                        onChange={(e) => siteSettings && setSiteSettings({...siteSettings, footer_text: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="页脚版权信息"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={saveSiteSettings}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存基本设置
                    </button>
                  </div>
                </div>

                {/* 评论设置 */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-medium">评论设置</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={commentSettings?.enable_comments || false}
                          onChange={(e) => commentSettings && setCommentSettings({...commentSettings, enable_comments: e.target.checked})}
                          className="mr-2"
                        />
                        <span>开启评论功能</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={commentSettings?.require_approval || false}
                          onChange={(e) => commentSettings && setCommentSettings({...commentSettings, require_approval: e.target.checked})}
                          className="mr-2"
                        />
                        <span>评论需要审核</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={commentSettings?.allow_anonymous || false}
                          onChange={(e) => commentSettings && setCommentSettings({...commentSettings, allow_anonymous: e.target.checked})}
                          className="mr-2"
                        />
                        <span>允许匿名评论</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={commentSettings?.enable_reply || false}
                          onChange={(e) => commentSettings && setCommentSettings({...commentSettings, enable_reply: e.target.checked})}
                          className="mr-2"
                        />
                        <span>允许回复评论</span>
                      </label>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">评论最小长度</label>
                        <input
                          type="number"
                          value={commentSettings?.min_length || 1}
                          onChange={(e) => commentSettings && setCommentSettings({...commentSettings, min_length: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border rounded"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">评论最大长度</label>
                        <input
                          type="number"
                          value={commentSettings?.max_length || 1000}
                          onChange={(e) => commentSettings && setCommentSettings({...commentSettings, max_length: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border rounded"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={saveCommentSettings}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存评论设置
                    </button>
                  </div>
                </div>

                {/* 邮件设置 */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Mail className="w-5 h-5 text-purple-600 mr-2" />
                    <h3 className="text-lg font-medium">邮件设置</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">SMTP服务器</label>
                      <input
                        type="text"
                        value={emailSettings?.smtp_host || ''}
                        onChange={(e) => emailSettings && setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SMTP端口</label>
                      <input
                        type="number"
                        value={emailSettings?.smtp_port || 587}
                        onChange={(e) => emailSettings && setEmailSettings({...emailSettings, smtp_port: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SMTP用户名</label>
                      <input
                        type="text"
                        value={emailSettings?.smtp_username || ''}
                        onChange={(e) => emailSettings && setEmailSettings({...emailSettings, smtp_username: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SMTP密码</label>
                      <input
                        type="password"
                        value={emailSettings?.smtp_password || ''}
                        onChange={(e) => emailSettings && setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="输入密码"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">发件人邮箱</label>
                      <input
                        type="email"
                        value={emailSettings?.from_email || ''}
                        onChange={(e) => emailSettings && setEmailSettings({...emailSettings, from_email: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="noreply@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">发件人名称</label>
                      <input
                        type="text"
                        value={emailSettings?.from_name || ''}
                        onChange={(e) => emailSettings && setEmailSettings({...emailSettings, from_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="网站名称"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={emailSettings?.enable_ssl || false}
                          onChange={(e) => emailSettings && setEmailSettings({...emailSettings, enable_ssl: e.target.checked})}
                          className="mr-2"
                        />
                        <span>启用SSL</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={emailSettings?.enable_notifications || false}
                          onChange={(e) => emailSettings && setEmailSettings({...emailSettings, enable_notifications: e.target.checked})}
                          className="mr-2"
                        />
                        <span>启用邮件通知</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={emailSettings?.new_comment_notification || false}
                          onChange={(e) => emailSettings && setEmailSettings({...emailSettings, new_comment_notification: e.target.checked})}
                          className="mr-2"
                        />
                        <span>新评论通知</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={emailSettings?.user_registration_notification || false}
                          onChange={(e) => emailSettings && setEmailSettings({...emailSettings, user_registration_notification: e.target.checked})}
                          className="mr-2"
                        />
                        <span>用户注册通知</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={saveEmailSettings}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存邮件设置
                    </button>
                  </div>
                </div>

                {/* 安全设置 */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Shield className="w-5 h-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-medium">安全设置</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securitySettings?.enable_registration || false}
                          onChange={(e) => securitySettings && setSecuritySettings({...securitySettings, enable_registration: e.target.checked})}
                          className="mr-2"
                        />
                        <span>允许用户注册</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securitySettings?.require_email_verification || false}
                          onChange={(e) => securitySettings && setSecuritySettings({...securitySettings, require_email_verification: e.target.checked})}
                          className="mr-2"
                        />
                        <span>需要邮箱验证</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securitySettings?.enable_captcha || false}
                          onChange={(e) => securitySettings && setSecuritySettings({...securitySettings, enable_captcha: e.target.checked})}
                          className="mr-2"
                        />
                        <span>启用验证码</span>
                      </label>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">密码最小长度</label>
                        <input
                          type="number"
                          value={securitySettings?.password_min_length || 8}
                          onChange={(e) => securitySettings && setSecuritySettings({...securitySettings, password_min_length: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border rounded"
                          min="6"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">会话超时（秒）</label>
                        <input
                          type="number"
                          value={securitySettings?.session_timeout || 3600}
                          onChange={(e) => securitySettings && setSecuritySettings({...securitySettings, session_timeout: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border rounded"
                          min="300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">最大登录尝试次数</label>
                        <input
                          type="number"
                          value={securitySettings?.max_login_attempts || 5}
                          onChange={(e) => securitySettings && setSecuritySettings({...securitySettings, max_login_attempts: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border rounded"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={saveSecuritySettings}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存安全设置
                    </button>
                  </div>
                </div>

                {/* 通用设置 */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                    <h3 className="text-lg font-medium">通用设置</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">每页文章数量</label>
                      <input
                        type="number"
                        value={generalSettings?.postsPerPage || 10}
                        onChange={(e) => setGeneralSettings({...generalSettings, postsPerPage: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded"
                        min="1"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={generalSettings?.enableRss || false}
                          onChange={(e) => setGeneralSettings({...generalSettings, enableRss: e.target.checked})}
                          className="mr-2"
                        />
                        <span>启用RSS订阅</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={generalSettings?.enableSitemap || false}
                          onChange={(e) => setGeneralSettings({...generalSettings, enableSitemap: e.target.checked})}
                          className="mr-2"
                        />
                        <span>启用站点地图</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={generalSettings?.maintenanceMode || false}
                          onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
                          className="mr-2"
                        />
                        <span>维护模式</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={saveGeneralSettings}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存通用设置
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}