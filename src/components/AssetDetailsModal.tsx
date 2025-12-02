import React from "react";
import type { Asset } from "../services/api";
import ShareDialog from "./ShareDialog";
import { getDownloadUrlRequest } from "../services/api";
import { supabase } from "../services/supabaseClient";
interface Props {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onShared: (updated: Asset) => void;
}

const AssetDetailsModal: React.FC<Props> = ({
  asset,
  open,
  onClose,
  onShared,
}) => {
  const [showShare, setShowShare] = React.useState(false);
  const handleDownload = async () => {
  if (!asset) return;
  try {
    // Show some status message or loader if desired
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('Not signed in');

    const downloadUrl = await getDownloadUrlRequest(token, asset.id);
    if (!downloadUrl) throw new Error('Failed to get download URL');

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = asset.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err: any) {
    // Optional: handle error UI here
    console.error('Download failed:', err.message ?? err);
  }
};

  if (!open || !asset) return null;

  const created = new Date(asset.createdAt);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 40,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "min(960px, 100%)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>File Details</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: "20px 28px", overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 24 }}>
            {/* Thumbnail area */}
            <div
              style={{
                flex: "0 0 260px",
                height: 180,
                borderRadius: 18,
                background: "linear-gradient(135deg,#eef2ff,#eff6ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                color: "#4f46e5",
              }}
            >
              {/* Replace 📽️ with real thumbnail <img> later */}
              📽️
            </div>

            {/* Meta details */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                {asset.filename}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 24,
                  fontSize: 14,
                }}
              >
                <div>
                  <div style={{ color: "#6b7280" }}>Size</div>
                  <div>{(asset.size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
                <div>
                  <div style={{ color: "#6b7280" }}>Type</div>
                  <div>{asset.mime}</div>
                </div>
                <div>
                  <div style={{ color: "#6b7280" }}>Status</div>
                  <div style={{ textTransform: "capitalize" }}>
                    {asset.status}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6b7280" }}>Created</div>
                  <div>{new Date(asset.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Recent Activity
            </h4>
            <div style={{ fontSize: 14, color: "#6b7280" }}>
              Activity list TODO
            </div>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            {asset.filename}
          </h3>
          <div
            style={{ display: "flex", gap: 40, marginBottom: 16, fontSize: 14 }}
          >
            <div>
              <div style={{ color: "#6b7280" }}>Size</div>
              <div>{(asset.size / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
            <div>
              <div style={{ color: "#6b7280" }}>Type</div>
              <div>{asset.mime}</div>
            </div>
            <div>
              <div style={{ color: "#6b7280" }}>Created</div>
              <div>{created.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: "#6b7280" }}>Status</div>
              <div style={{ textTransform: "capitalize" }}>{asset.status}</div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Recent Activity
            </h4>
            <div style={{ fontSize: 14, color: "#6b7280" }}>
              Activity list TODO
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: 12,
          }}
        >
          <button
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 9999,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            // TODO: wire getDownloadUrl later
            onClick={handleDownload}
          >
            Download
          </button>
          <button
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 9999,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => setShowShare(true)}
          >
            Share
          </button>
        </div>

        {showShare && (
          <ShareDialog
            asset={asset}
            onClose={() => setShowShare(false)}
            onShared={onShared}
          />
        )}
      </div>
    </div>
  );
};

export default AssetDetailsModal;
