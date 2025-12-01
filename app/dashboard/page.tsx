'use client';
import {
  groupAssetsByTag,
  calculateCurrentValue,
  calculateDailyDepreciation,
} from '@/lib/utils';
import {
  getAllAssets,
  addAsset,
  clearAllAssets,
  getTagDefaults,
  setTagDefault,
} from '@/lib/store';
import AssetCard from '@/components/AssetCard';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Text,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Button,
  Input,
} from '@fluentui/react-components';
import AssetForm, { type AssetFormHandle } from '@/components/AssetForm';
import { GooeyButton, GooeyButtonContainer } from '@/components/GooeyButton';
import {
  Save24Filled,
  Dismiss24Filled,
  ArrowDownload24Filled,
  ArrowUpload24Filled,
  Edit24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { Suspense } from 'react';
import type { Asset } from '@/lib/types';

function TagDefaultEditor({
  tag,
  initialValue,
  onSave,
}: {
  tag: string;
  initialValue?: number;
  onSave: (val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue?.toString() || '');

  useEffect(() => {
    setValue(initialValue?.toString() || '');
  }, [initialValue]);

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Input
          type="number"
          value={value}
          onChange={(e, d) => setValue(d.value)}
          style={{ width: 80 }}
          size="small"
        />
        <Button
          icon={<Checkmark24Regular />}
          appearance="subtle"
          size="small"
          onClick={() => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              onSave(num);
              setEditing(false);
            }
          }}
        />
        <Button
          icon={<Dismiss24Regular />}
          appearance="subtle"
          size="small"
          onClick={() => {
            setEditing(false);
            setValue(initialValue?.toString() || '');
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Text size={200} style={{ color: '#666' }}>
        {initialValue ? `Default: ${initialValue} weeks` : 'Set default life'}
      </Text>
      <Button
        icon={<Edit24Regular />}
        appearance="subtle"
        size="small"
        onClick={() => setEditing(true)}
      />
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get('tag');
  const newOpen = searchParams.get('new') === '1';
  const editId = searchParams.get('edit');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const newFormRef = useRef<AssetFormHandle>(null);
  const editFormRef = useRef<AssetFormHandle>(null);
  const [newValid, setNewValid] = useState(false);
  const [editValid, setEditValid] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedAssets, setImportedAssets] = useState<Asset[]>([]);
  const [importedDefaults, setImportedDefaults] = useState<
    Record<string, number>
  >({});
  const [tagDefaults, setTagDefaults] = useState<Record<string, number>>({});

  const grouped = groupAssetsByTag(assets);
  const assetToEdit = useMemo(
    () => assets.find((a) => a.id === editId) || null,
    [assets, editId],
  );

  // Load assets on client side only
  useEffect(() => {
    const loadAssets = async () => {
      const allAssets = await getAllAssets();
      setAssets(allAssets);
    };
    loadAssets();
    setTagDefaults(getTagDefaults());
  }, [refreshKey]);

  // Sync URL tag param with state
  useEffect(() => {
    setActiveTag(tagFromUrl);
  }, [tagFromUrl]);

  const closeDialogs = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('new');
    params.delete('edit');
    const base = '/dashboard';
    const next = params.toString() ? `${base}?${params.toString()}` : base;
    router.push(next as any);
  }, [router, searchParams]);

  const handleUpdateTagDefault = (tag: string, weeks: number) => {
    setTagDefault(tag, weeks);
    setTagDefaults(getTagDefaults());
  };

  const handleSaved = () => {
    setRefreshKey((prev) => prev + 1);
    closeDialogs();
  };

  const handleExportAll = useCallback(() => {
    // Strip id and userId (if present) from assets before exporting
    const assetsToExport = assets.map((asset) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = asset;
      // @ts-ignore - userId might be present at runtime
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, ...cleanAsset } = rest;
      return cleanAsset;
    });

    const exportData = {
      assets: assetsToExport,
      tagDefaults: getTagDefaults(),
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `assets-export-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [assets]);

  const handleImportAll = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          let assetsToImport: Asset[] = [];
          let defaultsToImport: Record<string, number> = {};

          if (Array.isArray(json)) {
            assetsToImport = json;
          } else if (json.assets && Array.isArray(json.assets)) {
            assetsToImport = json.assets;
            defaultsToImport = json.tagDefaults || {};
          } else {
            alert(
              'Invalid file format. Expected an array of assets or an export object.',
            );
            return;
          }

          setImportedAssets(assetsToImport);
          setImportedDefaults(defaultsToImport);
          setImportDialogOpen(true);
        } catch (error) {
          alert('Failed to import assets. Please check the file format.');
          console.error('Import error:', error);
        }
      };
      reader.readAsText(file);

      // Reset the input
      event.target.value = '';
    },
    [],
  );

  const handleImportConfirm = useCallback(
    async (clearCurrent: boolean) => {
      try {
        if (clearCurrent) {
          await clearAllAssets();
        }

        // Save imported defaults
        Object.entries(importedDefaults).forEach(([tag, val]) => {
          setTagDefault(tag, val);
        });
        setTagDefaults(getTagDefaults());

        const promises = importedAssets.map((asset) => {
          // Always generate new IDs during import
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...assetWithoutId } = asset;
          return addAsset(assetWithoutId);
        });

        await Promise.all(promises);

        setRefreshKey((prev) => prev + 1);
        setImportDialogOpen(false);
        setImportedAssets([]);
        setImportedDefaults({});
      } catch (error) {
        console.error('Import failed', error);
        alert('Failed to import assets. Please try again.');
      }
    },
    [importedAssets, importedDefaults],
  );

  const handleImportCancel = useCallback(() => {
    setImportDialogOpen(false);
    setImportedAssets([]);
    setImportedDefaults({});
  }, []);

  const visibleAssets = useMemo(() => {
    let assetsToShow = activeTag ? grouped[activeTag] || [] : assets;

    // Sort by daily cost descending (highest cost first)
    assetsToShow = [...assetsToShow].sort((a, b) => {
      const costA = calculateDailyDepreciation(a);
      const costB = calculateDailyDepreciation(b);
      return costB - costA; // Descending order
    });

    return assetsToShow;
  }, [activeTag, grouped, assets]);

  return (
    <main className="container" key={refreshKey}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Text as="h1" size={800} weight="semibold">
            {activeTag ? `${activeTag}` : 'All Assets'}
          </Text>
          {activeTag && (
            <TagDefaultEditor
              tag={activeTag}
              initialValue={tagDefaults[activeTag]}
              onSave={(val) => handleUpdateTagDefault(activeTag, val)}
            />
          )}
        </div>
        {!activeTag && (
          <GooeyButtonContainer>
            <GooeyButton
              icon={<ArrowDownload24Filled />}
              label="Export"
              onClick={handleExportAll}
              style={{ width: '80px', height: '80px' }}
            />
            <GooeyButton
              icon={<ArrowUpload24Filled />}
              label="Import"
              onClick={handleImportAll}
              style={{ width: '80px', height: '80px' }}
            />
          </GooeyButtonContainer>
        )}
      </div>

      {activeTag ? (
        <div className="grid" style={{ marginTop: 12 }}>
          {visibleAssets.map((a) => (
            <AssetCard
              key={a.id}
              asset={a}
              currentValue={calculateCurrentValue(a)}
            />
          ))}
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([tagA], [tagB]) => tagA.localeCompare(tagB))
          .map(([tag, list]) => {
            // Sort assets within each tag section by daily cost descending
            const sortedList = [...list].sort((a, b) => {
              const costA = calculateDailyDepreciation(a);
              const costB = calculateDailyDepreciation(b);
              return costB - costA; // Descending order
            });

            return (
              <section key={tag} style={{ marginBlock: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text as="h2" size={600} weight="semibold">
                    {tag}
                  </Text>
                  <TagDefaultEditor
                    tag={tag}
                    initialValue={tagDefaults[tag]}
                    onSave={(val) => handleUpdateTagDefault(tag, val)}
                  />
                </div>
                <div className="grid" style={{ marginTop: 12 }}>
                  {sortedList.map((a) => (
                    <AssetCard
                      key={a.id}
                      asset={a}
                      currentValue={calculateCurrentValue(a)}
                    />
                  ))}
                </div>
              </section>
            );
          })
      )}

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Create New Dialog */}
      <Dialog
        open={newOpen}
        onOpenChange={(_, data) => {
          if (!data.open) closeDialogs();
        }}
      >
        <DialogSurface>
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
                <span>Create New Asset</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    aria-label="Save"
                    icon={<Save24Filled />}
                    appearance="primary"
                    size="large"
                    onClick={() => newFormRef.current?.submit()}
                    disabled={!newValid}
                  />
                  <Button
                    aria-label="Close"
                    icon={<Dismiss24Filled />}
                    appearance="subtle"
                    size="large"
                    onClick={closeDialogs}
                  />
                </div>
              </div>
            </DialogTitle>
            <DialogContent>
              <AssetForm
                ref={newFormRef}
                onSaved={handleSaved}
                onCancel={closeDialogs}
                onValidityChange={setNewValid}
              />
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editId}
        onOpenChange={(_, data) => {
          if (!data.open) closeDialogs();
        }}
      >
        <DialogSurface>
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
                  />
                  <Button
                    aria-label="Close"
                    icon={<Dismiss24Filled />}
                    appearance="subtle"
                    size="large"
                    onClick={closeDialogs}
                  />
                </div>
              </div>
            </DialogTitle>
            <DialogContent>
              {assetToEdit ? (
                <AssetForm
                  ref={editFormRef}
                  asset={assetToEdit}
                  onSaved={handleSaved}
                  onCancel={closeDialogs}
                  onValidityChange={setEditValid}
                />
              ) : (
                <Text>Asset not found.</Text>
              )}
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Import Confirmation Dialog */}
      <Dialog
        open={importDialogOpen}
        onOpenChange={(_, data) => {
          if (!data.open) handleImportCancel();
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Import Assets</DialogTitle>
            <DialogContent>
              <Text>
                You are about to import {importedAssets.length} asset
                {importedAssets.length !== 1 ? 's' : ''}. Would you like to
                clear all current assets before importing, or merge with
                existing data?
              </Text>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                  marginTop: 24,
                }}
              >
                <Button appearance="subtle" onClick={handleImportCancel}>
                  Cancel
                </Button>
                <Button onClick={() => handleImportConfirm(false)}>
                  Merge (Keep Existing)
                </Button>
                <Button
                  appearance="primary"
                  onClick={() => handleImportConfirm(true)}
                >
                  Clear & Import
                </Button>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div className="d_loading" />
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
