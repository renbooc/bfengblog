import { User, Code, Heart, Zap, Smartphone, Shield, MessageCircle, Calendar } from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "响应式设计",
      description: "支持移动端访问，提供一致的用户体验"
    },
    {
      icon: <User className="w-6 h-6" />,
      title: "用户系统",
      description: "完整的认证和授权机制，保障账户安全"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "互动功能",
      description: "评论和点赞系统，增强读者参与感"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "实时更新",
      description: "内容实时同步，第一时间获取最新动态"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "安全保障",
      description: "严格的权限控制，保护数据隐私"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "内容管理",
      description: "便捷的文章发布和管理功能"
    }
  ];

  const techStack = [
    {
      category: "前端技术",
      items: [
        { name: "React 18", level: "expert" },
        { name: "TypeScript", level: "expert" },
        { name: "TailwindCSS", level: "intermediate" },
        { name: "Vite", level: "intermediate" }
      ]
    },
    {
      category: "后端技术",
      items: [
        { name: "Supabase", level: "expert" },
        { name: "PostgreSQL", level: "intermediate" },
        { name: "Row Level Security", level: "intermediate" },
        { name: "实时订阅", level: "basic" }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面头部 */}
      <div className="text-center mb-16 mt-8">
        <h1 className="text-3xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          关于我们
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          一个基于现代技术栈构建的个人博客系统，致力于为读者提供优质的阅读体验和内容。
        </p>
      </div>

      {/* 博客简介 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 mb-16 border border-gray-100">
        <div className="flex items-start mb-6">
          <Heart className="w-8 h-8 text-red-500 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">博客简介</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              这是一个基于现代技术栈构建的个人博客系统，使用 React + TypeScript + Supabase 开发，
              致力于为读者提供优质的阅读体验和内容。我们专注于技术分享、生活记录和知识传播，
              希望通过这个平台与更多志同道合的朋友交流学习。
            </p>
          </div>
        </div>
      </div>

      {/* 技术栈 */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <Code className="w-8 h-8 text-blue-500 mr-3" />
            技术栈
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            我们采用现代化的技术架构，确保系统的高性能和可维护性
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {techStack.map((section, index) => (
            <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {section.category}
              </h3>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.level === 'expert' ? 'bg-green-100 text-green-800' :
                      item.level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.level === 'expert' ? '熟练' : item.level === 'intermediate' ? '中级' : '基础'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 功能特性 */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">功能特性</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            我们的博客系统具备丰富的功能，为用户提供完整的博客体验
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="text-blue-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 开发状态 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-blue-100">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">持续开发中</h2>
          <p className="text-gray-700 text-lg mb-6 max-w-2xl mx-auto">
            博客系统正在持续开发中，我们会不断添加新功能和优化用户体验。
            如果您有任何建议或反馈，欢迎随时联系我们！
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm">
              🚀 性能优化
            </div>
            <div className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm">
              🎨 界面升级
            </div>
            <div className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm">
              📱 移动端适配
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}