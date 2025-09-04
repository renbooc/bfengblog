import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { initializeStorage } from '../utils/storage'
import { Upload, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  onImageUpload: (url: string) => void
  onImageRemove?: (url: string) => void
  folder?: string
  maxSize?: number
  className?: string
}

export default function ImageUpload({ 
  onImageUpload, 
  onImageRemove,
  folder = 'blog-images',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [error, setError] = useState('')
  const [bucketInitialized, setBucketInitialized] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化存储桶
  useEffect(() => {
    const initStorage = async () => {
      try {
        await initializeStorage()
        setBucketInitialized(true)
      } catch (error) {
        console.error('初始化存储失败:', error)
        setError('存储初始化失败，请刷新页面重试')
      }
    }

    initStorage()
  }, [])

  const validateFile = (file: File): boolean => {
    setError('')

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setError('请选择 JPEG、PNG、GIF、WebP 或 SVG 格式的图片')
      return false
    }

    // 检查文件大小
    if (file.size > maxSize) {
      setError(`图片大小不能超过 ${maxSize / 1024 / 1024}MB`)
      return false
    }

    return true
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!validateFile(file)) return

    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 自动开始上传
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    if (!bucketInitialized) {
      setError('存储桶未初始化，请稍候再试')
      return
    }

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      // 生成唯一文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      console.log('开始上传图片:', { fileName, filePath, folder })

      // 上传到 Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Supabase 上传错误:', uploadError)
        
        // 如果存储桶不存在，尝试创建
        if (uploadError.message.includes('bucket not found') || uploadError.message.includes('The resource was not found')) {
          console.log('尝试创建存储桶...')
          const { createStorageBucket } = await import('../utils/storage')
          await createStorageBucket('images')
          
          // 重试上传
          const { error: retryError, data: retryData } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })
            
          if (retryError) {
            console.error('重试上传失败:', retryError)
            throw retryError
          }
          
          console.log('重试上传成功:', retryData)
        } else {
          throw uploadError
        }
      }

      console.log('上传成功:', data)

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      console.log('获取公开URL:', publicUrl)

      // 验证URL是否可访问
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' })
        console.log('图片URL可访问性检查:', { status: response.status, ok: response.ok })
        
        // 如果公开URL不可访问，尝试获取签名URL
        if (!response.ok) {
          console.log('公开URL不可访问，尝试获取签名URL')
          const { data: signedData, error: signedError } = await supabase.storage
            .from('images')
            .createSignedUrl(filePath, 3600 * 24 * 7) // 7天有效期
          
          if (signedError) {
            console.error('获取签名URL失败:', signedError)
            onImageUpload(publicUrl) // 即使签名URL失败，也返回公开URL
          } else {
            console.log('获取签名URL成功:', signedData.signedUrl)
            onImageUpload(signedData.signedUrl)
          }
        } else {
          onImageUpload(publicUrl)
        }
      } catch (fetchError) {
        console.error('图片URL可访问性检查失败:', fetchError)
        onImageUpload(publicUrl) // 即使检查失败，也返回公开URL
      }
      
      setPreviewUrl('')

    } catch (error: any) {
      console.error('上传失败:', error)
      setError(error.message || '上传失败，请重试')
      setPreviewUrl('')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (!validateFile(file)) return

      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      handleUpload(file)
    }
  }

  const handleClear = () => {
    setPreviewUrl('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = async (imageUrl: string) => {
    try {
      // 从URL中提取文件路径
      // Supabase公共URL格式: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<file-path>
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      
      // 找到"public"段的位置，文件路径在它之后
      const publicIndex = pathSegments.indexOf('public');
      
      if (publicIndex !== -1 && pathSegments[publicIndex + 1] === 'images') {
        // 提取文件路径 (从bucket名称之后的部分)
        const filePath = pathSegments.slice(publicIndex + 2).join('/');
        
        // 从Supabase Storage中删除文件
        const { error } = await supabase.storage
          .from('images')
          .remove([filePath]);

        if (error) throw error;
        
        // 通知父组件图片已被删除
        onImageRemove?.(imageUrl);
      }
    } catch (error: any) {
      console.error('删除图片失败:', error);
      setError(error.message || '删除图片失败');
    }
  }

  return (
    <div className={className}>
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300
          ${previewUrl 
            ? 'border-green-300 bg-green-50' 
            : uploading 
              ? 'border-blue-300 bg-blue-50' 
              : error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-blue-700">图片上传中...</p>
          </div>
        ) : previewUrl ? (
          <div className="space-y-3">
            <img
              src={previewUrl}
              alt="预览"
              className="w-16 h-16 object-cover rounded-lg mx-auto"
            />
            <p className="text-sm text-green-700">图片已选择，等待上传</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                点击或拖拽图片到此处
              </p>
              <p className="text-xs text-gray-500 mt-1">
                支持 JPG、PNG、GIF、WebP、SVG 格式，最大 {maxSize / 1024 / 1024}MB
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}