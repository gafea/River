'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useUI } from './UIContext';
import { Text } from '@fluentui/react-components';

function generateWavyCirclePath(
  radius: number = 80,
  amplitude: number = 3,
  waves: number = 12,
  points: number = 128,
): string {
  let path = '';
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const r = radius + amplitude * Math.sin(waves * angle);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    const rx = Math.round(x * 10) / 10;
    const ry = Math.round(y * 10) / 10;

    const command = i === 0 ? 'M' : 'L';
    path += `${command}${rx},${ry}`;
  }
  path += 'Z';
  return path;
}

export default function RiverTransition() {
  const { isNavigating, isPageLoading, showTransitionOverlay } = useUI();
  const [stage, setStage] = useState<
    'hidden' | 'entering' | 'holding' | 'exiting'
  >('hidden');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDev = process.env.NODE_ENV === 'development';
  const DURATION = 550;

  useEffect(() => {
    if (isNavigating || showTransitionOverlay) {
      const delay = isDev ? 0 : 100;

      timeoutRef.current = setTimeout(() => {
        setStage('entering');
        setTimeout(() => {
          setStage((prev) => (prev === 'entering' ? 'holding' : prev));
        }, DURATION);
      }, delay);
    } else {
      // Navigation finished
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Only exit if not navigating AND not waiting for page load AND not showing overlay
      if (
        !isPageLoading &&
        !showTransitionOverlay &&
        (stage === 'entering' || stage === 'holding')
      ) {
        const isEarlyInterrupt = isDev && stage === 'entering';
        const exitDelay = isEarlyInterrupt ? DURATION * 2 : 0;

        const exitTimer = setTimeout(() => {
          setStage('exiting');
          setTimeout(() => {
            setStage('hidden');
          }, DURATION);
        }, exitDelay);

        return () => clearTimeout(exitTimer);
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isNavigating, isPageLoading, showTransitionOverlay]); // Re-run when isPageLoading changes

  const isHidden = stage === 'hidden';
  const isEntering = stage === 'entering';
  const isHolding = stage === 'holding';

  const blobPath = useMemo(() => generateWavyCirclePath(80, 3, 12, 128), []);
  const blobMask = `url("data:image/svg+xml,%3Csvg viewBox='-100 -100 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='${blobPath}' /%3E%3C/svg%3E")`;
  const maskSize = isEntering || isHolding ? '200vmax' : '0px';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: isHidden ? 'none' : 'all',
        visibility: isHidden ? 'hidden' : 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <style jsx global>{`
        @keyframes spinSlow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        @keyframes spinReverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '150vmax',
          height: '150vmax',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#0078d4',

          maskImage: blobMask,
          WebkitMaskImage: blobMask,
          maskSize: maskSize,
          WebkitMaskSize: maskSize,
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',

          transition: `mask-size ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), -webkit-mask-size ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          animation: 'spinSlow 20s linear infinite',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '400px',
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !isHidden ? 1 : 0,
            transform: !isHidden ? 'scale(1)' : 'scale(0.5)',
            transition: isEntering
              ? `opacity ${DURATION}ms ease, transform ${DURATION}ms cubic-bezier(0.33, 1.5, 0.5, 1)`
              : 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'white',
              maskImage: blobMask,
              WebkitMaskImage: blobMask,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spinReverse 20s linear infinite',
            }}
          >
            <Text
              size={800}
              weight="bold"
              align="center"
              style={{ color: '#0078d4', fontSize: '4rem', marginBottom: 40 }}
            >
              River
            </Text>
            <div className="d_loading" />
          </div>
        </div>
      </div>
    </div>
  );
}
