import React, { useEffect, useState, Suspense, lazy, useCallback, useMemo } from 'react';
import axios from 'axios';
import millify from 'millify';
import numeral from 'numeral';
import { Row, Col, Typography, Spin, Alert, Card, Button, Modal, Tabs } from 'antd';
import CountUp from 'react-countup';
import debounce from 'lodash.debounce';

const { Title } = Typography;

const LineChart = lazy(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })));
const Cryptocurrencies = lazy(() => import('./Cryptocurrencies'));
const NewsCard = lazy(() => import('../components/NewsCard'));

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes for cache memory

const getCache = (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const { data, expiry } = JSON.parse(cached);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const setCache = (key, data) => {
  localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + CACHE_EXPIRY_MS }));
};

const styles = {
  cardBody: { 
    padding: 24, 
    cursor: 'pointer',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  statsCard: {
    padding: 24,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    border: 'none'
  },
  statsGrid: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    backdropFilter: 'blur(10px)'
  },
  chartContainer: { 
    width: '60%',
    height: 60
  },
  kpiChangePositive: { 
    color: '#52c41a',
    fontWeight: 600
  },
  kpiChangeNegative: { 
    color: '#ff4d4f',
    fontWeight: 600
  },
  buttonsWrapper: { 
    marginBottom: 24,
    display: 'flex',
    gap: 8
  },
  timeRangeButton: { 
    borderRadius: 20,
    fontWeight: 500
  },
  flexSpaceBetween: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16
  },
  coinCard: { 
    cursor: 'pointer', 
    padding: 16, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 12, 
    borderRadius: 8, 
    border: '1px solid #f0f0f0',
    marginBottom: 12,
    transition: 'all 0.2s ease',
  },
  coinImage: { 
    width: 40, 
    height: 40, 
    borderRadius: '50%',
    objectFit: 'cover'
  },
  coinName: { 
    fontWeight: 600, 
    fontSize: 16,
    marginBottom: 4
  },
  coinPrice: { 
    fontWeight: 500, 
    fontSize: 14, 
    color: '#666'
  },
  coinChangePositive: { 
    color: '#52c41a', 
    fontWeight: 600,
    fontSize: 14
  },
  coinChangeNegative: { 
    color: '#ff4d4f', 
    fontWeight: 600,
    fontSize: 14
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
    color: '#1a1a1a'
  },
  trendingCard: {
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0'
  }
};

const buttonStyle = {
  background: 'linear-gradient(135deg, rgb(102, 126, 234), rgb(118, 75, 162))',
  border: 'none',
  color: 'white'
};

export default function Home() {
  const [stats, setStats] = useState(null);
  const [marketChart, setMarketChart] = useState(null);
  const [volumeChart, setVolumeChart] = useState(null);
  const [statsErr, setStatsErr] = useState(null);
  const [news, setNews] = useState([]);
  const [newsErr, setNewsErr] = useState(null);
  const [timeRange, setTimeRange] = useState('1');
  const [retryFlag, setRetryFlag] = useState(0);

  const [trendingCoins, setTrendingCoins] = useState([]);
  const [topGainers, setTopGainers] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTabKey, setModalTabKey] = useState('market');
  // eslint-disable-next-line
  const debouncedSetTimeRange = useCallback(debounce((val) => setTimeRange(val), 300), []);

  const fetchStats = useCallback(async () => {
    const cached = getCache('globalStats');
    if (cached) {
      setStats(cached);
      setStatsErr(null);
      return;
    }
    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/global');
      setStats(res.data.data);
      setCache('globalStats', res.data.data);
      setStatsErr(null);
    } catch {
      setStatsErr('Failed to fetch global stats');
    }
  }, []);

  const fetchCharts = useCallback(async () => {
    const cacheKeyMarket = `btcMarketChart_${timeRange}`;
    const cacheKeyVolume = `btcVolumeChart_${timeRange}`;
    const cachedMarket = getCache(cacheKeyMarket);
    const cachedVolume = getCache(cacheKeyVolume);

    if (cachedMarket && cachedVolume) {
      setMarketChart(cachedMarket);
      setVolumeChart(cachedVolume);
      return;
    }

    try {
      const res = await axios.get(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: timeRange,
        },
      });

      const timestamps = res.data.market_caps.map(([time]) =>
        new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      const marketCapData = res.data.market_caps.map(([, value]) => value);
      const volumeData = res.data.total_volumes.map(([, value]) => value);

      const marketChartData = {
        labels: timestamps,
        datasets: [
          {
            label: 'Market Cap',
            data: marketCapData,
            borderColor: '#52c41a',
            backgroundColor: 'rgba(82, 196, 26, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 1,
            borderWidth: 2,
          },
        ],
      };

      const volumeChartData = {
        labels: timestamps,
        datasets: [
          {
            label: '24h Volume',
            data: volumeData,
            borderColor: '#1890ff',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 1,
            borderWidth: 2,
          },
        ],
      };

      setMarketChart(marketChartData);
      setVolumeChart(volumeChartData);
      setCache(cacheKeyMarket, marketChartData);
      setCache(cacheKeyVolume, volumeChartData);
    } catch (error) {
      setMarketChart(null);
      setVolumeChart(null);
      console.error('Error fetching charts:', error);
    }
  }, [timeRange]);

  const fetchNews = useCallback(async () => {
    const cached = getCache('cryptoNews');
    if (cached) {
      setNews(cached);
      setNewsErr(null);
      return;
    }
    try {
      const res = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
      const slicedNews = res.data.Data.slice(0, 6);
      setNews(slicedNews);
      setCache('cryptoNews', slicedNews);
      setNewsErr(null);
    } catch {
      setNewsErr('Failed to fetch news');
    }
  }, []);


const fetchTopMovers = useCallback(async () => {
  const cacheKeyTrending = 'trendingCoins';
  const cacheKeyGainers = 'topGainers';
  
  const cachedTrending = getCache(cacheKeyTrending);
  const cachedGainers = getCache(cacheKeyGainers);
  
  if (cachedTrending && cachedGainers) {
    setTrendingCoins(cachedTrending);
    setTopGainers(cachedGainers);
    return;
  }

  try {
    console.log('Starting API calls...');


    const axiosConfig = {
      timeout: 15000, // 15 seconds
      headers: {
        'Accept': 'application/json',
      }
    };

    console.log('Fetching trending coins...');
    const trendingRes = await axios.get(
      'https://api.coingecko.com/api/v3/search/trending',
      axiosConfig
    );

    const trendingCoinsData = trendingRes.data.coins.slice(0, 3).map(coin => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol,
      image: coin.item.large || coin.item.thumb,
      market_cap_rank: coin.item.market_cap_rank,
      // Note: trending endpoint doesn't include price data
      current_price: null,
      price_change_percentage_24h: null
    }));

    console.log('Trending coins processed:', trendingCoinsData);

    const trendingIds = trendingCoinsData.map(coin => coin.id).join(',');
    console.log('Fetching price data for trending coins...');
    
    const trendingPricesRes = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        ...axiosConfig,
        params: {
          ids: trendingIds,
          vs_currencies: 'usd',
          include_24hr_change: true
        }
      }
    );

    // Merge price data with trending coins
    const trendingWithPrices = trendingCoinsData.map(coin => ({
      ...coin,
      current_price: trendingPricesRes.data[coin.id]?.usd || 0,
      price_change_percentage_24h: trendingPricesRes.data[coin.id]?.usd_24h_change || 0
    }));

    console.log('Trending with prices:', trendingWithPrices);

    console.log('Fetching top gainers...');
    const gainersRes = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets',
      {
        ...axiosConfig,
        params: {
          vs_currency: 'usd',
          order: 'price_change_percentage_24h_desc',
          per_page: 20,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        }
      }
    );

    const topGainersData = gainersRes.data
      .filter(coin => 
        coin.price_change_percentage_24h > 5 && // At least 5% gain
        coin.total_volume > 50000 && // Minimum volume
        coin.market_cap > 1000000 && // Minimum market cap
        coin.current_price > 0 // Valid price
      )
      .slice(0, 3)
      .map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        current_price: coin.current_price,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        market_cap_rank: coin.market_cap_rank
      }));

    console.log('Top gainers processed:', topGainersData);

    setTrendingCoins(trendingWithPrices);
    setTopGainers(topGainersData);
    
    setCache(cacheKeyTrending, trendingWithPrices);
    setCache(cacheKeyGainers, topGainersData);
    
    console.log(' Data fetch completed successfully');
    
  } catch (error) {
    console.error('Error fetching top movers:', error);

    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - API might be slow');
    } else if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.status === 429) {
        console.error('Rate limited! Wait before making more requests');
      }
    } else if (error.request) {
      console.error('Network Error - no response received');
    } else {
      console.error('Error:', error.message);
    }
    
    setTrendingCoins([]);
    setTopGainers([]);
  }
}, []);


  useEffect(() => {
    fetchStats();
    fetchCharts();
    fetchNews();
    fetchTopMovers();
  }, [fetchStats, fetchCharts, fetchNews, fetchTopMovers, timeRange, retryFlag]);

  const retryStats = () => {
    setStatsErr(null);
    setRetryFlag((f) => f + 1);
  };
  const retryNews = () => {
    setNewsErr(null);
    setRetryFlag((f) => f + 1);
  };

  const marketCapChange = useMemo(() => stats?.market_cap_change_percentage_24h_usd ?? 0, [stats]);
  const kpiChangeStyle = marketCapChange >= 0 ? styles.kpiChangePositive : styles.kpiChangeNegative;
  const kpiChangeSign = marketCapChange >= 0 ? '▲' : '▼';

  const openModal = () => {
    setIsModalVisible(true);
    setModalTabKey('market');
  };

  const formatPrice = (price) => {
    if (!price) return '$0.00';
    return price >= 1 ? `$${numeral(price).format('0,0.00')}` : `$${price.toFixed(6)}`;
  };

  const formatChange = (change) => {
    if (!change && change !== 0) return '0.00';
    return Math.abs(change).toFixed(2);
  };

  return (
    <>
      <Title level={2} style={styles.sectionTitle}>Market Overview</Title>
      
      <div style={styles.buttonsWrapper}>
        {['1', '7', '30'].map((day) => (
          <Button
            key={day}
            style={{ ...buttonStyle, ...(timeRange === day ? { opacity: 0.8 } : {}) }}
            onClick={() => debouncedSetTimeRange(day)}
          >
            {day === '1' ? '1D' : day === '7' ? '1W' : '1M'}
          </Button>
        ))}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card style={styles.cardBody} onClick={openModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                  {stats ? (
                    <CountUp 
                      end={stats.total_market_cap?.usd || 0} 
                      separator="," 
                      prefix="$" 
                      duration={1.5}
                      formattingFn={(value) => `$${millify(value)}`}
                    />
                  ) : (
                    <Spin size="small" />
                  )}
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  Total Market Cap
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={kpiChangeStyle}>
                    {kpiChangeSign} {formatChange(marketCapChange)}%
                  </span>
                </div>
              </div>
              <div style={styles.chartContainer}>
                <Suspense fallback={<Spin size="small" />}>
                  {marketChart ? (
                    <LineChart
                      data={marketChart}
                      options={{
                        plugins: { legend: { display: false } },
                        elements: { point: { radius: 0 } },
                        scales: { x: { display: false }, y: { display: false } },
                        maintainAspectRatio: false,
                      }}
                      height={60}
                    />
                  ) : (
                    <Spin size="small" />
                  )}
                </Suspense>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card style={styles.cardBody} onClick={openModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                  {stats ? (
                    <CountUp 
                      end={stats.total_volume?.usd || 0} 
                      separator="," 
                      prefix="$" 
                      duration={1.5}
                      formattingFn={(value) => `$${millify(value)}`}
                    />
                  ) : (
                    <Spin size="small" />
                  )}
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  24h Trading Volume
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={kpiChangeStyle}>
                    {kpiChangeSign} {formatChange(marketCapChange)}%
                  </span>
                </div>
              </div>
              <div style={styles.chartContainer}>
                <Suspense fallback={<Spin size="small" />}>
                  {volumeChart ? (
                    <LineChart
                      data={volumeChart}
                      options={{
                        plugins: { legend: { display: false } },
                        elements: { point: { radius: 0 } },
                        scales: { x: { display: false }, y: { display: false } },
                        maintainAspectRatio: false,
                      }}
                      height={60}
                    />
                  ) : (
                    <Spin size="small" />
                  )}
                </Suspense>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Trending and Gainers Section */}
      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
  <Col xs={24} lg={12}>
    <Card
      title={<span style={{ fontWeight: 700, fontSize: 16 }}>🔥 Trending</span>}
      style={{
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        padding: 0,
      }}
      headStyle={{ borderBottom: 'none', padding: '16px 24px' }}
      bodyStyle={{ padding: 16 }}
    >
      {trendingCoins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin />
        </div>
      ) : (
        trendingCoins.map((coin, index) => {
          const priceChange = coin.price_change_percentage_24h || 0;
          const priceChangeStyle =
            priceChange >= 0 ? styles.coinChangePositive : styles.coinChangeNegative;
          return (
            <div
              key={coin.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: '#f0f0f0',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {index + 1}
              </div>
              <img
                src={coin.image}
                alt={coin.name}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/32x32?text=?';
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>
                  {coin.name}
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {formatPrice(coin.current_price)}
                </div>
              </div>
              <div style={{ ...priceChangeStyle, fontSize: 14 }}>
                {priceChange >= 0 ? '▲' : '▼'} {formatChange(priceChange)}%
              </div>
            </div>
          );
        })
      )}
    </Card>
  </Col>

  <Col xs={24} lg={12}>
    <Card
      title={<span style={{ fontWeight: 700, fontSize: 16 }}>🚀 Top Gainers</span>}
      style={{
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        padding: 0,
      }}
      headStyle={{ borderBottom: 'none', padding: '16px 24px' }}
      bodyStyle={{ padding: 16 }}
    >
      {topGainers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin />
        </div>
      ) : (
        topGainers.map((coin, index) => {
          const priceChange = coin.price_change_percentage_24h || 0;
          const priceChangeStyle =
            priceChange >= 0 ? styles.coinChangePositive : styles.coinChangeNegative;
          return (
            <div
              key={coin.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: '#f6ffed',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#52c41a',
                }}
              >
                {index + 1}
              </div>
              <img
                src={coin.image}
                alt={coin.name}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/32x32?text=?';
                }}
              />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>
                      {coin.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {formatPrice(coin.current_price)}
                    </div>
                  </div>
                  <div style={{ ...priceChangeStyle, fontSize: 14 }}>
                  ▲ {formatChange(priceChange)}%
                  </div>
                </div>
                );
              })
            )}
          </Card>
        </Col>
      </Row>

    {/*Global Crypto Stats */}
      <Card
        style={{
          borderRadius: 20,
          background: 'linear-gradient(90deg, #e6f0ff, #eeeafe)',
          border: '1px solid #d9e0f0',
          padding: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginTop: 32
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Title
          level={3}
          style={{
            color: '#333',
            marginBottom: 32,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 20
          }}
        >
          Global Crypto Statistics
        </Title>

        {statsErr ? (
          <Alert
            message={statsErr}
            type="error"
            action={<Button style={buttonStyle} onClick={retryStats}>Retry</Button>}
          />
        ) : !stats ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} md={6}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: '#5e4bff'
                  }}
                >
                  <CountUp end={stats.active_cryptocurrencies} separator="," duration={2} />
                </div>
                <div style={{ fontSize: 14, opacity: 0.85, color: '#333' }}>
                  Active Cryptocurrencies
                </div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: '#5e4bff'
                  }}
                >
                  <CountUp end={stats.markets} separator="," duration={2} />
                </div>
                <div style={{ fontSize: 14, opacity: 0.85, color: '#333' }}>
                  Total Markets
                </div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: '#5e4bff'
                  }}
                >
                  {millify(stats.total_market_cap.usd)}
                </div>
                <div style={{ fontSize: 14, opacity: 0.85, color: '#333' }}>
                  Total Market Cap
                </div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: '#5e4bff'
                  }}
                >
                  {millify(stats.total_volume.usd)}
                </div>
                <div style={{ fontSize: 14, opacity: 0.85, color: '#333' }}>
                  24h Volume
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Card>

      {/* Modal for detailed charts */}
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        title=" Market Analytics"
        width={900}
        centered
        styles={{ body: { padding: 24 } }}
      >
        <Tabs 
          activeKey={modalTabKey} 
          onChange={setModalTabKey} 
          size="large"
          items={[
            {
              key: 'market',
              label: ' Market Cap Trend',
              children: marketChart ? (
                <div style={{ height: 400 }}>
                  <Suspense fallback={<Spin />}>
                    <LineChart
                      data={marketChart}
                      options={{
                        responsive: true,
                        plugins: { 
                          legend: { display: true, position: 'top' },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                          }
                        },
                        elements: { 
                          line: { tension: 0.4 }, 
                          point: { radius: 3, hoverRadius: 6 } 
                        },
                        scales: {
                          x: { 
                            display: true, 
                            title: { display: true, text: 'Time' },
                            grid: { color: 'rgba(0,0,0,0.1)' }
                          },
                          y: { 
                            display: true, 
                            title: { display: true, text: 'Market Cap (USD)' },
                            grid: { color: 'rgba(0,0,0,0.1)' }
                          },
                        },
                        maintainAspectRatio: false,
                      }}
                      height={400}
                    />
                  </Suspense>
                </div>
              ) : <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>,
            },
            {
              key: 'volume',
              label: ' Volume Trend',
              children: volumeChart ? (
                <div style={{ height: 400 }}>
                  <Suspense fallback={<Spin />}>
                    <LineChart
                      data={volumeChart}
                      options={{
                        responsive: true,
                        plugins: { 
                          legend: { display: true, position: 'top' },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                          }
                        },
                        elements: { 
                          line: { tension: 0.4 }, 
                          point: { radius: 3, hoverRadius: 6 } 
                        },
                        scales: {
                          x: { 
                            display: true, 
                            title: { display: true, text: 'Time' },
                            grid: { color: 'rgba(0,0,0,0.1)' }
                          },
                          y: { 
                            display: true, 
                            title: { display: true, text: 'Volume (USD)' },
                            grid: { color: 'rgba(0,0,0,0.1)' }
                          },
                        },
                        maintainAspectRatio: false,
                      }}
                      height={400}
                    />
                  </Suspense>
                </div>
              ) : <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>,
            },
          ]} 
        />
      </Modal>

      {/* Top 10 Cryptocurrencies */}
      <div style={{ marginTop: 48, ...styles.flexSpaceBetween }}>
        <Title level={3} style={styles.sectionTitle}> Top 10 Cryptocurrencies</Title>
        <Button type="primary" style={{ ...buttonStyle, borderRadius: 20 }} href="/cryptocurrencies">
          View All Coins
        </Button>
      </div>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>}>
        <Cryptocurrencies simplified count={15} />
      </Suspense>

      {/* Latest News */}
      <div style={{ marginTop: 48 }}>
        <div style={styles.flexSpaceBetween}>
          <Title level={3} style={styles.sectionTitle}> Latest Crypto News</Title>
          <Button type="primary" style={{ ...buttonStyle, borderRadius: 20 }} href="/news">
            Read More News
          </Button>
        </div>
        {newsErr ? (
          <Alert 
            message={newsErr} 
            type="error" 
            action={<Button style={buttonStyle} onClick={retryNews}>Retry</Button>} 
          />
        ) : !news.length ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>}>
              {news.map((article, idx) => (
                <Col xs={24} sm={12} md={12} lg={8} key={idx}>
                  <NewsCard article={article} />
                </Col>
              ))}
            </Suspense>
          </Row>
        )}
      </div>
    </>
  );
}