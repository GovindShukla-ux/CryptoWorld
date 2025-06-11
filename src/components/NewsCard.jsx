import React, { useState } from 'react';
import { ExternalLink, Clock, User } from 'lucide-react';

export default function NewsCard({ article = {
  title: "Breaking: Revolutionary AI Technology Transforms Digital Landscape",
  url: "#",
  imageurl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
  body: "Scientists have developed a groundbreaking artificial intelligence system that promises to revolutionize how we interact with digital content. This breakthrough technology combines advanced machine learning algorithms with intuitive user interfaces to create unprecedented capabilities in data processing and analysis.",
  published_on: Math.floor(Date.now() / 1000) - 3600,
  source_info: {
    name: "TechNews Daily",
    img: "/api/placeholder/32/32"
  }
}}) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { title, url, imageurl, body, published_on, source_info } = article;

  const imageSrc = imageError || !imageurl 
    ? 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop' 
    : imageurl;
  
  const avatarSrc = source_info?.img
    ? `https://cryptocompare.com${source_info.img}`
    : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(source_info?.name || 'Unknown') + '&background=6366f1&color=fff';

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const publishedTime = timestamp * 1000;
    const diffInHours = Math.floor((now - publishedTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  return (
    <div 
      className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer transform hover:-translate-y-2 ${
        isHovered ? 'scale-[1.02]' : 'scale-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
    >
      
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
      
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        </div>

        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-gray-700 shadow-lg">
          News
        </div>
        
        <div className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <ExternalLink size={16} className="text-gray-700" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors duration-300">
          {title}
        </h3>

        {/* Body */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {body && body.length > 120 ? `${body.slice(0, 120)}...` : body}
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={avatarSrc}
                alt={source_info?.name || 'Source'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
                onError={(e) => {
                  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(source_info?.name || 'Unknown') + '&background=6366f1&color=fff';
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {source_info?.name || 'Unknown Source'}
              </p>
              <p className="text-xs text-gray-500 flex items-center">
                <User size={12} className="mr-1" />
                Verified Source
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center space-x-1 text-gray-500">
            <Clock size={14} />
            <span className="text-sm font-medium">
              {formatTimeAgo(published_on)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out" />
          </div>
          <span className="text-xs text-gray-400 font-medium">Read more</span>
        </div>
      </div>

      <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-0 transition-opacity duration-500" style={{
        background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899) border-box',
        border: '1px solid transparent'
      }} />
    </div>
  );
}