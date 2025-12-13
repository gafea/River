'use client';
import { useParams } from 'next/navigation';
import { getAsset, deleteAsset, updateAsset } from '@/lib/store';
import {
  calculateCurrentValue,
  formatCurrency,
  weeksBetween,
  calculateTotalInvested,
  calculateDailyDepreciation,
} from '@/lib/utils';
import {
  Text,
  Card,
  CardHeader,
  Button,
  ProgressBar,
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
import {
  Edit24Regular,
  Save24Filled,
  Dismiss24Filled,
  Money24Regular,
} from '@fluentui/react-icons';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Label,
  Input,
} from '@fluentui/react-components';
import AssetForm, { type AssetFormHandle } from '@/components/AssetForm';
import { GooeyTitle } from '@/components/GooeyTitle';
import { GooeyButton, GooeyButtonContainer } from '@/components/GooeyButton';
import type { Asset } from '@/lib/types';
import { useUI } from '@/components/UIContext';

export default function AssetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { setPageLoading, setShowTransitionOverlay, triggerTransition } =
    useUI();
  const [asset, setAsset] = useState<Asset | null>(null);
  const router = useRouter();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const editFormRef = useRef<AssetFormHandle>(null);
  const [editValid, setEditValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentValue, setCurrentValue] = useState(0);

  const [soldDialogOpen, setSoldDialogOpen] = useState(false);
  const [soldValue, setSoldValue] = useState('');
  const [soldDate, setSoldDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const handleSold = async () => {
    if (!asset) return;
    const updatedAsset = {
      ...asset,
      isSold: true,
      soldValue: parseFloat(soldValue),
      soldDate: soldDate,
    };
    await updateAsset(updatedAsset);
    setSoldDialogOpen(false);
    router.push('/');
  };

  useEffect(() => {
    const loadAsset = async () => {
      const data = await getAsset(id);
      setAsset(data);
      setIsLoading(false);
      setPageLoading(false);
    };
    loadAsset();
  }, [id, setPageLoading]);

  useEffect(() => {
    if (!asset) return;
    const updateCurrentValue = () => {
      setCurrentValue(calculateCurrentValue(asset));
    };
    updateCurrentValue();
    const interval = setInterval(updateCurrentValue, 15000);
    return () => clearInterval(interval);
  }, [asset]);

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
      const yearStart = new Date(year, 0, 1);
      if (yearStart >= purchaseDate && yearStart <= chartEnd) {
        ticks.push(yearStart.getTime());
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

    const allDates = new Set<string>();

    for (
      let d = new Date(purchaseDate);
      d <= chartEnd;
      d.setDate(d.getDate() + 7)
    ) {
      allDates.add(d.toISOString().slice(0, 10));
    }

    const startYear = purchaseDate.getFullYear();
    const endYear = chartEnd.getFullYear();
    for (let year = startYear; year <= endYear; year++) {
      const yearStart = new Date(year, 0, 1);
      if (yearStart >= purchaseDate && yearStart <= chartEnd) {
        allDates.add(yearStart.toISOString().slice(0, 10));
      }
    }

    const todayStr = now.toISOString().slice(0, 10);
    if (now >= purchaseDate) {
      allDates.add(todayStr);
    }

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

  const todayTimestamp = new Date().getTime();

  const handleDelete = async () => {
    await deleteAsset(id);
    router.push('/');
  };

  if (isLoading) {
    return <main className="container"></main>;
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

  // Calculations for UI
  const ageWeeks = weeksBetween(asset.purchaseDate);
  const remainingPercentage = Math.max(
    0,
    100 - (ageWeeks / asset.expectedLifeWeeks) * 100,
  );
  const totalInvested = calculateTotalInvested(asset);
  const dailyCost = calculateDailyDepreciation(asset);

  return (
    <main className="container">
      {/* Header Section */}
      <div
        style={{
          marginBottom: 24,
          marginTop: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <GooeyButtonContainer>
          <GooeyButton
            icon={<ArrowLeft24Regular />}
            label="Back"
            onClick={() => triggerTransition('/')}
            style={{ width: '80px', height: '80px' }}
          />
        </GooeyButtonContainer>

        <GooeyButtonContainer>
          <Dialog
            open={editDialogOpen}
            onOpenChange={(_, data) => setEditDialogOpen(data.open)}
          >
            <DialogTrigger disableButtonEnhancement>
              <GooeyButton
                icon={<Edit24Regular />}
                label="Edit"
                onClick={() => setEditDialogOpen(true)}
                style={{ width: '80px', height: '80px' }}
              />
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
                        onClick={() => {
                          setShowTransitionOverlay(true);
                          editFormRef.current?.submit();
                        }}
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
                    onSaved={async () => {
                      setEditDialogOpen(false);
                      const updated = await getAsset(id);
                      setAsset(updated);
                      setShowTransitionOverlay(false);
                    }}
                    onCancel={() => {}}
                    onValidityChange={setEditValid}
                  />
                </DialogContent>
              </DialogBody>
            </DialogSurface>
          </Dialog>
          <Dialog
            open={soldDialogOpen}
            onOpenChange={(_, data) => setSoldDialogOpen(data.open)}
          >
            <DialogTrigger disableButtonEnhancement>
              <GooeyButton
                icon={<Money24Regular />}
                label="Sold"
                onClick={() => setSoldDialogOpen(true)}
                style={{ width: '80px', height: '80px' }}
              />
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Mark Asset as Sold</DialogTitle>
                <DialogContent>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    <Label>Sold Value</Label>
                    <Input
                      type="number"
                      value={soldValue}
                      onChange={(e, data) => setSoldValue(data.value)}
                      contentBefore="$"
                    />
                    <Label>Sold Date</Label>
                    <Input
                      type="date"
                      value={soldDate}
                      onChange={(e, data) => setSoldDate(data.value)}
                    />
                  </div>
                </DialogContent>
                <DialogActions>
                  <Button
                    appearance="secondary"
                    onClick={() => setSoldDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button appearance="primary" onClick={handleSold}>
                    Confirm
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </GooeyButtonContainer>
      </div>

      <GooeyTitle text={asset.name} />

      <div style={{ margin: '8px 16px 32px 16px' }}>
        <Text size={600} weight="bold">
          {formatCurrency(currentValue)}
        </Text>
        <div style={{ marginTop: 8 }}>
          <ProgressBar
            value={remainingPercentage}
            max={100}
            color={remainingPercentage < 20 ? 'error' : 'brand'}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <Text size={200} style={{ color: '#888' }}>
              {Math.round(remainingPercentage)}% life remaining
            </Text>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card style={{ backgroundColor: 'var(--colorNeutralBackground2)' }}>
          <CardHeader header={<Text weight="semibold">Purchase Value</Text>} />
          <div style={{ padding: '0 16px 16px' }}>
            <Text size={400}>{formatCurrency(asset.purchaseValue)}</Text>
          </div>
        </Card>
        <Card style={{ backgroundColor: 'var(--colorNeutralBackground2)' }}>
          <CardHeader header={<Text weight="semibold">Purchase Date</Text>} />
          <div style={{ padding: '0 16px 16px' }}>
            <Text size={400}>{asset.purchaseDate}</Text>
          </div>
        </Card>
        <Card style={{ backgroundColor: 'var(--colorNeutralBackground2)' }}>
          <CardHeader header={<Text weight="semibold">Expected Life</Text>} />
          <div style={{ padding: '0 16px 16px' }}>
            <Text size={400}>{asset.expectedLifeWeeks} weeks</Text>
          </div>
        </Card>
        <Card style={{ backgroundColor: 'var(--colorNeutralBackground2)' }}>
          <CardHeader header={<Text weight="semibold">Daily Cost</Text>} />
          <div style={{ padding: '0 16px 16px' }}>
            <Text size={400}>{formatCurrency(dailyCost)} / day</Text>
          </div>
        </Card>
        <Card style={{ backgroundColor: 'var(--colorNeutralBackground2)' }}>
          <CardHeader header={<Text weight="semibold">Tag</Text>} />
          <div style={{ padding: '0 16px 16px' }}>
            <Text size={400}>{asset.tag || 'None'}</Text>
          </div>
        </Card>
        <Card style={{ backgroundColor: 'var(--colorNeutralBackground2)' }}>
          <CardHeader header={<Text weight="semibold">Terminal Price</Text>} />
          <div style={{ padding: '0 16px 16px' }}>
            <Text size={400}>
              {asset.terminalPrice
                ? formatCurrency(asset.terminalPrice)
                : 'Full depreciation'}
            </Text>
          </div>
        </Card>
      </div>

      {/* Description Card */}
      {asset.description && (
        <Card
          style={{
            marginBottom: 24,
            backgroundColor: 'var(--colorNeutralBackground2)',
          }}
        >
          <CardHeader header={<Text weight="semibold">Description</Text>} />
          <div style={{ padding: '0 16px 16px' }}>
            <Text>{asset.description}</Text>
          </div>
        </Card>
      )}

      {/* Events Card */}
      {asset.events && asset.events.length > 0 && (
        <Card
          style={{
            marginBottom: 24,
            backgroundColor: 'var(--colorNeutralBackground2)',
          }}
        >
          <CardHeader header={<Text weight="semibold">Events</Text>} />
          <div style={{ padding: '0 16px 16px' }}>
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
          </div>
        </Card>
      )}

      {/* Chart Card */}
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
