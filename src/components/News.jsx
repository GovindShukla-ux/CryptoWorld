import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Spin, Alert, Typography } from 'antd';
import NewsCard from '../components/NewsCard';

const { Title } = Typography;

export default function News() {
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN')
      .then((res) => {
        setNews(res.data.Data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch news');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: 24, backgroundColor: '#f0f2f5' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Crypto News
      </Title>
      {error ? (
        <Alert type="error" message={error} style={{ marginBottom: 24 }} />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {news.map((article, idx) => (
            <Col xs={24} sm={12} lg={8} key={idx}>
              <NewsCard article={article} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}