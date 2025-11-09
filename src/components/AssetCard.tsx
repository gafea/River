'use client';
import {
  Card,
  CardHeader,
  Text,
  ProgressBar,
} from '@fluentui/react-components';
import { Asset } from '@/src/lib/types';
import {
  formatCurrency,
  weeksBetween,
  calculateTotalInvested,
  calculateDailyDepreciation,
  calculateCurrentValue,
} from '@/src/lib/utils';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AssetCard({
  asset,
  currentValue: initialCurrentValue,
}: {
  asset: Asset;
  currentValue: number;
}) {
  const router = useRouter();
  const [currentValue, setCurrentValue] = useState(initialCurrentValue);

  // Auto-update current value every 15 seconds
  useEffect(() => {
    const updateCurrentValue = () => {
      setCurrentValue(calculateCurrentValue(asset));
    };

    // Update immediately
    updateCurrentValue();

    // Set up interval to update every 15 seconds
    const interval = setInterval(updateCurrentValue, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [asset]);

  // Calculate remaining life percentage
  const ageWeeks = weeksBetween(asset.purchaseDate);
  const remainingPercentage = Math.max(
    0,
    100 - (ageWeeks / asset.expectedLifeWeeks) * 100,
  );

  // Calculate remaining life end date
  const purchaseDate = new Date(asset.purchaseDate);
  const endDate = new Date(
    purchaseDate.getTime() + asset.expectedLifeWeeks * 7 * 24 * 60 * 60 * 1000,
  );
  const remainingDateText = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Calculate value progress percentage
  const totalInvested = calculateTotalInvested(asset);
  const valueProgressPercentage =
    totalInvested > 0 ? (currentValue / totalInvested) * 100 : 0;

  // Calculate daily cost (depreciation per day)
  const dailyCost = calculateDailyDepreciation(asset);

  return (
    <Card
      style={{
        cursor: 'pointer',
        position: 'relative',
        borderRadius: 16,
        padding: '16px',
        overflow: 'hidden',
        backgroundColor: 'var(--colorNeutralBackground2)',
        transition: 'transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out',
        ...(asset.photoDataUrl && {
          backgroundImage: `url(${asset.photoDataUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }),
      }}
      onClick={() => router.push(`/assets/${asset.id}` as any)}
      className="asset-card"
    >
      {asset.photoDataUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 0,
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {asset.photoDataUrl && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.photoDataUrl}
              alt={asset.name}
              style={{
                width: 80,
                height: 80,
                objectFit: 'cover',
                borderRadius: '50%',
                border: '3px solid var(--colorNeutralBackground3)',
              }}
            />
          </div>
        )}
        <CardHeader
          header={
            <div style={{ textAlign: 'center' }}>
              <Text
                weight="semibold"
                size={500}
                style={{ display: 'block', marginBottom: 4 }}
              >
                {asset.name}
              </Text>
              {asset.description && (
                <Text
                  size={300}
                  style={{
                    color: 'var(--colorNeutralForeground3)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {asset.description}
                </Text>
              )}
            </div>
          }
        />
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: 8,
            }}
          >
            <Text size={700} weight="bold">
              {formatCurrency(currentValue)}
            </Text>
            <Text
              size={300}
              style={{ color: 'var(--colorNeutralForeground3)' }}
            >
              ({formatCurrency(dailyCost)}/day)
            </Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <ProgressBar
              value={valueProgressPercentage}
              max={100}
              style={{ height: 6, borderRadius: 3 }}
            />
          </div>
          <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
            {Math.round(remainingPercentage)}% lifetime remaining (
            {remainingDateText})
          </Text>
        </div>
      </div>
    </Card>
  );
}
