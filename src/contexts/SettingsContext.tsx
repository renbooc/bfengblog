import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { 
  getSiteSettings, 
  getCommentSettings, 
  getEmailSettings, 
  getSecuritySettings,
  getSettingValue 
} from '../lib/settings'
import type { 
  SiteSettings, 
  CommentSettings, 
  EmailSettings, 
  SecuritySettings 
} from '../lib/supabase'

interface SettingsContextType {
  siteSettings: SiteSettings | null
  commentSettings: CommentSettings | null
  emailSettings: EmailSettings | null
  securitySettings: SecuritySettings | null
  generalSettings: {
    postsPerPage: number
    enableRss: boolean
    enableSitemap: boolean
    maintenanceMode: boolean
    customCss: string
    customJs: string
  }
  loading: boolean
  refreshSettings: () => Promise<void>
  setSiteSettings: (settings: SiteSettings) => void
  setCommentSettings: (settings: CommentSettings) => void
  setEmailSettings: (settings: EmailSettings) => void
  setSecuritySettings: (settings: SecuritySettings) => void
  setGeneralSettings: (settings: any) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [commentSettings, setCommentSettings] = useState<CommentSettings | null>(null)
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null)
  const [generalSettings, setGeneralSettings] = useState({
    postsPerPage: 10,
    enableRss: true,
    enableSitemap: true,
    maintenanceMode: false,
    customCss: '',
    customJs: ''
  })
  const [loading, setLoading] = useState(true)

  const loadSettings = async () => {
    setLoading(true)
    try {
      const [siteData, commentData, emailData, securityData] = await Promise.all([
        getSiteSettings(),
        getCommentSettings(),
        getEmailSettings(),
        getSecuritySettings()
      ])

      setSiteSettings(siteData)
      setCommentSettings(commentData)
      setEmailSettings(emailData)
      setSecuritySettings(securityData)

      // 加载通用设置
      const postsPerPage = await getSettingValue('posts_per_page', 10) as number
      const enableRss = await getSettingValue('enable_rss', true) as boolean
      const enableSitemap = await getSettingValue('enable_sitemap', true) as boolean
      const maintenanceMode = await getSettingValue('maintenance_mode', false) as boolean
      const customCss = await getSettingValue('custom_css', '') as string
      const customJs = await getSettingValue('custom_js', '') as string

      setGeneralSettings({
        postsPerPage,
        enableRss,
        enableSitemap,
        maintenanceMode,
        customCss,
        customJs
      })
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const value: SettingsContextType = {
    siteSettings,
    commentSettings,
    emailSettings,
    securitySettings,
    generalSettings,
    loading,
    refreshSettings: loadSettings,
    setSiteSettings,
    setCommentSettings,
    setEmailSettings,
    setSecuritySettings,
    setGeneralSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}