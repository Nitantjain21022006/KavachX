import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Legend
} from 'recharts';

// ─── SHARED TOOLTIP STYLE ─────────────────────────────────────────────────────
const CyberTooltipStyle = {
    contentStyle: {
        background: 'rgba(2, 2, 10, 0.96)',
        border: '1px solid rgba(0, 243, 255, 0.25)',
        borderRadius: '10px',
        boxShadow: '0 0 20px rgba(0, 243, 255, 0.1)',
        padding: '10px 14px',
        color: '#fff',
        fontSize: '11px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
    },
    itemStyle: { color: '#00f3ff' },
    labelStyle: { color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '9px' },
    cursor: { stroke: 'rgba(0, 243, 255, 0.2)', strokeWidth: 1 },
};

// ─── Event Throughput Area Chart ───────────────────────────────────────────────
export const EventThroughputChart = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="cyberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
                dataKey="time"
                stroke="transparent"
                tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '0.1em' }}
                tickLine={false}
                axisLine={false}
            />
            <YAxis
                stroke="transparent"
                tick={{ fill: '#374151', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
            />
            <Tooltip {...CyberTooltipStyle} formatter={(val) => [val, 'ALERTS']} />
            <Area
                type="monotone"
                dataKey="value"
                stroke="#00f3ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cyberGradient)"
                dot={false}
                filter="url(#glow)"
            />
        </AreaChart>
    </ResponsiveContainer>
);

// ─── Severity Distribution Donut Chart ────────────────────────────────────────
const SEV_COLORS = ['#00f3ff', '#ff9900', '#ff003c'];

const SeverityCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold" fontFamily="monospace">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const SeverityDistributionChart = ({ data }) => {
    const hasData = data && data.some(d => d.value > 0);
    const displayData = hasData ? data : [{ name: 'No Data', value: 1 }];
    const colors = hasData ? SEV_COLORS : ['#1f2937'];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <defs>
                    {colors.map((color, i) => (
                        <filter key={i} id={`pieGlow${i}`}>
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    ))}
                </defs>
                <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="75%"
                    paddingAngle={hasData ? 4 : 0}
                    dataKey="value"
                    labelLine={false}
                    label={hasData ? SeverityCustomLabel : false}
                    stroke="none"
                >
                    {displayData.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} opacity={0.9} />
                    ))}
                </Pie>
                {hasData && (
                    <Tooltip
                        {...CyberTooltipStyle}
                        formatter={(val, name) => [val, name.toUpperCase()]}
                    />
                )}
            </PieChart>
        </ResponsiveContainer>
    );
};

// ─── Attack Vector Horizontal Bar Chart ──────────────────────────────────────
export const AttackVectorChart = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff003c" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#bc13fe" stopOpacity={0.6} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }} />
            <YAxis
                type="category" dataKey="name" tickLine={false} axisLine={false} width={90}
                tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '0.05em' }}
            />
            <Tooltip {...CyberTooltipStyle} formatter={(val) => [val, 'HITS']} />
            <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 4, 4, 0]} maxBarSize={16} />
        </BarChart>
    </ResponsiveContainer>
);

// ─── Sector Radar Chart ────────────────────────────────────────────────────────
export const SectorRadarChart = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <PolarGrid stroke="rgba(0, 243, 255, 0.1)" />
            <PolarAngleAxis
                dataKey="label"
                tick={{ fill: '#6b7280', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }}
            />
            <PolarRadiusAxis stroke="transparent" tick={false} />
            <Radar name="Health" dataKey="health" stroke="#00f3ff" fill="#00f3ff" fillOpacity={0.15} strokeWidth={1.5} dot={{ fill: '#00f3ff', r: 3 }} />
            <Tooltip {...CyberTooltipStyle} formatter={(val) => [`${val}%`, 'HEALTH']} />
        </RadarChart>
    </ResponsiveContainer>
);

// ─── Status Donut: Active vs Resolved ────────────────────────────────────────
export const StatusDonutChart = ({ active, resolved }) => {
    const data = [
        { name: 'Active', value: active },
        { name: 'Resolved', value: resolved },
    ];
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="78%" paddingAngle={3} dataKey="value" stroke="none">
                    <Cell fill="#ff003c" opacity={0.9} />
                    <Cell fill="#39ff14" opacity={0.8} />
                </Pie>
                <Tooltip {...CyberTooltipStyle} formatter={(val, name) => [val, name.toUpperCase()]} />
            </PieChart>
        </ResponsiveContainer>
    );
};
