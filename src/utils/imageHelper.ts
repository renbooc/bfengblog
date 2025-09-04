import { supabase } from '../lib/supabase'

/**
 * 验证图片URL是否可访问
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    })
    return response.ok
  } catch (error) {
    console.error('验证图片URL失败:', error)
    return false
  }
}

/**
 * 获取图片的签名URL（用于解决访问权限问题）
 */
export const getSignedImageUrl = async (path: string): Promise<string | null> => {
  try {
    console.log('尝试获取签名URL，文件路径:', path)
    const { data, error } = await supabase.storage
      .from('images')
      .createSignedUrl(path, 3600 * 24 * 7) // 7天有效期

    if (error) {
      console.error('获取签名URL失败:', error)
      return null
    }

    console.log('成功获取签名URL:', data.signedUrl)
    return data.signedUrl
  } catch (error) {
    console.error('获取签名URL异常:', error)
    return null
  }
}

/**
 * 处理图片URL，确保可访问
 */
export const processImageUrl = async (url: string): Promise<string> => {
  console.log('处理图片URL:', url)
  
  // 如果URL为空，直接返回
  if (!url) {
    console.log('URL为空，返回空字符串')
    return ''
  }
  
  // 如果URL已经是签名的，直接返回
  if (url.includes('?token=')) {
    console.log('URL已是签名URL')
    return url
  }

  // 首先尝试获取签名URL
  try {
    // 从URL中提取文件路径
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    
    // 找到images存储桶后的路径
    const imagesIndex = pathParts.indexOf('images')
    if (imagesIndex !== -1) {
      const filePath = pathParts.slice(imagesIndex + 1).join('/')
      console.log('提取的文件路径:', filePath)
      
      const signedUrl = await getSignedImageUrl(filePath)
      if (signedUrl) {
        console.log('使用签名URL:', signedUrl)
        return signedUrl
      }
    }
  } catch (error) {
    console.error('处理图片URL异常:', error)
  }

  // 如果获取签名URL失败，尝试直接访问
  const isAccessible = await validateImageUrl(url)
  if (isAccessible) {
    console.log('URL可直接访问')
    return url
  }

  // 如果所有方法都失败，返回原URL
  console.log('无法处理图片URL，返回原URL')
  return url
}

/**
 * 图片组件属性处理
 */
export const getImageProps = (src: string, alt: string) => {
  return {
    src,
    alt,
    onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      console.error('图片加载失败:', e)
      console.log('失败的图片URL:', src)
      
      // 尝试使用签名URL重新加载
      processImageUrl(src).then(processedUrl => {
        if (processedUrl !== src) {
          console.log('尝试使用处理后的URL重新加载:', processedUrl)
          e.currentTarget.src = processedUrl
        }
      })
    },
    onLoad: () => {
      console.log('图片加载成功:', src)
    }
  }
}