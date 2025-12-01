'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useUI } from './UIContext';
import { Text } from '@fluentui/react-components';

export default function RiverTransition() {
  const { isNavigating } = useUI();
  const [stage, setStage] = useState<'hidden' | 'entering' | 'holding' | 'exiting'>('hidden');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDev = process.env.NODE_ENV === 'development';
  const DURATION = 650; // 0.65s duration

  useEffect(() => {
    if (isNavigating) {
      // Delay before showing transition
      // In dev mode, show immediately to debug
      const delay = isDev ? 0 : 200;
      
      timeoutRef.current = setTimeout(() => {
        setStage('entering');
        
        // Wait for enter animation to complete before allowing hold
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

      if (stage === 'entering' || stage === 'holding') {
        // Interrupt or finish
        
        // In dev, force full animation cycle if it was interrupted early
        const isEarlyInterrupt = isDev && stage === 'entering';
        const exitDelay = isEarlyInterrupt ? DURATION * 2 : 0;

        const exitTimer = setTimeout(() => {
            setStage('exiting');
            setTimeout(() => {
              setStage('hidden');
            }, DURATION); // Exit animation duration
        }, exitDelay);
        
        return () => clearTimeout(exitTimer);
      } else if (stage === 'hidden') {
        // If we were waiting for delay and navigation finished, do nothing
      }
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isNavigating]); // Removed stage dependency to avoid loops, but logic inside handles stage updates

  const isHidden = stage === 'hidden';
  const isEntering = stage === 'entering';
  const isHolding = stage === 'holding';
  
  // Wavy Circle Mask
  // We use a radial gradient with a "wavy" edge simulated by a complex polygon or SVG
  // Since CSS masks are powerful, let's use an SVG mask with a wavy circle path.
  // A simple circle is: M 0 0 a 50 50 0 1 0 100 0 a 50 50 0 1 0 -100 0
  // A wavy circle needs more points.
  
  // Let's use a simple circle for now as "wavy circle" is complex to generate in path string manually without a library.
  // But user asked for "wavey circle".
  // I'll use a star-like polygon with rounded corners to simulate waves.
  // Or I can use the previous wave path but mapped to polar coordinates? No too hard.
  // Let's use a "blob" shape.
  
  const blobPath = "M80.0,0.0L83.3,8.8L83.1,17.7L78.9,25.6L72.1,32.1L65.5,37.8L60.9,44.2L57.9,52.2L54.9,61.0L49.8,68.6L42.2,73.0L33.0,74.0L23.8,73.3L15.6,73.4L8.0,75.9L0.0,80.0L-8.8,83.3L-17.7,83.1L-25.6,78.9L-32.1,72.1L-37.8,65.5L-44.2,60.9L-52.2,57.9L-61.0,54.9L-68.6,49.8L-73.0,42.2L-74.0,33.0L-73.3,23.8L-73.4,15.6L-75.9,8.0L-80.0,0.0L-83.3,-8.8L-83.1,-17.7L-78.9,-25.6L-72.1,-32.1L-65.5,-37.8L-60.9,-44.2L-57.9,-52.2L-54.9,-61.0L-49.8,-68.6L-42.2,-73.0L-33.0,-74.0L-23.8,-73.3L-15.6,-73.4L-8.0,-75.9L-0.0,-80.0L8.8,-83.3L17.7,-83.1L25.6,-78.9L32.1,-72.1L37.8,-65.5L44.2,-60.9L52.2,-57.9L61.0,-54.9L68.6,-49.8L73.0,-42.2L74.0,-33.0L73.3,-23.8L73.4,-15.6L75.9,-8.0L80.0,-0.0Z";
  
  const blobMask = `url("data:image/svg+xml,%3Csvg viewBox='-100 -100 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='${blobPath}' /%3E%3C/svg%3E")`;

  // Size:
  // Hidden: 0px
  // Entering/Holding: 300vmax (Cover screen)
  // Exiting: 0px (Shrink back)
  
  const maskSize = (isEntering || isHolding) ? '200vmax' : '0px';

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
      }}
    >
      {/* Expanding Blob Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#0078d4',
          
          maskImage: blobMask,
          WebkitMaskImage: blobMask,
          maskSize: maskSize,
          WebkitMaskSize: maskSize,
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          
          transition: `mask-size ${DURATION}ms ease-in-out, -webkit-mask-size ${DURATION}ms ease-in-out`,
          
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Static Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
           <Text size={900} weight="bold" align="center" style={{ color: 'white', fontSize: '4rem', marginBottom: 40 }}>River</Text>
           <div className="d_loading" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
      </div>
    </div>
  );
}
