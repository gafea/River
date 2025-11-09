'use client';
import AssetForm from '@/src/components/AssetForm';
import { Text } from '@fluentui/react-components';

export default function NewAssetPage() {
  return (
    <main className="container">
      <Text as="h1" size={800} weight="semibold" style={{ marginBottom: 24 }}>
        Create New Asset
      </Text>
      <AssetForm />
    </main>
  );
}
