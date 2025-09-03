import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../contexts/NotificationContext'
import { MessageCircle, Send, User, Clock, Heart, Reply } from 'lucide-react'

interface Comment {
  id: string
  content: string
  status: string
  post_id: string
  user_id: string
  parent_id: string | null
  created_at: string
  updated_at: string
  profiles?: {
    username: string
    avatar_url?: string
  }
  replies?: Comment[]
  likes?: number
  user_liked?: boolean
}

interface CommentSystemProps {
  postId: string
}

export default function CommentSystem({ postId }: CommentSystemProps) {
  const auth = useAuth()
  const { user } = auth
    const { showNotification } = useNotification()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [commentSettings, setCommentSettings] = useState<{
    enable_comments: boolean
    require_approval: boolean
    allow_anonymous: boolean
    enable_reply: boolean
    min_length: number
    max_length: number
  } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      await loadComments()
      await loadCommentSettings()
    }
    loadData()
  }, [postId])

  const loadCommentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('comment_settings')
        .select('*')
        .single()

      if (error) {
        // 如果表不存在或没有数据，使用默认设置
        console.warn('评论设置加载失败，使用默认设置:', error)
        const defaultSettings = {
          enable_comments: true,
          require_approval: true,
          allow_anonymous: false,
          enable_reply: true,
          min_length: 1,
          max_length: 1000
        }
        setCommentSettings(defaultSettings)
        return
      }
      
      setCommentSettings(data)
    } catch (error: unknown) {
      console.error('加载评论设置失败:', error)
      // 出错时使用默认设置
      setCommentSettings({
        enable_comments: true,
        require_approval: true,
        allow_anonymous: false,
        enable_reply: true,
        min_length: 1,
        max_length: 1000
      })
    }
  }

  const loadComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles: user_id (username, avatar_url)
        `)
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })

      if (error) throw error

      // 构建评论树结构
      const commentTree = buildCommentTree(data || [])
      setComments(commentTree)
    } catch (error: unknown) {
      console.error('加载评论失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // 第一遍：创建所有评论的映射
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // 第二遍：构建树结构
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies!.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setCommentSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id,
          status: commentSettings?.require_approval ? 'pending' : 'approved'
        }])
        .select()
        .single()

      if (error) throw error

      if (data.status === 'approved') {
        // 如果评论自动通过审核，添加到评论列表
        const commentWithProfile = {
          ...data,
          profiles: {
            username: user.user_metadata?.username || '用户',
            avatar_url: user.user_metadata?.avatar_url
          },
          replies: []
        }
        setComments(prev => [commentWithProfile, ...prev])
      }

      setNewComment('')
      
      // 显示提示信息
      showNotification(data.status === 'approved' ? 'success' : 'info', data.status === 'approved' ? '评论发布成功！' : '评论已提交，等待审核通过后显示。')
    } catch (error: unknown) {
      console.error('提交评论失败:', error)
      showNotification('error', '评论提交失败，请重试。')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return

    setReplySubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          content: replyContent.trim(),
          post_id: postId,
          user_id: user.id,
          parent_id: parentId,
          status: commentSettings?.require_approval ? 'pending' : 'approved'
        }])
        .select()
        .single()

      if (error) throw error

      if (data.status === 'approved') {
        // 如果回复自动通过审核，重新加载评论
        await loadComments()
      }

      setReplyContent('')
      setReplyingTo(null)
      
      // 显示提示信息
      showNotification(data.status === 'approved' ? 'success' : 'info', data.status === 'approved' ? '回复发布成功！' : '回复已提交，等待审核通过后显示。')
    } catch (error: unknown) {
      console.error('提交回复失败:', error)
      showNotification('error', '回复提交失败，请重试。')
    } finally {
      setReplySubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('comment_likes')
        .insert([{
          comment_id: commentId,
          user_id: user.id
        }])

      if (error) {
        // 如果已经点赞，则取消点赞
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
      }

      // 重新加载评论以更新点赞数
      await loadComments()
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!commentSettings?.enable_comments) {
    // console.log('评论功能已关闭，设置:', commentSettings)
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>评论功能已关闭</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 评论标题 */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">
          评论 ({comments.length})
        </h2>
      </div>

      {/* 评论输入框 */}
      {/* {console.log('用户状态:', user)} */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.username || '用户'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                minLength={commentSettings?.min_length || 1}
                maxLength={commentSettings?.max_length || 1000}
                required
              />
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {newComment.length}/{commentSettings?.max_length || 1000}
                </span>
                <button
                  type="submit"
                  disabled={commentSubmitting || !newComment.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200 font-medium"
                >
                  <Send className="w-4 h-4" />
                  {commentSubmitting ? '提交中...' : '发布评论'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">请登录后发表评论</p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            登录
          </button>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">加载评论中...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">还没有评论，来发表第一个评论吧！</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={setReplyingTo}
              onLike={handleLikeComment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={handleReply}
              replySubmitting={replySubmitting}
              user={user}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  onReply: (id: string | null) => void
  onLike: (id: string) => void
  replyingTo: string | null
  replyContent: string
  setReplyContent: (content: string) => void
  onSubmitReply: (parentId: string) => void
  replySubmitting: boolean
  user: {
    id: string
    email?: string
    user_metadata?: {
      username?: string
      avatar_url?: string
    }
  } | null
  formatDate: (date: string) => string
}

function CommentItem({
  comment,
  onReply,
  onLike,
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  replySubmitting,
  user,
  formatDate
}: CommentItemProps) {
  const isReplying = replyingTo === comment.id

  return (
    <div className="space-y-4">
      {/* 评论内容 */}
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {comment.profiles?.avatar_url ? (
            <img
              src={comment.profiles.avatar_url}
              alt={comment.profiles.username || '用户'}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {comment.profiles?.username || '匿名用户'}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(comment.created_at)}
                </span>
              </div>
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">
              {comment.content}
            </div>
          </div>
          
          {/* 评论操作 */}
          <div className="flex items-center gap-4 mt-2">
            {user && (
              <>
                <button
                  onClick={() => onLike(comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span>{comment.likes || 0}</span>
                </button>
                <button
                  onClick={() => onReply(isReplying ? null : comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  <span>回复</span>
                </button>
              </>
            )}
          </div>

          {/* 回复输入框 */}
          {isReplying && user && (
            <div className="mt-4 flex gap-4">
              <div className="flex-shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.username || '用户'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`回复 @${comment.profiles?.username || '用户'}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onSubmitReply(comment.id)}
                    disabled={replySubmitting || !replyContent.trim()}
                    className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {replySubmitting ? '提交中...' : '发布回复'}
                  </button>
                  <button
                    onClick={() => onReply(null)}
                    className="px-3 py-1 text-gray-600 rounded text-sm hover:bg-gray-100"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-14 space-y-4">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={onSubmitReply}
              replySubmitting={replySubmitting}
              user={user}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}