import { supabase } from '../lib/supabase'

/**
 * 检查并创建 Supabase Storage 存储桶
 */
export const createStorageBucket = async (bucketName: string) => {
  try {
    // 检查存储桶是否已存在
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)

    if (!bucketExists) {
      // 创建存储桶
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // 设为公开访问
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
      })

      if (error) {
        console.error(`创建存储桶 ${bucketName} 失败:`, error)
        return false
      }

      console.log(`存储桶 ${bucketName} 创建成功`)
      
      // 设置存储桶为公开访问
      const { error: policyError } = await supabase.storage
        .from(bucketName)
        .createSignedUrls(['*'], 3600 * 24 * 365 * 10) // 10年有效期
      
      if (policyError) {
        console.error(`设置存储桶 ${bucketName} 公开访问失败:`, policyError)
      }
      
      return true
    } else {
      console.log(`存储桶 ${bucketName} 已存在`)
      
      // 检查存储桶权限
      const { data: bucketData } = await supabase.storage.getBucket(bucketName)
      console.log(`存储桶 ${bucketName} 权限信息:`, bucketData)
      
      return true
    }
  } catch (error) {
    console.error('检查/创建存储桶时出错:', error)
    return false
  }
}

/**
 * 初始化存储桶
 */
export const initializeStorage = async () => {
  const buckets = ['images']
  
  for (const bucket of buckets) {
    await createStorageBucket(bucket)
  }
}

/**
 * 上传图片到 Supabase Storage
 */
export const uploadImage = async (file: File, folder: string = 'blog-images') => {
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
      throw uploadError
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
        } else {
          console.log('获取签名URL成功:', signedData.signedUrl)
          return {
            success: true,
            url: signedData.signedUrl,
            path: filePath
          }
        }
      }
    } catch (fetchError) {
      console.error('图片URL可访问性检查失败:', fetchError)
    }

    return {
      success: true,
      url: publicUrl,
      path: filePath
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    return {
      success: false,
      error: error.message || '上传失败，请重试'
    }
  }
}

/**
 * 从 Supabase Storage 删除图片
 */
export const deleteImage = async (imageUrl: string) => {
  try {
    // 从URL中提取文件路径
    const url = new URL(imageUrl)
    const pathSegments = url.pathname.split('/')
    
    // 找到"public"段的位置，文件路径在它之后
    const publicIndex = pathSegments.indexOf('public')
    
    if (publicIndex !== -1 && pathSegments[publicIndex + 1] === 'images') {
      // 提取文件路径 (从bucket名称之后的部分)
      const filePath = pathSegments.slice(publicIndex + 2).join('/')
      
      // 从Supabase Storage中删除文件
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath])

      if (error) throw error
      
      return {
        success: true
      }
    } else {
      throw new Error('无效的图片URL格式')
    }
  } catch (error: any) {
    console.error('删除图片失败:', error)
    return {
      success: false,
      error: error.message || '删除图片失败'
    }
  }
}