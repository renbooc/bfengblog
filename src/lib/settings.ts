import { supabase } from './supabase'
import type { 
  Setting, 
  SiteSettings, 
  CommentSettings, 
  EmailSettings, 
  SecuritySettings 
} from './supabase'

// 获取所有设置
export const getAllSettings = async (): Promise<Setting[]> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('category', { ascending: true })

  if (error) throw error
  return data || []
}

// 获取公开设置
export const getPublicSettings = async (): Promise<Setting[]> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('is_public', true)
    .order('category', { ascending: true })

  if (error) throw error
  return data || []
}

// 根据键获取设置
export const getSettingByKey = async (key: string): Promise<Setting | null> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', key)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// 更新设置
export const updateSetting = async (key: string, value: string): Promise<void> => {
  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) throw error
}

// 批量更新设置
export const updateSettings = async (settings: { key: string; value: string }[]): Promise<void> => {
  const updates = settings.map(({ key, value }) => ({
    key,
    value,
    updated_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('settings')
    .upsert(updates, { onConflict: 'key' })

  if (error) throw error
}

// 获取网站设置
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// 更新网站设置
export const updateSiteSettings = async (settings: Partial<SiteSettings>): Promise<void> => {
  const existingSettings = await getSiteSettings()
  
  if (existingSettings) {
    // 更新现有设置
    const { error } = await supabase
      .from('site_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', existingSettings.id)

    if (error) throw error
  } else {
    // 插入新设置
    const { error } = await supabase
      .from('site_settings')
      .insert([{ ...settings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])

    if (error) throw error
  }
}

// 获取评论设置
export const getCommentSettings = async (): Promise<CommentSettings | null> => {
  const { data, error } = await supabase
    .from('comment_settings')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// 更新评论设置
export const updateCommentSettings = async (settings: Partial<CommentSettings>): Promise<void> => {
  const existingSettings = await getCommentSettings()
  
  if (existingSettings) {
    // 更新现有设置
    const { error } = await supabase
      .from('comment_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', existingSettings.id)

    if (error) throw error
  } else {
    // 插入新设置
    const { error } = await supabase
      .from('comment_settings')
      .insert([{ ...settings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])

    if (error) throw error
  }
}

// 获取邮件设置
export const getEmailSettings = async (): Promise<EmailSettings | null> => {
  const { data, error } = await supabase
    .from('email_settings')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// 更新邮件设置
export const updateEmailSettings = async (settings: Partial<EmailSettings>): Promise<void> => {
  const existingSettings = await getEmailSettings()
  
  if (existingSettings) {
    // 更新现有设置
    const { error } = await supabase
      .from('email_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', existingSettings.id)

    if (error) throw error
  } else {
    // 插入新设置
    const { error } = await supabase
      .from('email_settings')
      .insert([{ ...settings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])

    if (error) throw error
  }
}

// 获取安全设置
export const getSecuritySettings = async (): Promise<SecuritySettings | null> => {
  const { data, error } = await supabase
    .from('security_settings')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// 更新安全设置
export const updateSecuritySettings = async (settings: Partial<SecuritySettings>): Promise<void> => {
  const existingSettings = await getSecuritySettings()
  
  if (existingSettings) {
    // 更新现有设置
    const { error } = await supabase
      .from('security_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', existingSettings.id)

    if (error) throw error
  } else {
    // 插入新设置
    const { error } = await supabase
      .from('security_settings')
      .insert([{ ...settings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])

    if (error) throw error
  }
}

// 获取设置值（带类型转换）
export const getSettingValue = async (key: string, defaultValue?: unknown): Promise<unknown> => {
  const setting = await getSettingByKey(key)
  if (!setting) return defaultValue

  switch (setting.type) {
    case 'number':
      return Number(setting.value)
    case 'boolean':
      return setting.value === 'true'
    case 'json':
      try {
        return JSON.parse(setting.value)
      } catch {
        return defaultValue
      }
    default:
      return setting.value
  }
}

// 设置值（带类型转换）
export const setSettingValue = async (key: string, value: unknown): Promise<void> => {
  const setting = await getSettingByKey(key)
  let stringValue: string

  if (setting) {
    switch (setting.type) {
      case 'number':
        stringValue = String(Number(value))
        break
      case 'boolean':
        stringValue = String(Boolean(value))
        break
      case 'json':
        stringValue = JSON.stringify(value)
        break
      default:
        stringValue = String(value)
    }
  } else {
    // 如果设置不存在，根据值类型推断类型
    if (typeof value === 'number') {
      stringValue = String(value)
    } else if (typeof value === 'boolean') {
      stringValue = String(value)
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value)
    } else {
      stringValue = String(value)
    }
  }

  await updateSetting(key, stringValue)
}