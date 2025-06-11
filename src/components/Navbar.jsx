import React, { useState, useEffect } from 'react';
import { Menu, Typography, Avatar } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined, FundOutlined, ReadOutlined, SwapOutlined } from '@ant-design/icons';
import logo from '../images/cryptocurrency.png';

export default function Navbar() {
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('home');

  useEffect(() => {
    const getSelectedKey = () => {
      switch (location.pathname) {
        case '/':
          return 'home';
        case '/cryptocurrencies':
          return 'cryptos';
        case '/exchanges':
          return 'exchanges';
        case '/news':
          return 'news';
        default:
          return 'home';
      }
    };
    setSelectedKey(getSelectedKey());
  }, [location]);

  return (
    <div className="nav-container">
      <div className="logo-container">
        <Avatar src={logo} size="large" />
        <Typography.Title level={3} style={{ color: '#f0f2f5', margin: 0 }}>
          CryptoWorld
        </Typography.Title>
      </div>

      <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]}>
        <Menu.Item key="home" icon={<HomeOutlined />}>
          <Link to="/">Home</Link>
        </Menu.Item>
        <Menu.Item key="cryptos" icon={<FundOutlined />}>
          <Link to="/cryptocurrencies">Cryptocurrencies</Link>
        </Menu.Item>
        <Menu.Item key="exchanges" icon={<SwapOutlined />}>
          <Link to="/exchanges">Exchanges</Link>
        </Menu.Item>
        <Menu.Item key="news" icon={<ReadOutlined />}>
          <Link to="/news">News</Link>
        </Menu.Item>
        <Menu.Item key="myexchange" icon={<SwapOutlined />}>
          <Link to="https://mykryptlive.netlify.app/">MyExchange</Link>
        </Menu.Item>
      </Menu>
    </div>
  );
}