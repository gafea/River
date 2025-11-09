'use client';
import AssetForm from '@/src/components/AssetForm';
import { Text } from '@fluentui/react-components';
import { getAllAssets } from '@/src/lib/store';
import { useParams } from 'next/navigation';

export default function EditAssetPage() {
  const params = useParams();
  const id = params.id as string;
  const assets = getAllAssets();
  const asset = assets.find((a) => a.id === id);

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
