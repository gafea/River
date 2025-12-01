import React from 'react';

interface GooeyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label?: string;
  active?: boolean;
}

export const GooeyButtonContainer: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties; innerStyle?: React.CSSProperties }> = ({
  children,
  className,
  style,
  innerStyle,
}) => {
  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="goo-buttons">
            <feColorMatrix
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div style={{ filter: 'url(#goo-buttons)', display: 'flex', flexWrap: 'wrap', gap: '10px', ...innerStyle }}>
        {children}
      </div>
    </div>
  );
};

export const GooeyButton = React.forwardRef<HTMLButtonElement, GooeyButtonProps>(
  ({ icon, label, active, style, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`gooey-button ${className || ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: active ? '#005a9e' : 'var(--colorNeutralBackground3)',
          color: active ? 'white' : 'var(--colorNeutralForeground1)',
          padding: '16px',
          borderRadius: '20px', // High border radius for bubble effect
          cursor: 'pointer',
          minWidth: '90px',
          minHeight: '60px',
          outline: 'none',
          ...style,
        }}
        {...props}
      >
        {icon && <div style={{ marginBottom: style?.flexDirection === 'row' ? 0 : '8px', fontSize: '32px', display: 'flex' }}>{icon}</div>}
        {label && <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>}
      </button>
    );
  }
);
GooeyButton.displayName = 'GooeyButton';
