import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TimeSeriesPoint } from '../../api/types'
import { Card } from '../ui/Card'

const chartTooltipStyle = {
  contentStyle: {
    background: '#151c2c',
    border: '1px solid #243047',
    borderRadius: '8px',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8' },
}

interface ChartProps {
  data: TimeSeriesPoint[]
  title: string
  subtitle?: string
  color?: string
  unit?: string
  type?: 'area' | 'bar'
  domain?: [number, number]
}

export function MetricChart({
  data,
  title,
  subtitle,
  color = '#22d3ee',
  unit = '',
  type = 'area',
  domain,
}: ChartProps) {
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2538" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={domain}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                {...chartTooltipStyle}
                formatter={(value) => [`${value ?? 0}${unit}`, '']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${title})`}
              />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2538" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...chartTooltipStyle} formatter={(value) => [value ?? 0, 'jobs']} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
