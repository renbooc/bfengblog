import React, { useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import Notification from './Notification'
import { useSettings } from '../contexts/SettingsContext'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { siteSettings, generalSettings } = useSettings()

  // 动态设置页面标题
  React.useEffect(() => {
    if (siteSettings?.site_name) {
      document.title = siteSettings.site_name
    }
  }, [siteSettings?.site_name])

  // 动态设置Meta描述
  React.useEffect(() => {
    if (siteSettings?.meta_description) {
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', siteSettings.meta_description)
    }
  }, [siteSettings?.meta_description])

  // 动态设置Meta关键词
  React.useEffect(() => {
    if (siteSettings?.meta_keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', siteSettings.meta_keywords)
    }
  }, [siteSettings?.meta_keywords])

  // 动态设置Favicon
  React.useEffect(() => {
    if (siteSettings?.favicon_url) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.setAttribute('rel', 'icon')
        document.head.appendChild(favicon)
      }
      favicon.setAttribute('href', siteSettings.favicon_url)
    }
  }, [siteSettings?.favicon_url])

  // 动态应用自定义CSS
  React.useEffect(() => {
    if (generalSettings?.customCss) {
      let customStyle = document.getElementById('custom-css')
      if (!customStyle) {
        customStyle = document.createElement('style')
        customStyle.setAttribute('id', 'custom-css')
        document.head.appendChild(customStyle)
      }
      customStyle.textContent = generalSettings.customCss
    }
  }, [generalSettings?.customCss])

  const handleLogout = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification />
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {siteSettings?.site_name && (
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                  {siteSettings.site_name}
                </h1>
              )}
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2">首页</a>
              <a href="/posts" className="text-gray-600 hover:text-gray-900 px-3 py-2">文章</a>
              <a href="/about" className="text-gray-600 hover:text-gray-900 px-3 py-2">关于</a>
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">欢迎, {user.user_metadata?.username || '用户'}!</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <a href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2">登录</a>
                  <a 
                    href="/register" 
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                  >
                    注册
                  </a>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isOpen && (
            <div className="md:hidden border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="/" className="block px-3 py-2 text-gray-600 hover:text-gray-900">首页</a>
                <a href="/posts" className="block px-3 py-2 text-gray-600 hover:text-gray-900">文章</a>
                <a href="/about" className="block px-3 py-2 text-gray-600 hover:text-gray-900">关于</a>
                
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-500">欢迎, {user.user_metadata?.username || '用户'}!</div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                    >
                      退出登录
                    </button>
                  </>
                ) : (
                  <>
                    <a href="/login" className="block px-3 py-2 text-gray-600 hover:text-gray-900">登录</a>
                    <a 
                      href="/register" 
                      className="block px-3 py-2 bg-primary-600 text-white rounded-md"
                    >
                      注册
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 冰風Blog</p>
          </div>
        </div>
      </footer>
    </div>
  )
}