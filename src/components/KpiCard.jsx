import React from 'react';
import { Card } from 'antd';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const KpiCard = ({ title, value, percent, chartData, color }) => {
  return (
    <Card style={{ width: '100%', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{value}</h3>
          <span style={{ fontSize: 13 }}>{title} <span style={{ color: percent >= 0 ? 'green' : 'red' }}>({percent}%)</span></span>
        </div>
        <div style={{ width: 100, height: 50 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default KpiCard;