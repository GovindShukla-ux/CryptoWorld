import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Layout, Typography, Space } from 'antd';

import Home from './components/Home';
import Cryptocurrencies from './components/Cryptocurrencies';
import CryptoDetails from './components/CryptoDetails';
import News from './components/News';
import Navbar from './components/Navbar';
import CryptoExchangeDirectory from './components/exchanges'

const { Sider, Content, Footer } = Layout;

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={260} theme="dark">
        <Navbar />
      </Sider>

      <Layout>
        <Content style={{ padding: '24px 32px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cryptocurrencies" element={<Cryptocurrencies />} />
            <Route path="/crypto/:id" element={<CryptoDetails />} />
            <Route path="/news" element={<News />} />
            <Route path="/exchanges" element={<CryptoExchangeDirectory />} />
          </Routes>
        </Content>

        <Footer style={{ textAlign: 'center', background: '#001529', color: '#fff' }}>
          <Typography.Title level={5} style={{ color: '#fff', margin: 0 }}>
            CryptoWorld <br /> All rights reserved
          </Typography.Title>
          <Space style={{ marginTop: 8 }}>
            <Link to="/">Home</Link>
            <Link to="/cryptocurrencies">Cryptocurrencies</Link>
            <Link to="/news">News</Link>
            <Link to="/exchanges">Exchanges</Link>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  );
}