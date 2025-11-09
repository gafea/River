'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAllAssets } from '@/src/lib/store';
import { calculateCurrentValue } from '@/src/lib/utils';
import AssetCard from '@/src/components/AssetCard';
import { Text, Input, InputOnChangeData } from '@fluentui/react-components';
import { Suspense } from 'react';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize search term from URL
  useEffect(() => {
    const urlSearch = searchParams.get('q') || '';
    setSearchTerm(urlSearch);
  }, [searchParams]);

  // Load assets on client side only
  useEffect(() => {
    setAssets(getAllAssets());
  }, []);

  // Update URL when search term changes (debounced)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        params.set('q', searchTerm.trim());
      } else {
        params.delete('q');
      }

      const newUrl = params.toString()
        ? `/search?${params.toString()}`
        : '/search';
      if (window.location.pathname + window.location.search !== newUrl) {
        router.replace(newUrl as any);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, router, searchParams]);

  // Filter assets based on search term
  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(term) ||
        (asset.description && asset.description.toLowerCase().includes(term)),
    );
  }, [assets, searchTerm]);

  return (
    <main className="container">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text as="h1" size={800} weight="semibold">
          Search Assets
        </Text>
      </div>

      <div style={{ marginTop: 12, marginBottom: 32 }}>
        <Input
          placeholder="Search by asset name or description..."
          value={searchTerm}
          onChange={(_, data: InputOnChangeData) => setSearchTerm(data.value)}
          style={{ width: '100%', maxWidth: 400 }}
          size="large"
        />
      </div>

      {searchTerm.trim() && (
        <div style={{ marginBottom: 24 }}>
          <Text size={400} style={{ color: 'var(--colorNeutralForeground3)' }}>
            Found {filteredAssets.length} asset
            {filteredAssets.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </Text>
        </div>
      )}

      {searchTerm.trim() && filteredAssets.length > 0 && (
        <div className="grid">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              currentValue={calculateCurrentValue(asset)}
            />
          ))}
        </div>
      )}

      {searchTerm.trim() && filteredAssets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Text size={500} style={{ color: 'var(--colorNeutralForeground3)' }}>
            No assets found matching "{searchTerm}"
          </Text>
        </div>
      )}

      {!searchTerm.trim() && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Text size={500} style={{ color: 'var(--colorNeutralForeground3)' }}>
            Enter a search term to find assets
          </Text>
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Text size={400}>Loading search...</Text>
          </div>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
