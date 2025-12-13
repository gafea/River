'use client';
import {
  groupAssetsByTag,
  calculateCurrentValue,
  calculateDailyDepreciation,
} from '@/lib/utils';
import { getAllAssets, getTags, setTagDefault } from '@/lib/store';
import AssetCard from '@/components/AssetCard';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Text, Input, Button } from '@fluentui/react-components';
import {
  Edit24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import type { Asset } from '@/lib/types';
import { useUI } from '@/components/UIContext';

function TagDefaultEditor({
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

export default function AssetGrid() {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get('tag');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tags, setTags] = useState<Record<string, number>>({});
  const grouped = groupAssetsByTag(assets);
  const { setPageLoading, triggerTransition } = useUI();

  useEffect(() => {
    const loadAssets = async () => {
      const allAssets = await getAllAssets();
      setAssets(allAssets);
      setTags(getTags());
    };
    loadAssets();
    setPageLoading(false);
  }, [refreshKey, setPageLoading]);

  useEffect(() => {
    setActiveTag(tagFromUrl);
  }, [tagFromUrl]);

  const handleUpdateTagDefault = (tag: string, weeks: number) => {
    setTagDefault(tag, weeks);
    setTags(getTags());
  };

  const visibleAssets = useMemo(() => {
    let assetsToShow = activeTag ? grouped[activeTag] || [] : assets;

    assetsToShow = [...assetsToShow].sort((a, b) => {
      const costA = calculateDailyDepreciation(a);
      const costB = calculateDailyDepreciation(b);
      return costB - costA;
    });

    return assetsToShow;
  }, [activeTag, grouped, assets]);

  return (
    <main className="container" key={refreshKey} style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Text as="h1" size={800} weight="semibold">
          {activeTag ? `${activeTag}` : 'Assets'}
        </Text>
        {activeTag ? (
          <TagDefaultEditor
            tag={activeTag}
            initialValue={tags[activeTag]}
            onSave={(val) => handleUpdateTagDefault(activeTag, val)}
          />
        ) : (
          <Button onClick={() => triggerTransition('/assets')}>Show All</Button>
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
            const sortedList = [...list].sort((a, b) => {
              const costA = calculateDailyDepreciation(a);
              const costB = calculateDailyDepreciation(b);
              return costB - costA;
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
                    initialValue={tags[tag]}
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
    </main>
  );
}
