'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Asset } from '@/lib/types';
import { getAllAssets } from '@/lib/store';
import {
  Button,
  Input,
  Label,
  Title1,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  Tab,
  TabList,
  tokens,
  Switch,
} from '@fluentui/react-components';
import { calculateDailyDepreciation } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUI } from './UIContext';
import { Add24Regular, Delete24Regular, Settings24Regular, ArrowDownload24Regular, ArrowUpload24Regular, Edit24Regular, SignOut24Regular } from '@fluentui/react-icons';
import { addAsset, getTags, setTagDefault } from '@/lib/store';
import { startAuthentication } from '@simplewebauthn/browser';

interface IncomeSource {
  id: string;
  name: string;
  type: 'FIXED' | 'DYNAMIC';
  amount: number | null;
}

interface IncomeEntry {
  id: string;
  date: string;
  amount: number;
  description?: string;
  sourceId?: string;
}

export default function River() {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const { openNewAssetModal, theme, setTheme } = useUI();
  const router = useRouter();

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>('income');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup form state
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState<'FIXED' | 'DYNAMIC'>('FIXED');
  const [newSourceAmount, setNewSourceAmount] = useState('');

  // One-time income state
  const [oneTimeDialogOpen, setOneTimeDialogOpen] = useState(false);
  const [oneTimeAmount, setOneTimeAmount] = useState('');
  const [oneTimeDesc, setOneTimeDesc] = useState('');

  // Monthly review state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewMonth, setReviewMonth] = useState('');
  const [reviewSourceId, setReviewSourceId] = useState('');
  const [reviewAmount, setReviewAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonth = lastMonthDate.toISOString().slice(0, 7);

      const [sourcesRes, entriesRes, assetsData, statusRes] = await Promise.all([
        fetch('/api/user/income-sources').then((r) => r.json()),
        fetch(`/api/user/income-entries?month=${currentMonth}`).then((r) => r.json()),
        getAllAssets(),
        fetch('/api/auth/status').then((r) => r.json()),
      ]);
      
      setSources(sourcesRes);
      setEntries(entriesRes);
      setAssets(assetsData);

      if (!statusRes.hasCompletedSetup) {
        setSetupMode(true);
      } else {
        // Check for missing dynamic income from last month
        const dynamicSources = sourcesRes.filter((s: IncomeSource) => s.type === 'DYNAMIC');
        if (dynamicSources.length > 0) {
          const lastMonthEntries = await fetch(`/api/user/income-entries?month=${lastMonth}`).then(r => r.json());
          for (const source of dynamicSources) {
            const hasEntry = lastMonthEntries.some((e: IncomeEntry) => e.sourceId === source.id);
            if (!hasEntry) {
              setReviewMonth(lastMonth);
              setReviewSourceId(source.id);
              setReviewDialogOpen(true);
              break; // Handle one at a time
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async () => {
    try {
      const res = await fetch('/api/user/income-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSourceName,
          type: newSourceType,
          amount: newSourceAmount ? parseFloat(newSourceAmount) : null,
        }),
      });
      if (res.ok) {
        const newSource = await res.json();
        setSources([...sources, newSource]);
        setNewSourceName('');
        setNewSourceAmount('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income source?')) return;
    try {
      const res = await fetch(`/api/user/income-sources/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSources(sources.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [editSourceName, setEditSourceName] = useState('');
  const [editSourceType, setEditSourceType] = useState<'FIXED' | 'DYNAMIC'>('FIXED');
  const [editSourceAmount, setEditSourceAmount] = useState('');

  const openEditSource = (source: IncomeSource) => {
    setEditingSource(source);
    setEditSourceName(source.name);
    setEditSourceType(source.type);
    setEditSourceAmount(source.amount ? source.amount.toString() : '');
  };

  const handleUpdateSource = async () => {
    if (!editingSource) return;
    try {
      const res = await fetch(`/api/user/income-sources/${editingSource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editSourceName,
          type: editSourceType,
          amount: editSourceAmount ? parseFloat(editSourceAmount) : null,
        }),
      });
      if (res.ok) {
        const updatedSource = await res.json();
        setSources(sources.map(s => s.id === updatedSource.id ? updatedSource : s));
        setEditingSource(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = () => {
    const assetsToExport = assets.map((asset) => {
      const { id, ...rest } = asset;
      // @ts-ignore
      const { userId, ...cleanAsset } = rest;
      return cleanAsset;
    });

    const exportData = {
      assets: assetsToExport,
      tags: getTags(),
      version: 1,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `river-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const content = ev.target?.result as string;
        const data = JSON.parse(content);

        if (data.tags) {
          Object.entries(data.tags).forEach(([tag, weeks]) => {
            setTagDefault(tag, weeks as number);
          });
        }

        if (Array.isArray(data.assets)) {
          for (const asset of data.assets) {
            await addAsset(asset);
          }
        }

        alert('Import successful!');
        loadData();
      } catch (err) {
        console.error(err);
        alert('Failed to import file');
      }
    };
    reader.readAsText(file);
  };

  const handleAddOneTimeIncome = async () => {
    try {
      const res = await fetch('/api/user/income-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          amount: parseFloat(oneTimeAmount),
          description: oneTimeDesc || 'One-time income',
          sourceId: null,
        }),
      });
      if (res.ok) {
        const newEntry = await res.json();
        setEntries([newEntry, ...entries]);
        setOneTimeDialogOpen(false);
        setOneTimeAmount('');
        setOneTimeDesc('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = async () => {
    try {
      const date = `${reviewMonth}-01`; // Just use 1st of month
      const res = await fetch('/api/user/income-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          amount: parseFloat(reviewAmount),
          description: 'Monthly dynamic income',
          sourceId: reviewSourceId,
        }),
      });
      if (res.ok) {
        setReviewDialogOpen(false);
        setReviewAmount('');
        // Ideally check for next missing source
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartFlowing = async () => {
    await fetch('/api/user/setup', { method: 'POST' });
    setSetupMode(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth';
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and data.')) return;
    
    try {
      const startRes = await fetch('/api/auth/delete/start', { method: 'POST' });
      const options = await startRes.json();
      
      const asseResp = await startAuthentication(options);
      
      const finishRes = await fetch('/api/auth/delete/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asseResp),
      });
      
      if (finishRes.ok) {
        const { exportData } = await finishRes.json();
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportData.userId || 'user'}-river-data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        alert('Account deleted. Data exported.');
        window.location.href = '/auth';
      } else {
        alert('Failed to verify identity.');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting account');
    }
  };

  if (loading) return <div className="d_loading" />;

  if (setupMode) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 24,
          background: 'linear-gradient(180deg, #e0f7fa 0%, #ffffff 100%)',
        }}
      >
        <Title1>Welcome to your River</Title1>
        <Text>Let's set up your income sources. You can add multiple jobs or income streams.</Text>
        
        <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sources.map(s => (
            <Card key={s.id} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8 }}>
                <div>
                  <Text weight="bold">{s.name}</Text>
                  <br/>
                  <Text size={200}>{s.type} {s.type === 'FIXED' ? `($${s.amount})` : ''}</Text>
                </div>
                <Button icon={<Delete24Regular />} appearance="subtle" onClick={() => handleDeleteSource(s.id)} />
              </div>
            </Card>
          ))}

          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
              <Label>Source Name</Label>
              <Input value={newSourceName} onChange={(e, d) => setNewSourceName(d.value)} placeholder="e.g. Main Job" />
              
              <Label>Type</Label>
              <Select value={newSourceType} onChange={(e, d) => setNewSourceType(d.value as any)}>
                <option value="FIXED">Fixed Monthly</option>
                <option value="DYNAMIC">Dynamic / Variable</option>
              </Select>

              {newSourceType === 'FIXED' && (
                <>
                  <Label>Monthly Amount ($)</Label>
                  <Input type="number" value={newSourceAmount} onChange={(e, d) => setNewSourceAmount(d.value)} />
                </>
              )}

              <Button onClick={handleAddSource} disabled={!newSourceName}>Add Source</Button>
            </div>
          </Card>

          <Button appearance="primary" size="large" onClick={handleStartFlowing}>Start Flowing</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <RiverVisualization 
        sources={sources} 
        entries={entries} 
        assets={assets} 
        onAddAsset={openNewAssetModal} 
        onAddIncome={() => setOneTimeDialogOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      
      <Dialog open={oneTimeDialogOpen} onOpenChange={(e, d) => setOneTimeDialogOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Add One-time Income</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Label>Amount ($)</Label>
                <Input type="number" value={oneTimeAmount} onChange={(e, d) => setOneTimeAmount(d.value)} />
                <Label>Description</Label>
                <Input value={oneTimeDesc} onChange={(e, d) => setOneTimeDesc(d.value)} placeholder="e.g. Bonus, Gift" />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={handleAddOneTimeIncome}>Add</Button>
              <Button appearance="secondary" onClick={() => setOneTimeDialogOpen(false)}>Cancel</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={reviewDialogOpen}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Monthly Review</DialogTitle>
            <DialogContent>
              <Text>
                How much did you earn from <strong>{sources.find(s => s.id === reviewSourceId)?.name}</strong> in {reviewMonth}?
              </Text>
              <div style={{ marginTop: 12 }}>
                <Label>Amount ($)</Label>
                <Input type="number" value={reviewAmount} onChange={(e, d) => setReviewAmount(d.value)} />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={handleReviewSubmit}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={(e, d) => setSettingsOpen(d.open)}>
        <DialogSurface style={{ maxWidth: 600, width: '100%' }}>
          <DialogBody>
            <DialogTitle>Settings</DialogTitle>
            <DialogContent>
              <TabList selectedValue={settingsTab} onTabSelect={(e, d) => setSettingsTab(d.value as string)}>
                <Tab value="income">Income Sources</Tab>
                <Tab value="data">Data</Tab>
                <Tab value="appearance">Appearance</Tab>
                <Tab value="account">Account</Tab>
              </TabList>
              
              <div style={{ marginTop: 16 }}>
                {settingsTab === 'income' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {sources.map(s => (
                      <Card key={s.id} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8 }}>
                          <div>
                            <Text weight="bold">{s.name}</Text>
                            <br/>
                            <Text size={200}>{s.type} {s.type === 'FIXED' ? `($${s.amount})` : ''}</Text>
                          </div>
                          <div>
                            <Button icon={<Edit24Regular />} appearance="subtle" onClick={() => openEditSource(s)} />
                            <Button icon={<Delete24Regular />} appearance="subtle" onClick={() => handleDeleteSource(s.id)} />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Card>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
                        <Text weight="bold">Add New Source</Text>
                        <Label>Source Name</Label>
                        <Input value={newSourceName} onChange={(e, d) => setNewSourceName(d.value)} placeholder="e.g. Side Hustle" />
                        <Label>Type</Label>
                        <Select value={newSourceType} onChange={(e, d) => setNewSourceType(d.value as any)}>
                          <option value="FIXED">Fixed Monthly</option>
                          <option value="DYNAMIC">Dynamic / Variable</option>
                        </Select>
                        {newSourceType === 'FIXED' && (
                          <>
                            <Label>Monthly Amount ($)</Label>
                            <Input type="number" value={newSourceAmount} onChange={(e, d) => setNewSourceAmount(d.value)} />
                          </>
                        )}
                        <Button onClick={handleAddSource} disabled={!newSourceName}>Add Source</Button>
                      </div>
                    </Card>
                  </div>
                )}

                {settingsTab === 'data' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Text>Backup your assets and tags to a JSON file, or restore from a backup.</Text>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Button icon={<ArrowDownload24Regular />} onClick={handleExport}>Export Data</Button>
                      <Button icon={<ArrowUpload24Regular />} onClick={() => fileInputRef.current?.click()}>Import Data</Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleImport}
                      />
                    </div>
                  </div>
                )}

                {settingsTab === 'appearance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>Theme</Text>
                      <Select value={theme} onChange={(e, d) => setTheme(d.value as any)}>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </Select>
                    </div>
                  </div>
                )}

                {settingsTab === 'account' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Text>Manage your account settings.</Text>
                    <Button icon={<SignOut24Regular />} onClick={handleLogout}>Sign Out</Button>
                    
                    <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 24 }}>
                      <Text weight="bold" style={{ color: '#d13438' }}>Danger Zone</Text>
                      <br/>
                      <Text size={200}>Permanently delete your account and all data.</Text>
                      <Button 
                        style={{ marginTop: 8, color: '#d13438', borderColor: '#d13438' }} 
                        appearance="outline"
                        onClick={handleDeleteAccount}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setSettingsOpen(false)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={!!editingSource} onOpenChange={(e, d) => !d.open && setEditingSource(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit Income Source</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Label>Source Name</Label>
                <Input value={editSourceName} onChange={(e, d) => setEditSourceName(d.value)} />
                <Label>Type</Label>
                <Select value={editSourceType} onChange={(e, d) => setEditSourceType(d.value as any)}>
                  <option value="FIXED">Fixed Monthly</option>
                  <option value="DYNAMIC">Dynamic / Variable</option>
                </Select>
                {editSourceType === 'FIXED' && (
                  <>
                    <Label>Monthly Amount ($)</Label>
                    <Input type="number" value={editSourceAmount} onChange={(e, d) => setEditSourceAmount(d.value)} />
                  </>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={handleUpdateSource}>Update</Button>
              <Button appearance="secondary" onClick={() => setEditingSource(null)}>Cancel</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}

function RiverVisualization({ 
  sources, 
  entries, 
  assets, 
  onAddAsset,
  onAddIncome,
  onOpenSettings
}: { 
  sources: IncomeSource[], 
  entries: IncomeEntry[], 
  assets: Asset[], 
  onAddAsset: () => void,
  onAddIncome: () => void,
  onOpenSettings: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const router = useRouter();

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const today = new Date();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const currentDay = today.getDate();
  const progress = currentDay / daysInMonth;

  // Calculate financials
  const totalDailyCost = assets.reduce(
    (acc, asset) => acc + calculateDailyDepreciation(asset),
    0,
  );
  const totalMonthlyCost = totalDailyCost * daysInMonth;
  
  // Calculate total income for this month
  const fixedIncome = sources
    .filter(s => s.type === 'FIXED')
    .reduce((acc, s) => acc + (s.amount || 0), 0);
  
  const oneTimeIncome = entries
    .filter(e => !e.sourceId) // Assuming entries without sourceId are one-time
    .reduce((acc, e) => acc + e.amount, 0);

  const totalIncome = fixedIncome + oneTimeIncome;
  const remaining = totalIncome - totalMonthlyCost;

  // Generate river path
  // We want a river that flows from left to right (or top to bottom? Prompt says "start of river... end of river").
  // Let's do Left -> Right for a timeline view.

  const riverPoints = [];
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * dimensions.width;
    // Add some waviness
    const yCenter = dimensions.height / 2 + Math.sin(i * 0.5) * 50;
    // Width decreases as money is spent? Or just visual?
    // Let's make width proportional to remaining money at that point in the month
    const day = (i / segments) * daysInMonth;
    const spentSoFar = totalDailyCost * day;
    
    // Add income that happened by this day?
    // For simplicity, assume fixed income is available at start, one-time adds up
    // But for river width, let's just use the projected remaining
    
    const currentMoney = totalIncome - spentSoFar;
    const maxMoney = Math.max(totalIncome, 1);
    
    // Allow negative width (visualized as thin red line?)
    // For now, clamp to minimum width
    const widthRatio = Math.max(0.1, currentMoney / maxMoney); 
    const riverWidth = 200 * widthRatio + 50; // Base width

    riverPoints.push({ x, y: yCenter, width: riverWidth });
  }

  // Construct SVG path
  const topPath = riverPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y - p.width / 2}`)
    .join(' ');
  const bottomPath = riverPoints
    .slice()
    .reverse()
    .map((p, i) => `L ${p.x} ${p.y + p.width / 2}`)
    .join(' ');
  const riverPath = `${topPath} ${bottomPath} Z`;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--colorNeutralBackground1)',
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4fc3f7" />
            <stop offset="100%" stopColor="#0288d1" />
          </linearGradient>
        </defs>
        <path d={riverPath} fill="url(#riverGradient)" opacity={0.8} />

        {/* Grid lines for days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const x = (i / daysInMonth) * dimensions.width;
          return (
            <line
              key={i}
              x1={x}
              y1={0}
              x2={x}
              y2={dimensions.height}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {/* Boat */}
      <div
        style={{
          position: 'absolute',
          left: `${progress * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          transition: 'left 1s linear',
        }}
      >
        <div style={{ fontSize: 40 }}>⛵️</div>
        <div
          style={{
            background: 'var(--colorNeutralBackground1)',
            padding: '4px 8px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          <Text weight="bold">Today</Text>
          <br />
          <Text size={200}>Day {currentDay}</Text>
        </div>
      </div>

      {/* Assets floating */}
      {assets.map((asset, i) => {
        // Deterministic random position based on ID
        const hash = asset.id
          .split('')
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const xPercent = (hash % 90) + 5; // 5% to 95%
        const yOffset = (hash % 100) - 50; // -50 to 50 offset from center

        return (
          <div
            key={asset.id}
            style={{
              position: 'absolute',
              left: `${xPercent}%`,
              top: `calc(50% + ${yOffset}px)`,
              zIndex: 5,
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
            }}
            className="asset-float"
            onClick={() => router.push(`/assets/${asset.id}`)}
          >
            <div className="asset-content">
              {asset.photoDataUrl ? (
                <img
                  src={asset.photoDataUrl}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  📦
                </div>
              )}
              <div className="asset-tooltip">
                <Text weight="bold">{asset.name}</Text>
                <br />
                <Text size={200}>
                  -${calculateDailyDepreciation(asset).toFixed(2)}/day
                </Text>
              </div>
            </div>
          </div>
        );
      })}

      {/* Start Info */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: 20,
          background: 'var(--colorNeutralBackground1)',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Title1>Income</Title1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sources.map(s => (
            <Text key={s.id} size={300}>
              {s.name}: {s.type === 'FIXED' ? `$${s.amount}` : 'Dynamic'}
            </Text>
          ))}
          <Text size={400} weight="bold" style={{ color: '#0288d1', marginTop: 8 }}>
            Total: ${totalIncome.toLocaleString()}/mo
          </Text>
          <Button size="small" onClick={onAddIncome}>+ One-time</Button>
        </div>
      </div>

      {/* End Info */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          background: 'var(--colorNeutralBackground1)',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'right',
        }}
      >
        <Text size={300}>Projected Savings</Text>
        <br />
        <Title1 style={{ color: remaining > 0 ? '#107c10' : '#d13438' }}>
          ${remaining.toFixed(2)}
        </Title1>
      </div>

      {/* Settings Button */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 20,
        }}
      >
        <Button icon={<Settings24Regular />} appearance="subtle" onClick={onOpenSettings} />
      </div>

      {/* Add Button */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <Button
          appearance="primary"
          size="large"
          shape="circular"
          style={{ width: 64, height: 64, fontSize: 24 }}
          onClick={onAddAsset}
        >
          +
        </Button>
      </div>

      <style jsx>{`
        .asset-float:hover {
          transform: scale(1.2);
          z-index: 20;
        }
        .asset-content {
          position: relative;
        }
        .asset-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 8px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          white-space: nowrap;
          margin-bottom: 8px;
        }
        .asset-float:hover .asset-tooltip {
          opacity: 1;
        }
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}
