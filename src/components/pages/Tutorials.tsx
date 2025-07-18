import React, { useState } from 'react';
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Video, 
  FileText, 
  Download,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Zap,
  Award,
  Search,
  Filter,
  Calendar,
  Bell,
  X
} from 'lucide-react';

export const Tutorials: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);

  const categories = [
    { id: 'all', name: 'All Tutorials', count: 1 },
    { id: 'getting-started', name: 'Getting Started', count: 1 }
  ];

  const tutorials = [
    {
      id: 1,
      title: 'Getting Started with PrimoBoost AI',
      description: 'Learn the basics of uploading your resume and getting your first optimization.',
      duration: '5:30',
      difficulty: 'Beginner',
      category: 'getting-started',
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '12.5K',
      rating: 4.9,
      videoUrl: '#',
      isPopular: true
    }
  ];

  const guides = [
    {
      title: 'Complete Resume Optimization Guide',
      description: 'A comprehensive 50-page guide covering everything from basics to advanced techniques.',
      type: 'PDF Guide',
      pages: 50,
      downloads: '25K+',
      icon: <FileText className="w-6 h-6" />
    }
  ];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
      {/* Main Content with Blur Effect */}
      <div className={showOverlay ? "filter blur-sm" : ""}>
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-700 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-20 sm:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Learn & Master
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Resume Optimization
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-purple-100 mb-8 leading-relaxed">
                Watch our tutorial video to learn how to create the perfect resume and land your dream job.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                  <span className="text-lg font-semibold">🎥 Video Tutorial</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                  <span className="text-lg font-semibold">📚 Free Resources</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Tutorial */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Video Tutorial</h2>
                <p className="text-xl text-gray-600">Learn how to use PrimoBoost AI to optimize your resume</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 relative">
                  <div className="w-full h-0 pb-[56.25%] relative bg-gray-200">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="w-10 h-10 text-gray-600 ml-1" />
                        </div>
                        <p className="text-gray-600 font-medium">Click to play tutorial video</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        Beginner
                      </span>
                      <span className="text-gray-500 text-sm flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        5:30
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <span className="ml-1 text-gray-700 font-medium">4.9</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Getting Started with PrimoBoost AI
                  </h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    In this comprehensive tutorial, you'll learn how to upload your resume, optimize it for specific job descriptions, and export it in various formats. We'll cover all the essential features of PrimoBoost AI to help you create a resume that stands out to both ATS systems and human recruiters.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg text-blue-800 text-sm font-medium flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      12.5K views
                    </div>
                    <div className="bg-purple-50 px-4 py-2 rounded-lg text-purple-800 text-sm font-medium flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Beginner friendly
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-lg text-green-800 text-sm font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Updated for 2025
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free Resources */}
        <div className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Free Resources</h2>
                <p className="text-xl text-gray-600">Download our comprehensive guide</p>
              </div>

              <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
                {guides.map((guide, index) => (
                  <div key={index} className="group">
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 p-8">
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 text-purple-600">
                          {guide.icon}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{guide.title}</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">{guide.description}</p>
                        
                        <div className="flex justify-center space-x-6 mb-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{guide.pages} pages</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download className="w-4 h-4" />
                            <span>{guide.downloads}</span>
                          </div>
                        </div>
                        
                        <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                          <Download className="w-5 h-5" />
                          <span>Download Free</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Path */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Recommended Learning Path</h2>
                <p className="text-xl text-gray-600">Follow this structured path for best results</p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: 'Start with Basics',
                    description: 'Learn how to upload your resume and understand the optimization process',
                    duration: '15 minutes',
                    icon: <Lightbulb className="w-6 h-6" />
                  },
                  {
                    step: 2,
                    title: 'Master ATS Optimization',
                    description: 'Understand how ATS systems work and optimize your resume accordingly',
                    duration: '30 minutes',
                    icon: <Target className="w-6 h-6" />
                  },
                  {
                    step: 3,
                    title: 'Advanced Techniques',
                    description: 'Learn keyword optimization, formatting, and industry-specific tips',
                    duration: '45 minutes',
                    icon: <Zap className="w-6 h-6" />
                  },
                  {
                    step: 4,
                    title: 'Practice & Perfect',
                    description: 'Apply your knowledge and create multiple optimized versions',
                    duration: '60 minutes',
                    icon: <Award className="w-6 h-6" />
                  }
                ].map((item, index) => (
                  <div key={index} className="group">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-6">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {item.step}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-purple-600">
                              {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                              {item.duration}
                            </span>
                          </div>
                          <p className="text-gray-700">{item.description}</p>
                        </div>
                        
                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-gradient-to-r from-purple-600 to-blue-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Start Learning?</h2>
              <p className="text-xl text-purple-100 mb-8">
                Join thousands of professionals who have transformed their careers with our tutorials.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-purple-600 font-bold py-4 px-8 rounded-2xl hover:bg-gray-100 transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                  Start Learning Now
                </button>
                <button className="border-2 border-white text-white font-bold py-4 px-8 rounded-2xl hover:bg-white hover:text-purple-600 transition-colors duration-300">
                  Download Free Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Soon Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto text-center p-8 border border-gray-200 relative">
            {/* Close Button */}
            <button 
              onClick={() => setShowOverlay(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Icon */}
            <div className="bg-gradient-to-br from-orange-100 to-yellow-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar className="w-10 h-10 text-orange-600" />
            </div>
            
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Tutorials Coming Soon!
            </h2>
            
            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              We're working hard to create comprehensive video tutorials for you. Our team is preparing high-quality content to help you master resume optimization.
            </p>
            
            {/* Features List */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mb-6">
              <div className="text-left space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Step-by-step video guides</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>ATS optimization techniques</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Industry-specific tips</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Real-world examples</span>
                </div>
              </div>
            </div>
            
            {/* Notification Button */}
            <button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4">
              <Bell className="w-5 h-5" />
              <span>Notify Me When Ready</span>
            </button>
            
            {/* Timeline */}
            <div className="text-sm text-gray-500">
              <span className="font-medium">Expected Launch:</span> Coming Soon
            </div>
            
            {/* Close hint */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Click the X or outside this box to explore other features
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};