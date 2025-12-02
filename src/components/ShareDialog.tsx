import React from 'react';
import type { Asset } from '../services/api';
import { shareAssetRequest } from '../services/api';
import { supabase } from '../services/supabaseClient';

interface Props {
  asset: Asset;
  onClose: () => void;
  onShared: (asset: Asset) => void;
}

const ShareDialog: React.FC<Props> = ({ asset, onClose, onShared }) => {
  const [email, setEmail] = React.useState('');
  const [canDownload, setCanDownload] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not signed in');

      const updated = await shareAssetRequest(token, {
        assetId: asset.id,
        toEmail: email,
        canDownload,
        version: asset.version,
      });

      onShared(updated);
      onClose();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          width: 'min(540px, 100%)',
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 20, fontWeight: 600 }}>Share & Permissions</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleShare} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              style={{
                marginTop: 6,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Permission</label>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={canDownload}
                onChange={e => setCanDownload(e.target.checked)}
              />
              <span>Allow download</span>
            </div>
          </div>

          {error && (
            <div style={{ color: '#b91c1c', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '10px 16px',
              borderRadius: 9999,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Sending…' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShareDialog;
