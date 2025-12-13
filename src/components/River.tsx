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
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  Tab,
  TabList,
} from '@fluentui/react-components';
import { calculateDailyDepreciation } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUI } from './UIContext';
import {
  Add24Regular,
  Delete24Regular,
  Settings24Regular,
  ArrowDownload24Regular,
  ArrowUpload24Regular,
  Edit24Regular,
  SignOut24Regular,
  Dismiss24Filled,
  Search24Regular,
} from '@fluentui/react-icons';
import { addAsset, getTags, setTagDefault } from '@/lib/store';
import { startAuthentication } from '@simplewebauthn/browser';
import { RiverVisualizer } from './RiverVisualizer';
import AssetGrid from './AssetGrid';

interface IncomeSource {
  id: string;
  name: string;
  type: 'FIXED' | 'DYNAMIC';
  amount: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface IncomeEntry {
  id: string;
  date: string;
  amount: number;
  description?: string;
  sourceId?: string;
}

export default function River() {
  const router = useRouter();
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const { openNewAssetModal, theme, setTheme } = useUI();
  const isDev = process.env.NODE_ENV === 'development';

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>('income');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup form state
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState<'FIXED' | 'DYNAMIC'>(
    'FIXED',
  );
  const [newSourceAmount, setNewSourceAmount] = useState('');
  const [newSourceStartDate, setNewSourceStartDate] = useState('');
  const [newSourceEndDate, setNewSourceEndDate] = useState('');

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
      const lastMonthDate = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      const lastMonth = lastMonthDate.toISOString().slice(0, 7);

      const [sourcesRes, entriesRes, assetsData, statusRes] = await Promise.all(
        [
          fetch('/api/user/income-sources').then((r) => r.json()),
          fetch(`/api/user/income-entries?month=${currentMonth}`).then((r) =>
            r.json(),
          ),
          getAllAssets(),
          fetch('/api/auth/status').then((r) => r.json()),
        ],
      );

      setSources(sourcesRes);
      setEntries(entriesRes);
      setAssets(assetsData);

      if (!statusRes.hasCompletedSetup) {
        setSetupMode(true);
      } else {
        // Check for missing dynamic income from last month
        const dynamicSources = sourcesRes.filter(
          (s: IncomeSource) => s.type === 'DYNAMIC',
        );
        if (dynamicSources.length > 0) {
          const lastMonthEntries = await fetch(
            `/api/user/income-entries?month=${lastMonth}`,
          ).then((r) => r.json());
          for (const source of dynamicSources) {
            const hasEntry = lastMonthEntries.some(
              (e: IncomeEntry) => e.sourceId === source.id,
            );
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
          startDate: newSourceStartDate || null,
          endDate: newSourceEndDate || null,
        }),
      });
      if (res.ok) {
        const newSource = await res.json();
        setSources([...sources, newSource]);
        setNewSourceName('');
        setNewSourceAmount('');
        setNewSourceStartDate('');
        setNewSourceEndDate('');
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
        setSources(sources.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [editSourceName, setEditSourceName] = useState('');
  const [editSourceStartDate, setEditSourceStartDate] = useState('');
  const [editSourceEndDate, setEditSourceEndDate] = useState('');
  const [editSourceType, setEditSourceType] = useState<'FIXED' | 'DYNAMIC'>(
    'FIXED',
  );
  const [editSourceAmount, setEditSourceAmount] = useState('');

  const openEditSource = (source: IncomeSource) => {
    setEditingSource(source);
    setEditSourceName(source.name);
    setEditSourceType(source.type);
    setEditSourceAmount(source.amount ? source.amount.toString() : '');
    setEditSourceStartDate(source.startDate || '');
    setEditSourceEndDate(source.endDate || '');
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
          startDate: editSourceStartDate || null,
          endDate: editSourceEndDate || null,
        }),
      });
      if (res.ok) {
        const updatedSource = await res.json();
        setSources(
          sources.map((s) => (s.id === updatedSource.id ? updatedSource : s)),
        );
        setEditingSource(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickUpdateSource = async (id: string, amount: number) => {
    try {
      const source = sources.find((s) => s.id === id);
      if (!source) return;

      const res = await fetch(`/api/user/income-sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...source,
          amount,
        }),
      });
      if (res.ok) {
        const updatedSource = await res.json();
        setSources(
          sources.map((s) => (s.id === updatedSource.id ? updatedSource : s)),
        );
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

    const sourcesToExport = sources.map((source) => {
      const { id, ...rest } = source;
      // @ts-ignore
      const { userId, ...cleanSource } = rest;
      return cleanSource;
    });

    const exportData = {
      assets: assetsToExport,
      sources: sourcesToExport,
      tags: getTags(),
      version: 2,
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

        if (Array.isArray(data.sources)) {
          for (const source of data.sources) {
            await fetch('/api/user/income-sources', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(source),
            });
          }
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
    if (
      !confirm(
        'Are you sure? This will permanently delete your account and data.',
      )
    )
      return;

    try {
      const startRes = await fetch('/api/auth/delete/start', {
        method: 'POST',
      });
      const options = await startRes.json();

      const asseResp = await startAuthentication(options);

      const finishRes = await fetch('/api/auth/delete/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asseResp),
      });

      if (finishRes.ok) {
        const { exportData } = await finishRes.json();

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
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
        <Text>
          Let's set up your income sources. You can add multiple jobs or income
          streams.
        </Text>

        <div
          style={{
            width: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {sources.map((s) => (
            <Card key={s.id} size="small">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 8,
                }}
              >
                <div>
                  <Text weight="bold">{s.name}</Text>
                  <br />
                  <Text size={200}>
                    {s.type} {s.type === 'FIXED' ? `($${s.amount})` : ''}
                  </Text>
                </div>
                <Button
                  icon={<Delete24Regular />}
                  appearance="subtle"
                  onClick={() => handleDeleteSource(s.id)}
                />
              </div>
            </Card>
          ))}

          <Card>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 12,
              }}
            >
              <Label>Source Name</Label>
              <Input
                value={newSourceName}
                onChange={(e, d) => setNewSourceName(d.value)}
                placeholder="e.g. Main Job"
              />

              <Label>Type</Label>
              <Select
                value={newSourceType}
                onChange={(e, d) => setNewSourceType(d.value as any)}
              >
                <option value="FIXED">Fixed Monthly</option>
                <option value="DYNAMIC">Dynamic / Variable</option>
              </Select>

              {newSourceType === 'FIXED' && (
                <>
                  <Label>Monthly Amount ($)</Label>
                  <Input
                    type="number"
                    value={newSourceAmount}
                    onChange={(e, d) => setNewSourceAmount(d.value)}
                  />
                </>
              )}

              <Button onClick={handleAddSource} disabled={!newSourceName}>
                Add Source
              </Button>
            </div>
          </Card>

          <Button
            appearance="primary"
            size="large"
            onClick={handleStartFlowing}
          >
            Start Flowing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <RiverVisualizer
        assets={assets}
        sources={sources}
        entries={entries}
        onUpdateSource={handleQuickUpdateSource}
      />

      <AssetGrid onImportComplete={loadData} />

      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 20,
          zIndex: 50,
          display: 'flex',
          gap: 8,
        }}
      >
        <Button
          icon={<Search24Regular />}
          appearance="subtle"
          onClick={() => router.push('/search')}
        />
        <Button
          icon={<Settings24Regular />}
          appearance="subtle"
          onClick={() => setSettingsOpen(true)}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
        }}
      >
        <Button
          appearance="primary"
          size="large"
          shape="circular"
          style={{ width: 64, height: 64, fontSize: 24 }}
          onClick={openNewAssetModal}
        >
          <Add24Regular />
        </Button>
      </div>

      <Dialog
        open={oneTimeDialogOpen}
        onOpenChange={(e, d) => setOneTimeDialogOpen(d.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Add One-time Income</DialogTitle>
            <DialogContent>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  value={oneTimeAmount}
                  onChange={(e, d) => setOneTimeAmount(d.value)}
                />
                <Label>Description</Label>
                <Input
                  value={oneTimeDesc}
                  onChange={(e, d) => setOneTimeDesc(d.value)}
                  placeholder="e.g. Bonus, Gift"
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={handleAddOneTimeIncome}>
                Add
              </Button>
              <Button
                appearance="secondary"
                onClick={() => setOneTimeDialogOpen(false)}
              >
                Cancel
              </Button>
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
                How much did you earn from{' '}
                <strong>
                  {sources.find((s) => s.id === reviewSourceId)?.name}
                </strong>{' '}
                in {reviewMonth}?
              </Text>
              <div style={{ marginTop: 12 }}>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  value={reviewAmount}
                  onChange={(e, d) => setReviewAmount(d.value)}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={handleReviewSubmit}>
                Save
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={settingsOpen}
        onOpenChange={(e, d) => setSettingsOpen(d.open)}
      >
        <DialogSurface style={{ maxWidth: 600, width: '100%' }}>
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
                Settings{' '}
                <Button
                  aria-label="Close"
                  icon={<Dismiss24Filled />}
                  appearance="subtle"
                  size="large"
                  onClick={() => setSettingsOpen(false)}
                />
              </div>
            </DialogTitle>

            <DialogContent>
              <TabList
                selectedValue={settingsTab}
                onTabSelect={(e, d) => setSettingsTab(d.value as string)}
              >
                <Tab value="income">Income Sources</Tab>
                <Tab value="data">Data</Tab>
                {isDev && <Tab value="appearance">Appearance</Tab>}
                <Tab value="account">Account</Tab>
              </TabList>

              <div style={{ marginTop: 16 }}>
                {settingsTab === 'income' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse' }}
                    >
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Name
                          </th>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Type
                          </th>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Amount
                          </th>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Start Date
                          </th>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            End Date
                          </th>
                          <th style={{ textAlign: 'right', padding: 8 }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.map((s) => (
                          <tr
                            key={s.id}
                            style={{ borderBottom: '1px solid #eee' }}
                          >
                            <td style={{ padding: 8 }}>{s.name}</td>
                            <td style={{ padding: 8 }}>{s.type}</td>
                            <td style={{ padding: 8 }}>
                              {s.type === 'FIXED' ? `$${s.amount}` : '-'}
                            </td>
                            <td style={{ padding: 8 }}>{s.startDate || '-'}</td>
                            <td style={{ padding: 8 }}>{s.endDate || '-'}</td>
                            <td style={{ padding: 8, textAlign: 'right' }}>
                              <Button
                                icon={<Edit24Regular />}
                                appearance="subtle"
                                onClick={() => openEditSource(s)}
                              />
                              <Button
                                icon={<Delete24Regular />}
                                appearance="subtle"
                                onClick={() => handleDeleteSource(s.id)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Card>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          padding: 12,
                        }}
                      >
                        <Text weight="bold">Add New Source</Text>
                        <Label>Source Name</Label>
                        <Input
                          value={newSourceName}
                          onChange={(e, d) => setNewSourceName(d.value)}
                          placeholder="e.g. Side Hustle"
                        />
                        <Label>Type</Label>
                        <Select
                          value={newSourceType}
                          onChange={(e, d) => setNewSourceType(d.value as any)}
                        >
                          <option value="FIXED">Fixed Monthly</option>
                          <option value="DYNAMIC">Dynamic / Variable</option>
                        </Select>
                        {newSourceType === 'FIXED' && (
                          <>
                            <Label>Monthly Amount ($)</Label>
                            <Input
                              type="number"
                              value={newSourceAmount}
                              onChange={(e, d) => setNewSourceAmount(d.value)}
                            />
                          </>
                        )}
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newSourceStartDate}
                          onChange={(e, d) => setNewSourceStartDate(d.value)}
                        />
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={newSourceEndDate}
                          onChange={(e, d) => setNewSourceEndDate(d.value)}
                        />
                        <Button
                          onClick={handleAddSource}
                          disabled={!newSourceName}
                        >
                          Add Source
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {settingsTab === 'data' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    <Text>
                      Backup your assets and tags to a JSON file, or restore
                      from a backup.
                    </Text>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Button
                        icon={<ArrowDownload24Regular />}
                        onClick={handleExport}
                      >
                        Export Data
                      </Button>
                      <Button
                        icon={<ArrowUpload24Regular />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Import Data
                      </Button>
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
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text>Theme</Text>
                      <Select
                        value={theme}
                        onChange={(e, d) => setTheme(d.value as any)}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </Select>
                    </div>
                  </div>
                )}

                {settingsTab === 'account' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    <Button icon={<SignOut24Regular />} onClick={handleLogout}>
                      Sign Out
                    </Button>

                    <Button
                      icon={<Delete24Regular />}
                      style={{
                        marginTop: 8,
                        color: '#d13438',
                        borderColor: '#d13438',
                      }}
                      appearance="outline"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={!!editingSource}
        onOpenChange={(e, d) => !d.open && setEditingSource(null)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit Income Source</DialogTitle>
            <DialogContent>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <Label>Source Name</Label>
                <Input
                  value={editSourceName}
                  onChange={(e, d) => setEditSourceName(d.value)}
                />
                <Label>Type</Label>
                <Select
                  value={editSourceType}
                  onChange={(e, d) => setEditSourceType(d.value as any)}
                >
                  <option value="FIXED">Fixed Monthly</option>
                  <option value="DYNAMIC">Dynamic / Variable</option>
                </Select>
                {editSourceType === 'FIXED' && (
                  <>
                    <Label>Monthly Amount ($)</Label>
                    <Input
                      type="number"
                      value={editSourceAmount}
                      onChange={(e, d) => setEditSourceAmount(d.value)}
                    />
                  </>
                )}
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={editSourceStartDate}
                  onChange={(e, d) => setEditSourceStartDate(d.value)}
                />
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={editSourceEndDate}
                  onChange={(e, d) => setEditSourceEndDate(d.value)}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={handleUpdateSource}>
                Update
              </Button>
              <Button
                appearance="secondary"
                onClick={() => setEditingSource(null)}
              >
                Cancel
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
