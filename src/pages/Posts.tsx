import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, User, Eye, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import SearchBar from '../components/SearchBar'

export default function Posts() {
  const [posts, setPosts] = useState<any[]>([])
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username),
          categories:category_id (name, slug)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
      setFilteredPosts(data || [])
    } catch (error: any) {
      console.error('加载文章失败:', error)
      setError(error.message || '加载文章失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredPosts(posts)
      setCurrentPage(1)
      return
    }

    const searchQuery = query.toLowerCase()
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(searchQuery) ||
      post.content.toLowerCase().includes(searchQuery) ||
      post.excerpt?.toLowerCase().includes(searchQuery) ||
      post.profiles?.username.toLowerCase().includes(searchQuery) ||
      post.categories?.name.toLowerCase().includes(searchQuery)
    )
    
    setFilteredPosts(filtered)
    setCurrentPage(1)
  }

  // 分页计算
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPosts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">加载失败</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPosts}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          文章列表
        </h1>
        <p className="text-gray-600 text-lg">探索精彩的技术文章和心得体会</p>
      </div>

      {/* 搜索栏 */}
      <div className="flex justify-center mb-8">
        <SearchBar onSearch={handleSearch} placeholder="搜索文章标题、内容或作者..." />
      </div>

      {/* 文章列表 */}
      <div className="grid gap-6">
        {currentItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">
              {posts.length === 0 ? '暂无文章' : '没有找到相关文章'}
            </p>
          </div>
        ) : (
          currentItems.map((post) => (
            <article key={post.id} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* 文章封面 - 左侧图片 */}
                <div className="lg:w-80 flex-shrink-0">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-xl shadow-lg"
                    />
                  ) : (
                    <img
                      src={`https://picsum.photos/400/300?random=${post.id}`}
                      alt={post.title}
                      className="w-full h-40 object-cover rounded-xl shadow-lg"
                      loading="lazy"
                    />
                  )}
                </div>
                
                {/* 文章内容 - 右侧文字 */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* 分类标签 */}
                    {post.categories && (
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-medium rounded-full mb-3 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
                        {post.categories.name}
                      </span>
                    )}
                    
                    {/* 标题 */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-primary-600 transition-colors">
                      <Link to={`/post/${post.id}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h2>
                    
                    {/* 摘要 */}
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  
                  {/* 元信息 */}
                  <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{post.profiles?.username || '未知作者'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">
                        {new Date(post.published_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-12 space-x-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一页
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`w-10 h-10 flex items-center justify-center border rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            下一页
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {/* 分页信息 */}
      {filteredPosts.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          显示 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredPosts.length)} 条，共 {filteredPosts.length} 篇文章
        </div>
      )}
    </div>
  )
}