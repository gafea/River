'use client';
import {
  groupAssetsByTag,
  calculateCurrentValue,
  calculateDailyDepreciation,
} from '@/src/lib/utils';
import { getAllAssets } from '@/src/lib/store';
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
import { Save24Filled, Dismiss24Filled } from '@fluentui/react-icons';
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
      <Text as="h1" size={800} weight="semibold" style={{ marginBottom: 24 }}>
        {activeTag ? `${activeTag}` : 'All Assets'}
      </Text>

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
