import React, { useContext, useEffect, useRef, useState } from "react";

import { supabase } from "../services/supabaseClient";
import { AuthContext } from "./AuthProvider";
import FileCard from "./FileCard";
import AssetDetailsModal from "./AssetDetailsModal";
import { startUploadWithTicket, type UploadTask } from "../services/upload";
import { fetchMyAssets, type Asset, deleteAssetRequest,getDownloadUrlRequest } from "../services/api";

type StatusFilter = "all" | "ready" | "uploading" | "corrupt";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activeUpload, setActiveUpload] = useState<UploadTask | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.email ?? user.id);
      loadAssets();
    }
  }, [user, statusFilter, search]);

  const handleDelete = async (asset: Asset) => {
    if (!window.confirm("Delete this file permanently?")) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not signed in");
      await deleteAssetRequest(token, {
        assetId: asset.id,
        version: asset.version,
      });
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null);
        setDetailsOpen(false);
      }
    } catch (err: any) {
      setStatusMsg(err.message ?? String(err));
    }
  };

  async function loadAssets() {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const list = await fetchMyAssets(token, search, statusFilter);
      setAssets(list);
    } catch (err: any) {
      setStatusMsg(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }
  const handleDownload = async (asset: Asset) => {
  try {
    setStatusMsg('Preparing download...');
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('Not signed in');

    const downloadUrl = await getDownloadUrlRequest(token, asset.id);
    if (!downloadUrl) throw new Error('Failed to get download URL');

    // Create a temporary link and trigger the download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = asset.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMsg(null);
  } catch (err: any) {
    setStatusMsg(err.message ?? String(err));
  }
};

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleUpload(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    // if another upload is in progress, you can choose to block or allow multiple
    if (isUploading) {
      setStatusMsg(
        "An upload is already in progress. Please wait or cancel it."
      );
      return;
    }

    setUploadProgress(0);
    setIsUploading(true);

    const task = startUploadWithTicket(
      file,
      (msg) => setStatusMsg(msg),
      (pct) => setUploadProgress(pct)
    );
    setActiveUpload(task);

    try {
      await task.promise;
      await loadAssets();
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setStatusMsg("Upload cancelled by user.");
      } else {
        setStatusMsg(`Error: ${err?.message ?? String(err)}`);
      }
    } finally {
      setIsUploading(false);
      setActiveUpload(null);
      // keep final 100% bar visible briefly
      setTimeout(() => setUploadProgress(null), 800);
    }
  };
  const handleCancelUpload = () => {
    if (activeUpload) {
      activeUpload.controller.abort();
    }
  };

  const handleOpenDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailsOpen(true);
  };

  const handleAssetUpdated = (updated: Asset) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAsset(updated);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <header
        style={{
          padding: "18px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 16,
              background: "linear-gradient(135deg,#2563eb,#4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 22,
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              Secure Media Vault
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {assets.length} file{assets.length === 1 ? "" : "s"} stored
              securely
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 14, color: "#4b5563" }}>{displayName}</div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 9999,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "9px 18px",
              borderRadius: 9999,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            + Upload Files
          </button>
        </div>
      </header>

      <main style={{ padding: "20px 40px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{
                padding: "10px 14px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                background: "#fff",
              }}
            >
              <option value="all">All Files</option>
              <option value="ready">Ready</option>
              <option value="uploading">Uploading</option>
              <option value="corrupt">Corrupt</option>
            </select>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileInput}
        />

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{
            border: "2px dashed #bfdbfe",
            borderRadius: 18,
            padding: "36px 0",
            textAlign: "center",
            background: dragActive ? "#eff6ff" : "#f9fafb",
            cursor: "pointer",
            marginBottom: 24,
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: 36, marginBottom: 4 }}>⬆️</div>
          <div style={{ fontWeight: 600 }}>
            Drag & drop files here, or click to browse
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Secure upload with integrity check
          </div>
        </div>
        {uploadProgress !== null && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 12,
              background: "#eff6ff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {statusMsg ?? "Uploading…"}
              </div>
              <div style={{ fontSize: 12, color: "#4b5563" }}>
                {uploadProgress}% complete
              </div>
            </div>
            {isUploading && (
              <button
                onClick={handleCancelUpload}
                style={{
                  padding: "6px 12px",
                  borderRadius: 9999,
                  border: "1px solid #dc2626",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel upload
              </button>
            )}
          </div>
        )}

        {/* {uploadProgress !== null && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, marginBottom: 4, color: "#4b5563" }}>
              {statusMsg ?? "Uploading…"}
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 9999,
                background: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${uploadProgress}%`,
                  background: "linear-gradient(90deg,#2563eb,#4f46e5)",
                  transition: "width 150ms ease-out",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
              {uploadProgress}% complete
            </div>
          </div>
        )} */}

        {statusMsg && (
          <div style={{ marginBottom: 18, fontSize: 13, color: "#4b5563" }}>
            {statusMsg}
          </div>
        )}

        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {assets.map((asset) => (
              <FileCard
                key={asset.id}
                asset={asset}
                onOpenDetails={() => handleOpenDetails(asset)}
                onOpenShare={() => handleOpenDetails(asset)} // share from details modal
                onDelete={() => handleDelete(asset)}
                onDownload={() => handleDownload(asset)}
              />
            ))}
          </div>
        )}
      </main>

      <AssetDetailsModal
        asset={selectedAsset}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onShared={handleAssetUpdated}
      />
    </div>
  );
}
