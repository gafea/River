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
  const startTimeRef = useRef<number>(0);
  const isDev = process.env.NODE_ENV === 'development';
  const DURATION = 650;

  useEffect(() => {
    let active = true;

    if (isNavigating || showTransitionOverlay) {
      if (stage === 'hidden' && !timeoutRef.current) {
        const delay = isDev ? 0 : 100;

        timeoutRef.current = setTimeout(() => {
          if (!active) return;
          setStage('entering');
          startTimeRef.current = Date.now();
          setTimeout(() => {
            if (active)
              setStage((prev) => (prev === 'entering' ? 'holding' : prev));
          }, DURATION);
        }, delay);
      }
    } else {
      // Navigation finished
      if (stage === 'hidden' && timeoutRef.current) {
        // Cancel if we haven't started yet
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      } else if (stage === 'entering' || stage === 'holding') {
        // Wait for transition to finish if needed
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, DURATION * 2 - elapsed);

        const exitTimer = setTimeout(() => {
          if (active) {
            setStage('exiting');
            setTimeout(() => {
              if (active) {
                setStage('hidden');
                timeoutRef.current = null;
              }
            }, DURATION);
          }
        }, remaining);

        return () => clearTimeout(exitTimer);
      }
    }

    return () => {
      active = false;
    };
  }, [isNavigating, isPageLoading, showTransitionOverlay, stage]);

  const isHidden = stage === 'hidden';
  const isEntering = stage === 'entering';
  const isHolding = stage === 'holding';
  const isExiting = stage === 'exiting';

  const blobPath = useMemo(() => generateWavyCirclePath(80, 3, 12, 128), []);
  const blobMask = `url("data:image/svg+xml,%3Csvg viewBox='-100 -100 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='${blobPath}' /%3E%3C/svg%3E")`;

  const getMaskSize = () => {
    if (isHidden) return '300vmax';
    if (isEntering) return '0px';
    if (isHolding) return '0px';
    if (isExiting) return '300vmax';
    return '300vmax';
  };

  const maskSize = getMaskSize();

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
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
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
          inset: 0,
          backgroundColor: '#0078d4',
          maskImage: `${blobMask}, linear-gradient(black, black)`,
          WebkitMaskImage: `${blobMask}, linear-gradient(black, black)`,
          maskSize: `${maskSize}, 100% 100%`,
          WebkitMaskSize: `${maskSize}, 100% 100%`,
          maskPosition: 'center, center',
          WebkitMaskPosition: 'center, center',
          maskRepeat: 'no-repeat, no-repeat',
          WebkitMaskRepeat: 'no-repeat, no-repeat',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'destination-out',
          transitionDelay: isExiting ? `${DURATION}ms` : '0ms',
          transitionDuration: `${DURATION}ms`,
          transitionTimingFunction: 'ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      ></div>
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          scale: !isHidden ? '1' : '0',
          animation: 'spinSlow 20s linear infinite',
          transitionDelay: !isHidden ? `${DURATION / 4}ms` : '0ms',
          transitionDuration: `${DURATION / 2}ms`,
          transitionTimingFunction: !isHidden
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'cubic-bezier(0.36, 0, 0.66, -0.56)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
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
          <div
            className="d_loading"
            style={{ transitionDuration: '0s', transitionDelay: '0s' }}
          />
        </div>
      </div>
    </div>
  );
}
