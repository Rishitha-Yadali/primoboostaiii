import React from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Headphones,
  Globe,
  Star,
  Zap,
  Award,
  Heart,
  CheckCircle
} from 'lucide-react';

export const Contact: React.FC = () => {
  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Support',
      details: 'support@primoboost.ai',
      description: 'Get help within 24 hours',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Phone Support',
      details: '+91 98765 43210',
      description: 'Mon-Fri, 9 AM - 6 PM IST',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Live Chat',
      details: 'Available 24/7',
      description: 'Instant support via chat',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Founded',
      details: 'Launched in 2025',
      description: 'First in India',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const faqs = [
    {
      question: 'How does the AI resume optimization work?',
      answer: 'Our AI analyzes your resume against job descriptions, identifies gaps, and suggests improvements for better ATS compatibility and recruiter appeal.'
    },
    {
      question: 'Is my data secure and private?',
      answer: 'Yes, we use enterprise-grade security measures. Your data is encrypted and never shared with third parties. You can delete your data anytime.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We support PDF, DOCX, and TXT files for upload. You can export your optimized resume in both PDF and Word formats.'
    },
    {
      question: 'Can I get a refund if not satisfied?',
      answer: 'We offer a 7-day money-back guarantee. If you\'re not satisfied with the results, contact us for a full refund.'
    },
    {
      question: 'Do you offer bulk discounts for teams?',
      answer: 'Yes, we have special pricing for teams and organizations. Contact our sales team for custom enterprise solutions.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Get in Touch
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                We're Here to Help
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 leading-relaxed">
              Have questions about our AI resume optimization? Need support? We'd love to hear from you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <span className="text-lg font-semibold">⚡ Average response time: 2 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primoboost Unique Value Proposition */}
      <div className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg md:w-1/3">
                  <div className="text-center">
                    <Heart className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">India's First</h3>
                    <p className="text-blue-100">Affordable AI Resume Builder</p>
                    <div className="mt-4 text-3xl font-bold">₹9</div>
                    <p className="text-sm text-blue-100">starting price per response</p>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Made in India, For Indians
                  </h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    At Primoboost, we're proud to say we are the first in India to introduce an AI-based JD-to-Resume Generator at this low and affordable pricing. While most foreign platforms like Rezi, Kickresume, Zety, and others charge in dollars or high monthly fees, we built Primoboost to make AI resume building accessible for every Indian student and job seeker.
                  </p>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    Where others charge ₹2000+ per month or ₹500 per resume, we're giving you plans starting at just ₹9 per response. No subscription traps. No unnecessary features. Just pure AI-powered, ATS-friendly, job-winning resumes—all at a price point that fits every student's budget.
                  </p>
                  <p className="font-semibold text-blue-700">
                    Our goal is simple: Give more, charge less, and help more Indians land interviews faster.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Multiple Ways to Reach Us</h2>
              <p className="text-xl text-gray-600">Choose the method that works best for you</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="group">
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 h-full border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className={`bg-gradient-to-r ${info.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {info.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
                    <p className="text-blue-600 font-semibold mb-2">{info.details}</p>
                    <p className="text-gray-600 text-sm">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Developer Info */}
      <div className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl md:w-1/3">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                      WO
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">WorthyOne</h3>
                    <p className="text-purple-600 font-medium">Developer</p>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    One Developer, Complete Solution
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Primoboost was built by a single developer who believes in creating affordable, high-quality tools for Indian students and professionals. Launched in 2025, we're committed to continuous improvement and feature updates.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-gray-700">All-in-one resume optimization platform</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Made in India, for Indians</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-gray-700">More updates and features coming soon</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Stay tuned for exciting new capabilities</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">Frequently Asked Questions</h2>
                <p className="text-gray-600 text-center">Quick answers to common questions</p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                        <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                        </div>
                        {faq.question}
                      </h3>
                      <p className="text-gray-700 leading-relaxed ml-9">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Why Choose Our Support?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">2hrs</div>
                    <div className="text-blue-100 text-sm">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">98%</div>
                    <div className="text-blue-100 text-sm">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">24/7</div>
                    <div className="text-blue-100 text-sm">Availability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">5★</div>
                    <div className="text-blue-100 text-sm">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Office Hours */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Office Hours & Support</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Business Hours</h3>
                <p className="text-gray-700">Monday - Friday<br />9:00 AM - 6:00 PM IST</p>
              </div>
              
              <div className="group">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Emergency Support</h3>
                <p className="text-gray-700">Critical issues<br />Available 24/7</p>
              </div>
              
              <div className="group">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Global Coverage</h3>
                <p className="text-gray-700">Serving customers<br />in 100+ countries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};