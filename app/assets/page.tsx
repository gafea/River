'use client';
import { useEffect, useState } from 'react';
import { Asset } from '@/lib/types';
import { getAllAssets } from '@/lib/store';
import { Text } from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { calculateCurrentValue } from '@/lib/utils';
import { GooeyButton, GooeyButtonContainer } from '@/components/GooeyButton';
import { useUI } from '@/components/UIContext';
import AssetCard from '@/components/AssetCard';

export default function AllAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const { triggerTransition } = useUI();

  useEffect(() => {
    getAllAssets().then(setAssets);
  }, []);

  return (
    <main className="container">
      <div className="flex items-center gap-4 mb-8">
        <GooeyButtonContainer>
          <GooeyButton
            icon={<ArrowLeft24Regular />}
            label="Back"
            onClick={() => triggerTransition('/')}
            style={{ width: '80px', height: '80px' }}
          />
        </GooeyButtonContainer>
        <br />
        <Text size={800} weight="bold">
          All Assets
        </Text>
      </div>
      <br />
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {assets.length === 0 && <Text>No assets yet.</Text>}
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            currentValue={calculateCurrentValue(asset)}
          />
        ))}
      </div>
    </main>
  );
}
