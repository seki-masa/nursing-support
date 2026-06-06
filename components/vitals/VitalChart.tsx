'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { VITAL_RANGES } from '@/lib/vitals-utils'
import type { VitalRecord } from '@/types'

const CHART_CONFIGS: {
  key: string
  label: string
  fields: Array<{ key: keyof VitalRecord; name: string; color: string }>
}[] = [
  {
    key: 'bp',
    label: '血圧',
    fields: [
      { key: 'systolicBp', name: '収縮期', color: '#dc2626' },
      { key: 'diastolicBp', name: '拡張期', color: '#2563eb' },
    ],
  },
  {
    key: 'heartRate',
    label: '心拍数',
    fields: [{ key: 'heartRate', name: '心拍数', color: '#dc2626' }],
  },
  {
    key: 'temperature',
    label: '体温',
    fields: [{ key: 'temperature', name: '体温', color: '#f97316' }],
  },
  {
    key: 'spo2',
    label: 'SpO2',
    fields: [{ key: 'spo2', name: 'SpO2', color: '#7c3aed' }],
  },
  {
    key: 'weight',
    label: '体重',
    fields: [{ key: 'weight', name: '体重', color: '#059669' }],
  },
  {
    key: 'respiratoryRate',
    label: '呼吸数',
    fields: [{ key: 'respiratoryRate', name: '呼吸数', color: '#0284c7' }],
  },
  {
    key: 'bloodSugar',
    label: '血糖値',
    fields: [{ key: 'bloodSugar', name: '血糖値', color: '#d97706' }],
  },
]

interface VitalChartProps {
  vitals: VitalRecord[]
  chartKey: string
}

export function VitalChart({ vitals, chartKey }: VitalChartProps) {
  const config = CHART_CONFIGS.find((c) => c.key === chartKey)
  if (!config) return null

  const data = [...vitals]
    .reverse()
    .map((v) => ({
      date: format(new Date(v.recordedAt), 'M/d HH:mm', { locale: ja }),
      ...config.fields.reduce((acc, f) => {
        const val = v[f.key]
        acc[f.key as string] = val != null ? Number(val) : null
        return acc
      }, {} as Record<string, number | null>),
    }))

  const referenceLines: { value: number; color: string }[] = []
  if (chartKey === 'bp') {
    referenceLines.push(
      { value: VITAL_RANGES.systolicBp.min, color: '#fbbf24' },
      { value: VITAL_RANGES.systolicBp.max, color: '#fbbf24' },
    )
  } else if (chartKey === 'heartRate') {
    referenceLines.push(
      { value: VITAL_RANGES.heartRate.min, color: '#fbbf24' },
      { value: VITAL_RANGES.heartRate.max, color: '#fbbf24' },
    )
  } else if (chartKey === 'temperature') {
    referenceLines.push(
      { value: VITAL_RANGES.temperature.min, color: '#fbbf24' },
      { value: VITAL_RANGES.temperature.max, color: '#fbbf24' },
    )
  } else if (chartKey === 'spo2') {
    referenceLines.push({ value: VITAL_RANGES.spo2.min, color: '#fbbf24' })
  } else if (chartKey === 'bloodSugar') {
    referenceLines.push(
      { value: VITAL_RANGES.bloodSugar.min, color: '#fbbf24' },
      { value: VITAL_RANGES.bloodSugar.max, color: '#fbbf24' },
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        データがありません
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{ fontSize: '12px' }}
          formatter={(value: number, name: string) => {
            const field = config.fields.find((f) => f.key === name)
            return [value, field?.name ?? name]
          }}
        />
        {config.fields.length > 1 && <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />}
        {referenceLines.map((rl, i) => (
          <ReferenceLine key={i} y={rl.value} stroke={rl.color} strokeDasharray="4 4" />
        ))}
        {config.fields.map((f) => (
          <Line
            key={f.key as string}
            type="monotone"
            dataKey={f.key as string}
            name={f.key as string}
            stroke={f.color}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export { CHART_CONFIGS }
