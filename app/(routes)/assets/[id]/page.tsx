"use client"
import { useParams } from 'next/navigation'
import { getAllAssets } from '@/src/lib/store'
import { calculateCurrentValue, formatCurrency } from '@/src/lib/utils'
import { Text, Card, CardHeader, CardPreview, Button } from '@fluentui/react-components'
import { ArrowLeft24Regular } from '@fluentui/react-icons'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'

export default function AssetDetailPage() {
  const params = useParams()
  const id = params.id as string
  const assets = getAllAssets()
  const asset = assets.find(a => a.id === id)
  const router = useRouter()

  const chartData = useMemo(() => {
    if (!asset) return []
    const purchaseDate = new Date(asset.purchaseDate)
    const endDate = new Date(purchaseDate)
    endDate.setDate(endDate.getDate() + asset.expectedLifeWeeks * 7)
    const now = new Date()
    const chartEnd = now > endDate ? now : endDate
    const data = []
    for (let d = new Date(purchaseDate); d <= chartEnd; d.setDate(d.getDate() + 7)) {
      const value = calculateCurrentValue(asset, d)
      data.push({
        date: d.toISOString().slice(0, 10),
        value
      })
    }
    return data
  }, [asset])

  if (!asset) {
    return (
      <main className="container">
        <Text as="h1" size={800} weight="semibold">Asset not found</Text>
      </main>
    )
  }

  return (
    <main className="container">
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeft24Regular />} onClick={() => router.back()}>Back</Button>
      </div>
      <Text as="h1" size={800} weight="semibold" style={{ marginBottom: 24 }}>
        {asset.name}
      </Text>
      <Card style={{ marginBottom: 24 }}>
        <CardHeader header={<Text weight="semibold">Details</Text>} />
        <div style={{ padding: 16 }}>
          <Text>Description: {asset.description || 'N/A'}</Text><br />
          <Text>Purchase Value: {formatCurrency(asset.purchaseValue)}</Text><br />
          <Text>Current Value: {formatCurrency(calculateCurrentValue(asset))}</Text><br />
          <Text>Expected Life: {asset.expectedLifeWeeks} weeks</Text><br />
          <Text>Purchase Date: {asset.purchaseDate}</Text><br />
          <Text>Terminal Price: {asset.terminalPrice ? formatCurrency(asset.terminalPrice) : 'Full depreciation'}</Text><br />
          <Text>Tags: {asset.tags.join(', ') || 'None'}</Text><br />
          {asset.events && asset.events.length > 0 && (
            <>
              <Text>Events:</Text>
              <ul>
                {asset.events.map((e, i) => (
                  <li key={i}>{e.date}: {formatCurrency(e.amount)} {e.description && `(${e.description})`}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        {asset.photoDataUrl && (
          <CardPreview>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.photoDataUrl} alt={asset.name} style={{ width: '100%', objectFit: 'cover', maxHeight: 300, borderRadius: '8px' }} />
          </CardPreview>
        )}
      </Card>
      <Card>
        <CardHeader header={<Text weight="semibold">Value Over Time</Text>} />
        <div style={{ padding: 16, height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Line type="monotone" dataKey="value" stroke="#0078d4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </main>
  )
}