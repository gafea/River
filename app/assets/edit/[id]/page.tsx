'use client';
import AssetForm from '@/components/AssetForm';
import { Text } from '@fluentui/react-components';
import { getAllAssets } from '@/lib/store';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Asset } from '@/lib/types';

export default function EditAssetPage() {
  const params = useParams();
  const id = params.id as string;
  const [assets, setAssets] = useState<Asset[]>([]);
  const asset = assets.find((a) => a.id === id);

  useEffect(() => {
    const loadAssets = async () => {
      const allAssets = await getAllAssets();
      setAssets(allAssets);
    };
    loadAssets();
  }, []);

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
      <Text as="h1" size={800} weight="semibold" style={{ marginBottom: 24 }}>
        Edit Asset
      </Text>
      <AssetForm asset={asset} />
    </main>
  );
}
