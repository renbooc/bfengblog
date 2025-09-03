import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  onImageUpload: (url: string) => void
  folder?: string
  maxSize?: number
  className?: string
}

export default function ImageUpload({ 
  onImageUpload, 
  folder = 'blog-images',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      // 生成唯一文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // 上传到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      onImageUpload(publicUrl)
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