'use client';
import { useParams } from 'next/navigation';
import { getAllAssets } from '@/src/lib/store';
import { calculateCurrentValue, formatCurrency } from '@/src/lib/utils';
import {
  Text,
  Card,
  CardHeader,
  CardPreview,
  Button,
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMemo, useRef, useState, useEffect } from 'react';
import { deleteAsset } from '@/src/lib/store';
import {
  Edit24Regular,
  Delete24Regular,
  Save24Filled,
  Dismiss24Filled,
} from '@fluentui/react-icons';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import AssetForm, { type AssetFormHandle } from '@/src/components/AssetForm';

export default function AssetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const assets = getAllAssets();
  const asset = assets.find((a) => a.id === id);
  const router = useRouter();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const editFormRef = useRef<AssetFormHandle>(null);
  const [editValid, setEditValid] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const xAxisTicks = useMemo(() => {
    if (!asset) return [];
    const ticks = [];
    const purchaseDate = new Date(asset.purchaseDate);
    const endDate = new Date(purchaseDate);
    endDate.setDate(endDate.getDate() + asset.expectedLifeWeeks * 7);
    const now = new Date();
    const chartEnd = now > endDate ? now : endDate;

    const startYear = purchaseDate.getFullYear();
    const endYear = chartEnd.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const yearStart = new Date(year, 0, 1); // January 1st
      if (yearStart >= purchaseDate && yearStart <= chartEnd) {
        ticks.push(yearStart.getTime()); // Use timestamp instead of date string
      }
    }
    return ticks;
  }, [asset]);

  const chartData = useMemo(() => {
    if (!asset) return [];
    const purchaseDate = new Date(asset.purchaseDate);
    const endDate = new Date(purchaseDate);
    endDate.setDate(endDate.getDate() + asset.expectedLifeWeeks * 7);
    const now = new Date();
    const chartEnd = now > endDate ? now : endDate;
    const data = [];

    // Collect all dates we want to include
    const allDates = new Set<string>();

    // Add weekly dates
    for (
      let d = new Date(purchaseDate);
      d <= chartEnd;
      d.setDate(d.getDate() + 7)
    ) {
      allDates.add(d.toISOString().slice(0, 10));
    }

    // Ensure January 1st dates are included for tick marks
    const startYear = purchaseDate.getFullYear();
    const endYear = chartEnd.getFullYear();
    for (let year = startYear; year <= endYear; year++) {
      const yearStart = new Date(year, 0, 1); // January 1st
      if (yearStart >= purchaseDate && yearStart <= chartEnd) {
        allDates.add(yearStart.toISOString().slice(0, 10));
      }
    }

    // Always include today's date if it's after purchase date
    const todayStr = now.toISOString().slice(0, 10);
    if (now >= purchaseDate) {
      allDates.add(todayStr);
    }

    // Sort dates and create data points
    const sortedDates = Array.from(allDates).sort();
    for (const dateStr of sortedDates) {
      const d = new Date(dateStr);
      const value = calculateCurrentValue(asset, d);
      data.push({
        date: dateStr,
        timestamp: d.getTime(),
        value,
      });
    }

    return data;
  }, [asset]);

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayTimestamp = new Date().getTime();

  const handleDelete = () => {
    deleteAsset(id);
    router.push('/dashboard');
  };

  // Show loading state during hydration to prevent hydration mismatch
  if (!isClient) {
    return (
      <main className="container">
        <Text size={400}>Loading asset...</Text>
      </main>
    );
  }

  if (!asset) {
    return (
      <main className="container">
        <Text as="h1" size={800} weight="semibold">
          Asset not found
        </Text>
      </main>
    );
  }

  return (
    <main className="container">
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button icon={<ArrowLeft24Regular />} onClick={() => router.back()}>
          Back
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Dialog
            open={editDialogOpen}
            onOpenChange={(_, data) => setEditDialogOpen(data.open)}
          >
            <DialogTrigger disableButtonEnhancement>
              <Button
                icon={<Edit24Regular />}
                onClick={() => setEditDialogOpen(true)}
              >
                Edit
              </Button>
            </DialogTrigger>
            <DialogSurface style={{ maxWidth: '90vw', width: '800px' }}>
              <DialogBody>
                <DialogTitle>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span>Edit Asset</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        aria-label="Save"
                        icon={<Save24Filled />}
                        appearance="primary"
                        size="large"
                        onClick={() => editFormRef.current?.submit()}
                        disabled={!editValid}
                      ></Button>
                      <Button
                        aria-label="Close"
                        icon={<Dismiss24Filled />}
                        appearance="subtle"
                        size="large"
                        onClick={() => setEditDialogOpen(false)}
                      ></Button>
                    </div>
                  </div>
                </DialogTitle>
                <DialogContent>
                  <AssetForm
                    ref={editFormRef}
                    asset={asset}
                    onSaved={() => {
                      setEditDialogOpen(false);
                      // Refresh the page data
                      window.location.reload();
                    }}
                    onCancel={() => {}}
                    onValidityChange={setEditValid}
                  />
                </DialogContent>
              </DialogBody>
            </DialogSurface>
          </Dialog>
          <Dialog>
            <DialogTrigger disableButtonEnhancement>
              <Button icon={<Delete24Regular />} appearance="secondary">
                Delete
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Delete Asset?</DialogTitle>
                <DialogContent>
                  Are you sure you want to delete <strong>{asset.name}</strong>?
                  This action cannot be undone.
                </DialogContent>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary">Cancel</Button>
                  </DialogTrigger>
                  <Button appearance="primary" onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </div>
      </div>
      <Text as="h1" size={800} weight="semibold">
        {asset.name}
      </Text>
      <Text
        as="h2"
        size={500}
        style={{
          color: 'var(--colorNeutralForeground3)',
          display: 'block',
        }}
      >
        {asset.description}
      </Text>
      <Card
        style={{
          marginTop: 24,
          marginBottom: 24,
          backgroundColor: 'var(--colorNeutralBackground2)',
        }}
      >
        <CardHeader header={<Text weight="semibold">Details</Text>} />
        <div style={{ padding: 16 }}>
          <Text>Purchase Value: {formatCurrency(asset.purchaseValue)}</Text>
          <br />
          <Text>
            Current Value: {formatCurrency(calculateCurrentValue(asset))}
          </Text>
          <br />
          <Text>Expected Life: {asset.expectedLifeWeeks} weeks</Text>
          <br />
          <Text>Purchase Date: {asset.purchaseDate}</Text>
          <br />
          <Text>
            Terminal Price:{' '}
            {asset.terminalPrice
              ? formatCurrency(asset.terminalPrice)
              : 'Full depreciation'}
          </Text>
          <br />
          <Text>Tags: {asset.tags.join(', ') || 'None'}</Text>
          <br />
          {asset.events && asset.events.length > 0 && (
            <>
              <Text>Events:</Text>
              <ul>
                {asset.events
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime(),
                  )
                  .map((e, i) => (
                    <li key={i}>
                      {e.date}: {e.amount >= 0 ? '+' : ''}
                      {formatCurrency(e.amount)}{' '}
                      {e.description && `(${e.description})`}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
        {asset.photoDataUrl && (
          <CardPreview>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.photoDataUrl}
              alt={asset.name}
              style={{
                width: '100%',
                objectFit: 'cover',
                maxHeight: 300,
                borderRadius: '8px',
              }}
            />
          </CardPreview>
        )}
      </Card>
      <Card style={{ backgroundColor: 'var(--colorNeutralBackground2)' }}>
        <CardHeader header={<Text weight="semibold">Value Over Time</Text>} />
        <div style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888844" />
              <XAxis
                dataKey="timestamp"
                stroke="#888888"
                type="number"
                domain={['dataMin', 'dataMax']}
                ticks={xAxisTicks}
                tickFormatter={(tickItem) => {
                  const date = new Date(tickItem);
                  return date.getFullYear().toString();
                }}
              />
              <YAxis stroke="#888888" />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                }}
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #888888',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: '#eeeeee' }}
              />
              {asset.events?.map((event, index) => (
                <ReferenceLine
                  key={`event-${index}`}
                  x={new Date(event.date).getTime()}
                  stroke={`#0078d488`}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={(props) => (
                    <g>
                      <text
                        x={props.viewBox.x}
                        y={props.viewBox.y - 22}
                        textAnchor="middle"
                        style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          fill: `#0078d4cc`,
                        }}
                      >
                        {event.description || `Event ${index + 1}`}
                      </text>
                      <text
                        x={props.viewBox.x}
                        y={props.viewBox.y - 8}
                        textAnchor="middle"
                        style={{
                          fontSize: '11px',
                          fontWeight: 'normal',
                          fill: `#0078d4cc`,
                        }}
                      >
                        {event.amount >= 0 ? '+' : ''}
                        {formatCurrency(event.amount)}
                      </text>
                    </g>
                  )}
                />
              ))}
              <ReferenceLine
                x={todayTimestamp}
                stroke="#ff6b6b"
                strokeWidth={2}
                label={{
                  value: 'today',
                  position: 'top',
                  offset: 10,
                  style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fill: '#ff6b6b',
                  },
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0078d4"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </main>
  );
}
