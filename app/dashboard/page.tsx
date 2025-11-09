'use client';
import {
  groupAssetsByTag,
  calculateCurrentValue,
  calculateDailyDepreciation,
} from '@/src/lib/utils';
import { getAllAssets, addAsset, clearAllAssets } from '@/src/lib/store';
import AssetCard from '@/src/components/AssetCard';
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
} from '@fluentui/react-components';
import AssetForm, { type AssetFormHandle } from '@/src/components/AssetForm';
import {
  Save24Filled,
  Dismiss24Filled,
  ArrowDownload24Filled,
  ArrowUpload24Filled,
} from '@fluentui/react-icons';
import { Suspense } from 'react';
import type { Asset } from '@/src/lib/types';

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

  const grouped = groupAssetsByTag(assets);
  const assetToEdit = useMemo(
    () => assets.find((a) => a.id === editId) || null,
    [assets, editId],
  );

  // Load assets on client side only
  useEffect(() => {
    setAssets(getAllAssets());
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

  const handleSaved = () => {
    setRefreshKey((prev) => prev + 1);
    closeDialogs();
  };

  const handleExportAll = useCallback(() => {
    const allAssets = getAllAssets();
    const dataStr = JSON.stringify(allAssets, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `assets-export-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, []);

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
          const importedAssets = JSON.parse(
            e.target?.result as string,
          ) as Asset[];
          // Validate that it's an array of assets
          if (!Array.isArray(importedAssets)) {
            alert('Invalid file format. Expected an array of assets.');
            return;
          }

          setImportedAssets(importedAssets);
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
    (clearCurrent: boolean) => {
      if (clearCurrent) {
        clearAllAssets();
      }

      importedAssets.forEach((asset) => {
        if (clearCurrent) {
          // Keep original IDs when clearing current data
          addAsset(asset);
        } else {
          // Generate new IDs to avoid conflicts when merging
          const { id, ...assetWithoutId } = asset;
          addAsset(assetWithoutId);
        }
      });

      setRefreshKey((prev) => prev + 1);
      setImportDialogOpen(false);
      setImportedAssets([]);
    },
    [importedAssets],
  );

  const handleImportCancel = useCallback(() => {
    setImportDialogOpen(false);
    setImportedAssets([]);
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
        <Text as="h1" size={800} weight="semibold">
          {activeTag ? `${activeTag}` : 'All Assets'}
        </Text>
        {!activeTag && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ArrowDownload24Filled />} onClick={handleExportAll}>
              Export All
            </Button>
            <Button icon={<ArrowUpload24Filled />} onClick={handleImportAll}>
              Import
            </Button>
          </div>
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
        Object.entries(grouped).map(([tag, list]) => (
          <section key={tag} style={{ marginBlock: 24 }}>
            <Text
              as="h2"
              size={600}
              weight="semibold"
              style={{ marginBottom: 12 }}
            >
              {tag}
            </Text>
            <div className="grid" style={{ marginTop: 12 }}>
              {list.map((a) => (
                <AssetCard
                  key={a.id}
                  asset={a}
                  currentValue={calculateCurrentValue(a)}
                />
              ))}
            </div>
          </section>
        ))
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
            <Text size={400}>Loading dashboard...</Text>
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
