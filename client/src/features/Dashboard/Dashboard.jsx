/* eslint-disable no-unused-vars */
// src/features/Dashboard/Dashboard.jsx - FINAL REVISED VERSION (Grid Layout Restored)

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// --- Recharts Constant for Label Calculations ---
const RADIAN = Math.PI / 180;

// --- Custom Label Component (Offsets Adjusted for smaller radius=90) ---
const CustomPieChartLabel = ({ cx, cy, midAngle, outerRadius, fill, name, percent }) => {
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  // Offsets are kept minimal and relative to the responsive radius
  const OFFSET_DISTANCE = 10; // Gap between pie edge and text start
  const LINE_LENGTH = 15;     // Length of the final horizontal line
  
  // Start of the line (just outside the pie)
  const sx = cx + (outerRadius + 3) * cos; 
  const sy = cy + (outerRadius + 3) * sin;

  // Position of the text block
  const ex = cx + (outerRadius + OFFSET_DISTANCE) * cos; 
  const ey = cy + (outerRadius + OFFSET_DISTANCE) * sin;
  
  // Anchor point for the text (aligned horizontally)
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const labelX = ex + (cos >= 0 ? 1 : -1) * LINE_LENGTH;
  
  const percentageText = `${(percent * 100).toFixed(0)}%`;

  return (
    <g>
      {/* Connector Line (from pie edge to text block) */}
      <path d={`M${sx},${sy}L${labelX},${ey}`} stroke={fill} fill="none" />
      
      {/* Percentage Text (Bold) */}
      <text x={labelX + (cos >= 0 ? 1 : -1) * 3} y={ey} dy={-3} textAnchor={textAnchor} fill="#333" fontSize={11} fontWeight="bold">
        {percentageText}
      </text>
      
      {/* Category Name (Normal) */}
      <text x={labelX + (cos >= 0 ? 1 : -1) * 3} y={ey} dy={10} textAnchor={textAnchor} fill="#666" fontSize={11}>
        {name}
      </text>
    </g>
  );
};


// --- HARDWARE-THEMED SAMPLE DATA (DARK COLORS) ---
const monthlyFinancialsData = [
  { name: 'Jan', Revenue: 55000, COGS: 35000 }, 
  { name: 'Feb', Revenue: 62000, COGS: 41000 },
  { name: 'Mar', Revenue: 48000, COGS: 28000 },
  { name: 'Apr', Revenue: 71000, COGS: 45000 },
  { name: 'May', Revenue: 59000, COGS: 38000 },
  { name: 'Jun', Revenue: 67000, COGS: 43000 },
];

const categoryShareData = [
  { name: 'Power Tools', value: 450 },
  { name: 'Lumber', value: 350 },
  { name: 'Hand Tools', value: 250 },
  { name: 'Fasteners', value: 150 },
];
// Darker color palette
const PIE_COLORS = ['#0077B6', '#009688', '#E6A200', '#D84315']; 

const dailyShipmentData = [
  { name: 'Mon', UnitsShipped: 120 },
  { name: 'Tue', UnitsShipped: 180 },
  { name: 'Wed', UnitsShipped: 95 },
  { name: 'Thu', UnitsShipped: 210 },
  { name: 'Fri', UnitsShipped: 155 },
  { name: 'Sat', UnitsShipped: 70 },
  { name: 'Sun', UnitsShipped: 30 },
];

const quickStats = [
  // CURRENCY UPDATE: Changed '$' to '₱'
  { title: 'Total Revenue (MTD)', value: '₱59,000', change: '+12%', color: 'text-green-700', bgColor: 'bg-green-200' },
  { title: 'Units Shipped (WTD)', value: '835', change: '+5%', color: 'text-blue-700', bgColor: 'bg-blue-200' },
  { title: 'Low Stock Items', value: '45', change: '+2%', color: 'text-red-700', bgColor: 'bg-red-200' }, 
  { title: 'PO Cycle Time (Days)', value: '3.4', change: '-0.5', color: 'text-yellow-800', bgColor: 'bg-yellow-200' },
];

/**
 * Renders the dashboard view with various charts and statistics.
 */
function Dashboard() {
  
  const Card = ({ title, children, className = '' }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* 1. Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className={`flex flex-col items-center justify-center p-6 rounded-xl shadow-md ${stat.bgColor}`}>
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            <h4 className="text-3xl font-extrabold text-gray-800 my-1">{stat.value}</h4>
            <p className={`text-sm font-semibold ${stat.color}`}>{stat.change}</p>
          </div>
        ))}
      </div>
      
      {/* 2. Main Charts Section - GRID LAYOUT RESTORED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Financials Bar Chart (2/3 width) */}
        <Card title="Monthly Revenue vs. COGS" className="lg:col-span-2 h-[450px]">
          <ResponsiveContainer width="100%" height="90%">
            <BarChart
              data={monthlyFinancialsData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#d0d0d0" /> 
              <XAxis dataKey="name" stroke="#444" /> 
              {/* CURRENCY UPDATE: Changed '$' to '₱' in YAxis formatter */}
              <YAxis stroke="#444" tickFormatter={(value) => `₱${(value/1000)}k`} /> 
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #bbb', borderRadius: '8px', padding: '10px' }}
                labelStyle={{ fontWeight: 'bold', color: '#222' }}
                formatter={(value, name) => [value.toLocaleString(), name]}
              />
              <Legend />
              <Bar dataKey="Revenue" fill="#6A5ACD" name="Total Revenue" radius={[4, 4, 0, 0]} /> 
              <Bar dataKey="COGS" fill="#2E8B57" name="Cost of Goods Sold" radius={[4, 4, 0, 0]} /> 
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Product Share Pie Chart (1/3 width, Height synced with Bar Chart) */}
        <Card title="Units Sold by Category" className="h-[450px]">
          <ResponsiveContainer width="100%" height="95%">
            <PieChart>
              <Pie
                data={categoryShareData}
                dataKey="value"
                nameKey="name"
                cx="50%" 
                cy="50%"
                outerRadius={90} // Radius reverted
                labelLine={false}
                label={CustomPieChartLabel} // Using the optimized label component
              >
                {categoryShareData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              {/* Legend moved back to horizontal to save vertical space */}
              <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #bbb', borderRadius: '8px', padding: '10px' }}
                formatter={(value) => [`${value} Units`, 'Value']}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* 3. Daily Shipment Area Chart (Full Width) */}
      <Card title="Weekly Outbound Unit Shipments" className="h-[400px]">
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart
            data={dailyShipmentData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#d0d0d0" /> 
            <XAxis dataKey="name" stroke="#444" /> 
            <YAxis dataKey="UnitsShipped" stroke="#444" />
            <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #bbb', borderRadius: '8px', padding: '10px' }}
                labelStyle={{ fontWeight: 'bold', color: '#222' }}
                formatter={(value, name) => [value, 'Units Shipped']}
            />
            <Area type="monotone" dataKey="UnitsShipped" stroke="#CD853F" fillOpacity={1} fill="url(#colorUvDark)" name="Units Shipped" /> 
            <defs>
              <linearGradient id="colorUvDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#CD853F" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#CD853F" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
}

export default Dashboard;