import { BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-float inline-block">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">探索</span> 
              <span className="text-gray-800 dark:text-white">知识与</span>
              <span className="gradient-text">灵感</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              在这里，技术与创意相遇，代码与文字共舞。记录我的编程旅程、生活感悟和无限可能
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="btn-primary">
                开始阅读
              </button>
              <button className="btn-secondary">
                了解更多
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              为什么选择
              <span className="gradient-text"> 我们的博客</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              精心打造的内容体验，让每一次阅读都成为享受
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 text-center group hover:shadow-2xl transition-all duration-500">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">💻</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                技术深度
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                深入浅出的技术文章，涵盖前沿开发技术和最佳实践
              </p>
            </div>

            <div className="card p-8 text-center group hover:shadow-2xl transition-all duration-500">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                视觉体验
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                优雅的界面设计，为阅读带来愉悦的视觉享受
              </p>
            </div>

            <div className="card p-8 text-center group hover:shadow-2xl transition-all duration-500">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                持续更新
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                定期分享最新内容，保持知识的新鲜度和实用性
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '100+', label: '技术文章', color: 'from-blue-500 to-cyan-500' },
              { number: '50+', label: '项目实战', color: 'from-purple-500 to-pink-500' },
              { number: '25k+', label: '读者订阅', color: 'from-green-500 to-teal-500' },
              { number: '99%', label: '满意程度', color: 'from-orange-500 to-red-500' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}