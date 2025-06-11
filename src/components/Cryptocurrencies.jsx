import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Input, Spin, Alert, Tag, Image, Button } from 'antd';
import millify from 'millify';
import { Link } from 'react-router-dom';

export default function Cryptocurrencies({ simplified, count }) {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [setShowMore] = useState(false);
  const [visibleCryptos, setVisibleCryptos] = useState(count || 50);

  useEffect(() => {
    axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: count || 250,
        sparkline: true,
        price_change_percentage: '1h,24h,7d',
      },
    })
    .then((res) => {
      setCryptos(res.data);
      setLoading(false);
    })
    .catch(() => {
      setError('Failed to load cryptocurrency data.');
      setLoading(false);
    });
  }, [count]);

  const filteredData = cryptos.filter((coin) =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChangeTag = (value) => {
    const color = value > 0 ? 'green' : value < 0 ? 'red' : 'default';
    return <Tag color={color}>{value?.toFixed(2)}%</Tag>;
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'market_cap_rank',
      key: 'rank',
      width: 60,
    },
    {
      title: 'Coin',
      key: 'name',
      render: (_, coin) => (
        <Link to={`/crypto/${coin.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src={coin.image} alt={coin.name} width={24} preview={false} />
          <div>
            <strong>{coin.name}</strong>
            <div style={{ fontSize: 12, color: '#888' }}>{coin.symbol.toUpperCase()}</div>
          </div>
        </Link>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'current_price',
      render: (val) => `$${millify(val)}`,
    },
    {
      title: '1h',
      dataIndex: 'price_change_percentage_1h_in_currency',
      render: getChangeTag,
    },
    {
      title: '24h',
      dataIndex: 'price_change_percentage_24h_in_currency',
      render: getChangeTag,
    },
    {
      title: '7d',
      dataIndex: 'price_change_percentage_7d_in_currency',
      render: getChangeTag,
    },
    {
      title: '24h Volume',
      dataIndex: 'total_volume',
      render: (val) => `$${millify(val)}`,
    },
    {
      title: 'Market Cap',
      dataIndex: 'market_cap',
      render: (val) => `$${millify(val)}`,
    },
    {
      title: 'Last 7 Days',
      key: 'sparkline',
      render: (coin) => {
        const prices = coin.sparkline_in_7d?.price?.slice(-50);
        const color = coin.price_change_percentage_7d_in_currency >= 0 ? '#00C853' : '#d50000';

        const chartConfig = {
          type: 'sparkline',
          data: {
            datasets: [{
              data: prices,
              borderColor: color,
              fill: false,
            }],
          },
          options: {
            scales: {
              x: { display: false },
              y: { display: false },
            },
            elements: {
              line: { tension: 0.3, borderWidth: 10 },
              point: { radius: 0 },
            },
            plugins: {
              legend: { display: false },
            },
          },
        };

        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

        return (
          <img
            src={chartUrl}
            alt="sparkline"
            style={{ height: 40 }}
          />
        );
      },
    },
  ];

  const handleShowMore = () => {
    setVisibleCryptos((prevCount) => prevCount + 50);
    if (visibleCryptos >= filteredData.length - 50) {
      setShowMore(false);
    }
  };

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" />;

  return (
    <div style={{ padding: 20, backgroundColor: '#f0f2f5' }}>
      {!simplified && (
        <Input
          placeholder="Search Cryptocurrency"
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 20, maxWidth: 300, padding: 10, borderRadius: 5 }}
        />
      )}
      <Table
        columns={columns}
        dataSource={filteredData.slice(0, count || visibleCryptos)}
        rowKey="id"
        pagination={false}
        style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10 }}
      />
      {!simplified && filteredData.length > visibleCryptos && (
        <Button
          type="primary"
          onClick={handleShowMore}
          style={{ marginTop: 20, padding: 10, borderRadius: 5 }}
        >
          Show More
        </Button>
      )}
      {!simplified && visibleCryptos >= filteredData.length && filteredData.length > 50 && (
        <p style={{ marginTop: 20, textAlign: 'center' }}>
          You've seen all {filteredData.length} cryptocurrencies
        </p>
      )}
    </div>
  );
}