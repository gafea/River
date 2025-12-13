'use client';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Asset, IncomeSource } from '@/lib/types';
import {
  calculateDailyDepreciation,
  formatCurrency,
  weeksBetween,
  calculateCurrentValue,
} from '@/lib/utils';
import {
  Text,
  Button,
  Input,
  Popover,
  PopoverSurface,
  PopoverTrigger,
} from '@fluentui/react-components';
import {
  Edit24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { useUI } from './UIContext';

interface RiverVisualizerProps {
  assets: Asset[];
  sources: IncomeSource[];
  entries: any[];
  onUpdateSource: (id: string, amount: number) => void;
}

export const RiverVisualizer: React.FC<RiverVisualizerProps> = ({
  assets,
  sources,
  entries,
  onUpdateSource,
}) => {
  const { triggerTransition } = useUI();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 50) {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + (e.deltaX > 0 ? 1 : -1));
      if (newDate.getMonth() !== currentDate.getMonth()) {
        setCurrentDate(newDate);
      }
    }
  };

  const handleAssetClick = (id: string) => {
    triggerTransition(`/assets/${id}`);
  };

  const handleSaveSource = (id: string) => {
    const amount = parseFloat(editAmount);
    if (!isNaN(amount) && amount >= 0) {
      onUpdateSource(id, amount);
      setEditingSourceId(null);
    }
  };

  const { totalIncome, totalExpenses, activeAssets, riverHeads } =
    useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const activeAssets = assets.filter((a) => !a.isSold);

      const totalExpenses = activeAssets.reduce((acc, asset) => {
        return acc + calculateDailyDepreciation(asset) * daysInMonth;
      }, 0);

      const fixedIncome = sources
        .filter((s) => s.type === 'FIXED')
        .reduce((acc, s) => acc + (s.amount || 0), 0);

      const monthStr = currentDate.toISOString().slice(0, 7);
      const dynamicIncome = entries
        .filter((e) => e.date.startsWith(monthStr))
        .reduce((acc, e) => acc + e.amount, 0);

      const totalIncome = fixedIncome + dynamicIncome;

      const heads = sources
        .map((s) => {
          let amount = 0;
          if (s.type === 'FIXED') amount = s.amount || 0;
          else {
            amount = entries
              .filter((e) => e.sourceId === s.id && e.date.startsWith(monthStr))
              .reduce((acc, e) => acc + e.amount, 0);
          }
          return { ...s, currentAmount: amount };
        })
        .filter((s) => s.currentAmount > 0);

      return { totalIncome, totalExpenses, activeAssets, riverHeads: heads };
    }, [assets, sources, entries, currentDate]);

  if (dimensions.width === 0) {
    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100vh', backgroundColor: '#f0f9ff' }}
      />
    );
  }

  const MAX_RIVER_WIDTH = dimensions.height * 0.6;
  const MIN_RIVER_WIDTH = 20;
  const SCALE_FACTOR = totalIncome > 0 ? MAX_RIVER_WIDTH / totalIncome : 0;
  const HEAD_GAP = 40;

  const startWidth = totalIncome * SCALE_FACTOR;
  const endWidth = Math.max(
    MIN_RIVER_WIDTH,
    (totalIncome - totalExpenses) * SCALE_FACTOR,
  );

  const centerY = dimensions.height / 2;
  const mergeX = dimensions.width * 0.2;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayProgress = currentDate.getDate() / daysInMonth;
  const shipX = mergeX + (dimensions.width - mergeX) * dayProgress;

  // Calculate total height of heads including gaps
  const totalHeadsHeight = riverHeads.reduce(
    (acc, h) => acc + h.currentAmount * SCALE_FACTOR,
    0,
  );
  const totalGapHeight = Math.max(0, riverHeads.length - 1) * HEAD_GAP;
  const totalStartHeight = totalHeadsHeight + totalGapHeight;

  const headPaths = riverHeads.map((head, i) => {
    const headHeight = head.currentAmount * SCALE_FACTOR;

    // Calculate Y position for this head
    let currentY = centerY - totalStartHeight / 2;
    for (let j = 0; j < i; j++) {
      currentY += riverHeads[j].currentAmount * SCALE_FACTOR + HEAD_GAP;
    }
    const startY = currentY + headHeight / 2;

    // Calculate target Y at merge point (no gaps)
    const totalMergeHeight = totalHeadsHeight; // No gaps at merge
    let mergeY = centerY - totalMergeHeight / 2;
    for (let j = 0; j < i; j++) {
      mergeY += riverHeads[j].currentAmount * SCALE_FACTOR;
    }
    const targetY = mergeY + headHeight / 2;

    return (
      <g key={head.id}>
        <path
          d={`M 0 ${startY - headHeight / 2} L 0 ${startY + headHeight / 2} C ${mergeX / 2} ${startY + headHeight / 2}, ${mergeX / 2} ${targetY + headHeight / 2}, ${mergeX} ${targetY + headHeight / 2} L ${mergeX} ${targetY - headHeight / 2} C ${mergeX / 2} ${targetY - headHeight / 2}, ${mergeX / 2} ${startY - headHeight / 2}, 0 ${startY - headHeight / 2} Z`}
          fill="#60A5FA"
          opacity={0.8}
        />
        {/* Head Indicator & Edit */}
        <foreignObject x={10} y={startY - 15} width={120} height={60}>
          <div className="flex items-center gap-2">
            <Popover
              open={editingSourceId === head.id}
              onOpenChange={(_, data) => {
                if (!data.open) setEditingSourceId(null);
              }}
            >
              <PopoverTrigger disableButtonEnhancement>
                <button
                  className="bg-white/90 hover:bg-white text-blue-600 text-xs px-2 py-1 rounded shadow-sm flex items-center gap-1 transition-colors"
                  onClick={() => {
                    setEditingSourceId(head.id);
                    setEditAmount(head.currentAmount.toString());
                  }}
                >
                  {head.name}
                  <br />
                  {formatCurrency(head.currentAmount)}
                </button>
              </PopoverTrigger>
              <PopoverSurface>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e, d) => setEditAmount(d.value)}
                    size="small"
                    style={{ width: 80 }}
                  />
                  <Button
                    icon={<Checkmark24Regular />}
                    appearance="primary"
                    size="small"
                    onClick={() => handleSaveSource(head.id)}
                  />
                  <Button
                    icon={<Dismiss24Regular />}
                    appearance="subtle"
                    size="small"
                    onClick={() => setEditingSourceId(null)}
                  />
                </div>
              </PopoverSurface>
            </Popover>
          </div>
        </foreignObject>
      </g>
    );
  });

  const mainRiverPath = `
    M ${mergeX} ${centerY - startWidth / 2}
    L ${dimensions.width} ${centerY - endWidth / 2}
    L ${dimensions.width} ${centerY + endWidth / 2}
    L ${mergeX} ${centerY + startWidth / 2}
    Z
  `;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f0f9ff', // blue-50
      }}
      onWheel={handleWheel}
    >
      <div
        style={{
          position: 'absolute',
          top: '2rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <Text size={900} weight="bold" style={{ color: '#0288d1' }}>
          {currentDate.toLocaleDateString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </div>

      <svg
        width={dimensions.width}
        height={dimensions.height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        {headPaths}
        <path d={mainRiverPath} fill="url(#riverGradient)" />

        {/* Boat */}
        <g transform={`translate(${shipX}, ${centerY})`}>
          <text x="0" y="10" textAnchor="middle" fontSize="40">
            ⛵
          </text>
        </g>

        {/* Net Gain Indicator */}
        <g transform={`translate(${dimensions.width - 20}, ${centerY})`}>
          <text
            x="-10"
            y="0"
            textAnchor="end"
            fill={totalIncome - totalExpenses >= 0 ? '#059669' : '#DC2626'}
            fontSize="14"
            fontWeight="bold"
            dominantBaseline="middle"
          >
            Net: {formatCurrency(totalIncome - totalExpenses)}
          </text>
        </g>

        {activeAssets.map((asset, index) => {
          const x =
            mergeX +
            ((index + 1) * (dimensions.width - mergeX)) /
              (activeAssets.length + 1);
          const riverTopAtX =
            centerY -
            (startWidth -
              (startWidth - endWidth) *
                ((x - mergeX) / (dimensions.width - mergeX))) /
              2;
          const riverBottomAtX =
            centerY +
            (startWidth -
              (startWidth - endWidth) *
                ((x - mergeX) / (dimensions.width - mergeX))) /
              2;

          // Position assets outside the river
          const isTop = index % 2 === 0;
          const assetY = isTop ? riverTopAtX - 100 : riverBottomAtX + 100;
          const connectionY = isTop ? riverTopAtX : riverBottomAtX;

          return (
            <line
              key={`line-${asset.id}`}
              x1={x}
              y1={connectionY}
              x2={x}
              y2={assetY}
              stroke="rgba(96, 165, 250, 0.5)"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {activeAssets.map((asset, index) => {
        const x =
          mergeX +
          ((index + 1) * (dimensions.width - mergeX)) /
            (activeAssets.length + 1);
        const riverTopAtX =
          centerY -
          (startWidth -
            (startWidth - endWidth) *
              ((x - mergeX) / (dimensions.width - mergeX))) /
            2;
        const riverBottomAtX =
          centerY +
          (startWidth -
            (startWidth - endWidth) *
              ((x - mergeX) / (dimensions.width - mergeX))) /
            2;

        const isTop = index % 2 === 0;
        const y = isTop ? riverTopAtX - 100 : riverBottomAtX + 100;

        const ageWeeks = weeksBetween(asset.purchaseDate);
        const remainingPercentage = Math.max(
          0,
          100 - (ageWeeks / asset.expectedLifeWeeks) * 100,
        );
        const radius = 32;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset =
          circumference - (remainingPercentage / 100) * circumference;

        return (
          <div
            key={asset.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: hoveredAssetId === asset.id ? 50 : 1,
            }}
            onClick={() => handleAssetClick(asset.id)}
            onMouseEnter={() => setHoveredAssetId(asset.id)}
            onMouseLeave={() => setHoveredAssetId(null)}
          >
            <div
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  transform: 'rotate(-90deg)',
                }}
              >
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke={remainingPercentage < 20 ? '#ef4444' : '#10b981'}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  overflow: 'hidden',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {asset.photoDataUrl ? (
                  <img
                    src={asset.photoDataUrl}
                    alt={asset.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                    {asset.name.substring(0, 2)}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '0.5rem',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                fontSize: '0.75rem',
                borderRadius: '0.25rem',
                padding: '0.25rem 0.5rem',
                whiteSpace: 'nowrap',
                zIndex: 20,
                pointerEvents: 'none',
                opacity: hoveredAssetId === asset.id ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{asset.name}</div>
              <div>Val: {formatCurrency(calculateCurrentValue(asset))}</div>
              <div>
                Cost/Day: {formatCurrency(calculateDailyDepreciation(asset))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
