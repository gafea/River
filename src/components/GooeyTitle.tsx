import React from 'react';

interface GooeyTitleProps {
  text: string;
  charSpacing?: number;
  charPadding?: number;
}

export const GooeyTitle: React.FC<GooeyTitleProps> = ({ text, charSpacing = -5, charPadding = 18 }) => {
  const chars = text.split('');
  const size = 24 + charPadding * 2;

  return (
    <div style={{ position: 'relative', padding: '20px', width: 'fit-content' }}>
      {/* SVG Filter Definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Layer 1: The Gooey Background Bubbles */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          filter: 'url(#goo)',
          // We need to ensure the container allows the blur to spill out without clipping if necessary,
          // but usually filter handles it.
        }}
      >
        {chars.map((char, index) => (
          <div
            key={index}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: char === ' ' ? 'transparent' : '#2288ff',
              margin: `0 ${charSpacing}px`, // Negative margin for overlap
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* We put the text here but make it transparent so it takes up space if needed, 
                but actually we just need the bubble. 
                If we put text here, it will be blurred/gooey'd. 
                Let's keep it empty or transparent. */}
          </div>
        ))}
      </div>

      {/* Layer 2: The Sharp Text */}
      <div
        style={{
          position: 'absolute',
          top: '20px', // Matches padding of container
          left: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          pointerEvents: 'none', // Let clicks pass through to bubbles if needed
        }}
      >
        {chars.map((char, index) => (
          <div
            key={index}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              margin: `0 ${charSpacing}px`, // Must match Layer 1 exactly
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-family-base)', // Try to inherit font
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </div>
        ))}
      </div>
    </div>
  );
};
