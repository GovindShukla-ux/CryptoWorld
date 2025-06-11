import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, 
} from 'chart.js';
import './CryptoDetail.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler 
);

// Time range definitions
const timeRanges = {
  '1D': { days: '1', unit: 'hour' },
  '1W': { days: '7', unit: 'day' },
  '1M': { days: '30', unit: 'day' },
  '3M': { days: '90', unit: 'day' },
  '6M': { days: '180', unit: 'day' },
  '1Y': { days: '365', unit: 'day' },
};

const CryptoDetails = () => {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [selectedRange, setSelectedRange] = useState('1D');
  const [showAllTickers, setShowAllTickers] = useState(false);


  useEffect(() => {
    axios.get(`https://api.coingecko.com/api/v3/coins/${id}`)
      .then((res) => {
        setCoin(res.data);
      })
      .catch(err => console.error("Failed to fetch coin data:", err));
  }, [id]);

  useEffect(() => {
    const { days } = timeRanges[selectedRange];
    axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`)
      .then((res) => {
        setChartData(res.data.prices);
      })
      .catch(err => console.error("Failed to fetch chart data:", err));
  }, [id, selectedRange]);

  const processedChartData = useMemo(() => {
    if (!chartData) return null;

    const formatLabel = (timestamp) => {
      const date = new Date(timestamp);
      switch (selectedRange) {
        case '1D':
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case '1W':
        case '1M':
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        default:
          return date.toLocaleDateString([], { year: 'numeric', month: 'short' });
      }
    };

    const labels = chartData.map(p => formatLabel(p[0]));
    const dataPoints = chartData.map(p => p[1]);

    return {
      labels,
      datasets: [{
        label: `${coin?.name || ''} Price (USD)`,
        data: dataPoints,
        fill: true,
        backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, 'rgba(0, 242, 96, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 242, 96, 0)');
            return gradient;
        },
        borderColor: 'rgba(0, 242, 96, 1)',
        pointRadius: 0,
        tension: 0.1,
      }]
    };
  }, [chartData, selectedRange, coin?.name]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 7,
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
            callback: (value) => `$${value.toLocaleString()}`,
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      }
    }
  };

  if (!coin) {
    return <div className="loading-container">Loading...</div>;
  }

  const displayedTickers = showAllTickers ? coin.tickers : coin.tickers.slice(0, 10);
  const priceChange24h = coin.market_data.price_change_percentage_24h;

  return (
    <div className="crypto-detail-container">
      {/* --- Header --- */}
      <div className="card crypto-header">
        <div className="header-left">
          <img src={coin.image.large} alt={`${coin.name} logo`} className="coin-logo" />
          <div>
            <h2>{coin.name} <span className="coin-symbol">{coin.symbol.toUpperCase()}</span></h2>
            <div className="header-links">
              <a href={coin.links.homepage[0]} target="_blank" rel="noopener noreferrer">Website</a>
              <a href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noopener noreferrer">CoinGecko</a>
            </div>
          </div>
        </div>
        <div className="header-right">
          <h1>${coin.market_data.current_price.usd.toLocaleString()}</h1>
          <p className={priceChange24h >= 0 ? 'price-up' : 'price-down'}>
            {priceChange24h.toFixed(2)}% (24h)
          </p>
        </div>
      </div>

      {/* --- Market Info --- */}
      <div className="market-info-grid">
        <div className="card info-card">
          <p>Market Cap</p>
          <h4>${coin.market_data.market_cap.usd.toLocaleString()}</h4>
        </div>
        <div className="card info-card">
          <p>24h Volume</p>
          <h4>${coin.market_data.total_volume.usd.toLocaleString()}</h4>
        </div>
        <div className="card info-card">
          <p>Circulating Supply</p>
          <h4>{coin.market_data.circulating_supply.toLocaleString()} {coin.symbol.toUpperCase()}</h4>
        </div>
        <div className="card info-card">
          <p>All-Time High</p>
          <h4>${coin.market_data.ath.usd.toLocaleString()}</h4>
        </div>
      </div>

      {/* --- Chart --- */}
      <div className="card chart-container">
        <div className="time-range-buttons">
          {Object.keys(timeRanges).map((label) => (
            <button
              key={label}
              onClick={() => setSelectedRange(label)}
              className={`time-button ${selectedRange === label ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="chart-wrapper">
          {processedChartData && <Line data={processedChartData} options={chartOptions} />}
        </div>
      </div>

      {/* --- Exchanges Table --- */}
      <div className="card">
        <h3>Exchanges</h3>
        <div className="table-wrapper">
          <table className="exchange-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Exchange</th>
                <th>Pair</th>
                <th>Price</th>
                <th>Spread</th>
                <th>Trust</th>
              </tr>
            </thead>
            <tbody>
              {displayedTickers.map((ticker, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{ticker.market?.name || '-'}</td>
                  <td>
                    <a href={ticker.trade_url} target="_blank" rel="noopener noreferrer" className="pair-link">
                      {ticker.base}/{ticker.target}
                    </a>
                  </td>
                  <td>${ticker.converted_last.usd.toLocaleString()}</td>
                  <td>{ticker.bid_ask_spread_percentage ? `${ticker.bid_ask_spread_percentage.toFixed(2)}%` : '-'}</td>
                  <td>
                    <span
                      className={`trust-dot ${ticker.trust_score || 'gray'}`}
                      title={`Trust Score: ${ticker.trust_score}`}
                    ></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coin.tickers.length > 10 && (
          <div className="show-more-container">
            <button onClick={() => setShowAllTickers(!showAllTickers)} className="show-more-button">
              {showAllTickers ? 'Show Less' : 'Show More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoDetails;