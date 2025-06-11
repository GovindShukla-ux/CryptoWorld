import React, { useState, useEffect, useMemo } from 'react';
import { Search, Globe, TrendingUp, Filter, ExternalLink, Star, Shield, Volume2, MapPin, Sparkles } from 'lucide-react';

const CryptoExchangeDirectory = () => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [sortBy, setSortBy] = useState('trust_score');
  const [viewMode, setViewMode] = useState('grid');
  const [error, setError] = useState(null);
  const [totalVolume, setTotalVolume] = useState(0);

  useEffect(() => {
    const fetchExchanges = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Fetching exchanges from CoinGecko API...');
        
        const response = await fetch('https://api.coingecko.com/api/v3/exchanges?per_page=115&page=1', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Raw API response:', data);

        const processedExchanges = data
          .filter(exchange => 
            exchange.trust_score !== null && 
            exchange.trade_volume_24h_btc !== null &&
            exchange.name &&
            exchange.country
          )
          .map((exchange, index) => ({
            id: exchange.id || `exchange-${index}`,
            name: exchange.name || 'Unknown Exchange',
            country: exchange.country || 'Unknown',
            trust_score: exchange.trust_score || 0,
            trust_score_rank: exchange.trust_score_rank || index + 1,
            trade_volume_24h_btc: exchange.trade_volume_24h_btc || 0,
            trade_volume_24h_normalized: exchange.trade_volume_24h_btc_normalized || 0,
            url: exchange.url || '#',
            image: exchange.image || `https://via.placeholder.com/48x48/667eea/ffffff?text=${(exchange.name || 'E').charAt(0)}`,
            year_established: exchange.year_established || null,
            description: exchange.description || `Professional cryptocurrency exchange based in ${exchange.country || 'Unknown location'}`,
            has_trading_incentive: exchange.has_trading_incentive || false
          }))
          .sort((a, b) => b.trust_score - a.trust_score || a.trust_score_rank - b.trust_score_rank);

        console.log('✅ Processed exchanges:', processedExchanges.length);
        
        const totalVol = processedExchanges.reduce((sum, ex) => sum + (ex.trade_volume_24h_normalized || 0), 0);
        setTotalVolume(totalVol);
        setExchanges(processedExchanges);
        
      } catch (error) {
        console.error('❌ Error fetching exchanges:', error);
        setError(error.message);
        setExchanges([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExchanges();
  }, []);

  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(exchanges.map(ex => ex.country))];
    return ['All Countries', ...uniqueCountries.sort()];
  }, [exchanges]);

  const filteredExchanges = useMemo(() => {
    let filtered = exchanges;
    
    if (searchTerm) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCountry !== 'All Countries') {
      filtered = filtered.filter(ex => ex.country === selectedCountry);
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'trust_score':
          return b.trust_score - a.trust_score || a.trust_score_rank - b.trust_score_rank;
        case 'volume':
          return b.trade_volume_24h_normalized - a.trade_volume_24h_normalized;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'year':
          return (b.year_established || 0) - (a.year_established || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [exchanges, searchTerm, selectedCountry, sortBy]);

  const formatVolume = (volume) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const getTrustScoreColor = (score) => {
    if (score >= 9) return 'text-emerald-600 bg-emerald-50';
    if (score >= 7) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrustScoreIcon = (score) => {
    if (score >= 9) return <Shield className="w-4 h-4" />;
    if (score >= 7) return <Star className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(247, 247, 247)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-700">Loading crypto exchanges from CoinGecko...</p>
            <p className="text-gray-600 text-sm mt-2">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(247, 247, 247)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-red-600 mb-4">
              <ExternalLink className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Exchanges</h3>
            <p className="text-gray-700 mb-6">
              Error: {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-white px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, rgb(102, 126, 234), rgb(118, 75, 162))' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(247, 247, 247)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Top Crypto Exchanges
            </h1>
          </div>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            Discover and compare the world's most trusted cryptocurrency exchanges ranked by trust score, volume, and reliability.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              {exchanges.length} Exchanges
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              24h Volume: {formatVolume(totalVolume)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exchanges..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Country Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="trust_score">Trust Score</option>
                <option value="volume">24h Volume</option>
                <option value="name">Name</option>
                <option value="year">Year Established</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 px-4 py-3 rounded-xl transition-all border ${
                  viewMode === 'grid' 
                    ? 'bg-purple-100 text-purple-700 border-purple-300' 
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 px-4 py-3 rounded-xl transition-all border ${
                  viewMode === 'list' 
                    ? 'bg-purple-100 text-purple-700 border-purple-300' 
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-6">
          <p className="text-gray-700">
            Showing <span className="font-semibold text-gray-900">{filteredExchanges.length}</span> exchanges
            {selectedCountry !== 'All Countries' && (
              <span> in <span className="font-semibold text-purple-600">{selectedCountry}</span></span>
            )}
          </p>
        </div>

        {/* Exchange Grid/List */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredExchanges.map((exchange, index) => (
            <div
              key={exchange.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={exchange.image}
                        alt={exchange.name}
                        className="w-12 h-12 rounded-xl border border-gray-200"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/48x48/667eea/ffffff?text=${exchange.name.charAt(0)}`;
                        }}
                      />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-700">#{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{exchange.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {exchange.country}
                        {exchange.year_established && (
                          <span className="text-gray-400">• Est. {exchange.year_established}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${getTrustScoreColor(exchange.trust_score)}`}>
                    {getTrustScoreIcon(exchange.trust_score)}
                    {exchange.trust_score}/10
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {exchange.description}
                </p>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">24h Volume</span>
                    <div className="flex items-center gap-1">
                      <Volume2 className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-900">
                        {formatVolume(exchange.trade_volume_24h_normalized || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trust Rank</span>
                    <span className="font-semibold text-gray-900">
                      #{exchange.trust_score_rank}
                    </span>
                  </div>

                  {exchange.has_trading_incentive && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-700">Has Trading Incentives</span>
                    </div>
                  )}
                </div>

                {/* Visit Button */}
                <a
                  href={exchange.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105 ${
                    exchange.url === '#' 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'text-white hover:opacity-90'
                  }`}
                  style={exchange.url !== '#' ? { background: 'linear-gradient(135deg, rgb(102, 126, 234), rgb(118, 75, 162))' } : {}}
                  onClick={exchange.url === '#' ? (e) => e.preventDefault() : undefined}
                >
                  {exchange.url === '#' ? 'Website Not Available' : 'Visit Exchange'}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredExchanges.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-500 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No exchanges found</h3>
            <p className="text-gray-700 mb-6">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCountry('All Countries');
                setSortBy('trust_score');
              }}
              className="text-white px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, rgb(102, 126, 234), rgb(118, 75, 162))' }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600 text-sm">
          <p>Data provided by CoinGecko API • Updated every 5 minutes</p>
          <p className="mt-1">Always verify exchange legitimacy before trading</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoExchangeDirectory;