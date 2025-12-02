import React from 'react';
import type { Asset } from '../services/api';

interface Props {
  asset: Asset;
  onOpenDetails: () => void;
  onOpenShare?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  
}

const statusColor: Record<string, string> = {
  ready: '#16a34a',
  uploading: '#2563eb',
  draft: '#6b7280',
  corrupt: '#dc2626',
};

export default function FileCard({
  asset,
  onOpenDetails,
  onOpenShare,
  onDownload,
  onDelete,
}: Props) {
  const sizeMB = (asset.size / (1024 * 1024)).toFixed(2);
  const created = new Date(asset.createdAt);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // close on outside click
  React.useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(v => !v);
  };

  const handleCardClick = () => {
    if (!menuOpen) onOpenDetails();
  };

  return (
    <div
      style={{
        width: 280,
        borderRadius: 24,
        background: 'linear-gradient(135deg,#f9fafb,#e5f0ff)',
        boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={handleCardClick}
    >
      {/* thumbnail */}
      <div
        style={{
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb',
          fontSize: 64,
        }}
      >
        📽️
      </div>

      <div style={{ padding: '14px 18px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div
            style={{
              maxWidth: 190,
              fontWeight: 600,
              fontSize: 15,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
            title={asset.filename}
          >
            {asset.filename}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 9999,
                background: '#ecfdf3',
                color: statusColor[asset.status] || '#6b7280',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {asset.status}
            </span>

            <button
              onClick={toggleMenu}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 2,
                borderRadius: 9999,
              }}
            >
              <span style={{ letterSpacing: 1 }}>⋯</span>
            </button>
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
          <span>{sizeMB} MB</span>
          <span>{created.toLocaleDateString()}</span>
        </div>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            right: 14,
            top: 60,
            width: 220,
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 18px 45px rgba(15,23,42,0.18)',
            padding: '8px 0',
            fontSize: 14,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => {
              onOpenDetails();
              setMenuOpen(false);
            }}
            style={menuItemStyle}
          >
            👁️ View Details
          </button>
          <button
            onClick={() => {
              onOpenShare?.();
              setMenuOpen(false);
            }}
            style={menuItemStyle}
          >
            🔗 Share &amp; Permissions
          </button>
          <button
            onClick={() => {
              onDownload?.();
              setMenuOpen(false);
            }}
            style={menuItemStyle}
          >
            ⬇️ Download
          </button>
          <button
            onClick={() => {
              onDelete?.();
              setMenuOpen(false);
            }}
            style={{ ...menuItemStyle, color: '#b91c1c' }}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 14px',
  textAlign: 'left',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
};
