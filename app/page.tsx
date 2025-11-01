'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = (href: string) => {
    setNavigating(true);
    router.push(href);
  };

  const tools = [
    {
      title: 'Agent Visualizer',
      description: 'Visualize agent connections, enquiries, and properties in an interactive network graph',
      href: '/agent-visualizer',
      icon: '🕸️',
      color: 'from-blue-400 to-cyan-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50'
    },
    {
      title: 'Zone Analytics',
      description: 'Analyze agent activity across different zones with detailed insights and filtering options',
      href: '/zone-analytics',
      icon: '📊',
      color: 'from-purple-400 to-pink-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50'
    },
    {
      title: 'Price Analytics',
      description: 'View average property prices per agent with filters for resale and rental properties',
      href: '/price-analytics',
      icon: '💰',
      color: 'from-green-400 to-emerald-400',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50'
    }
  ];

  if (loading || navigating) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {loading ? 'Loading Dashboard...' : 'Opening Tool...'}
          </h2>
          <p className="text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Agent Analytics Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Comprehensive tools for analyzing agent performance and market insights
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tools.map((tool) => (
            <div
              key={tool.href}
              onClick={() => handleNavigation(tool.href)}
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 hover:border-transparent transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className={`absolute inset-0 ${tool.bgColor} opacity-50`} />
              
              <div className="relative p-8">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{tool.icon}</div>
                <h2 className="text-3xl font-bold text-gray-800 group-hover:text-white mb-3 transition-colors">
                  {tool.title}
                </h2>
                <p className="text-gray-600 group-hover:text-white text-lg transition-colors">
                  {tool.description}
                </p>
                
                <div className="mt-6 flex items-center text-gray-700 group-hover:text-white transition-colors">
                  <span className="font-semibold">Launch Tool</span>
                  <svg 
                    className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
