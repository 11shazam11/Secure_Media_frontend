const API_URL = 'https://secure-media-backend.onrender.com';

export type UploadTicket = {
  assetId: string;
  storagePath: string;
  uploadUrl: string;
  expiresAt: string;
  nonce: string;
};

export type Asset = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  sha256?: string | null;
  status: 'draft' | 'uploading' | 'ready' | 'corrupt';
  version: number;
  createdAt: string;
  updatedAt: string;
};

export async function createUploadUrlForFile(
  file: File,
  token: string
): Promise<UploadTicket> {
  const body = {
    query: `
      mutation CreateUploadUrl($filename: String!, $mime: String!, $size: Int!) {
        createUploadUrl(filename: $filename, mime: $mime, size: $size) {
          assetId
          storagePath
          uploadUrl
          expiresAt
          nonce
        }
      }
    `,
    variables: {
      filename: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data.createUploadUrl as UploadTicket;
}

export type AssetConnection = {
  edges: { cursor: string; node: Asset }[];
  pageInfo: { endCursor: string | null; hasNextPage: boolean };
};

export async function fetchMyAssets(
  token: string,
  q: string,
  statusFilter: 'all' | 'ready' | 'uploading' | 'corrupt',
): Promise<Asset[]> {
  const body = {
    query: `
      query MyAssets($q: String) {
        myAssets(first: 50, q: $q) {
          edges {
            cursor
            node {
              id
              filename
              mime
              size
              sha256
              status
              version
              createdAt
              updatedAt
            }
          }
          pageInfo { endCursor hasNextPage }
        }
      }
    `,
    variables: { q: q || null },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  const conn: AssetConnection = json.data.myAssets;
  let assets = conn.edges.map(e => e.node);

  if (statusFilter !== 'all') {
    assets = assets.filter(a => a.status === statusFilter);
  }

  return assets;
}

export async function shareAssetRequest(
  token: string,
  params: { assetId: string; toEmail: string; canDownload: boolean; version: number }
): Promise<Asset> {
  const body = {
    query: `
      mutation ShareAsset($assetId: ID!, $toEmail: String!, $canDownload: Boolean!, $version: Int!) {
        shareAsset(assetId: $assetId, toEmail: $toEmail, canDownload: $canDownload, version: $version) {
          id
          filename
          mime
          size
          sha256
          status
          version
          createdAt
          updatedAt
        }
      }
    `,
    variables: params,
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data.shareAsset as Asset;
}
export async function deleteAssetRequest(
  token: string,
  params: { assetId: string; version: number }
): Promise<boolean> {
  const body = {
    query: `
      mutation DeleteAsset($assetId: ID!, $version: Int!) {
        deleteAsset(assetId: $assetId, version: $version)
      }
    `,
    variables: params,
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data.deleteAsset as boolean;
}

export async function getDownloadUrlRequest(
  token: string,
  assetId: string
): Promise<string> {
  const body = {
    query: `
      mutation GetDownloadUrl($assetId: ID!) {
        getDownloadUrl(assetId: $assetId)
      }
    `,
    variables: { assetId },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.errors?.length) {
    // index 0, not .message on the whole array
    throw new Error(json.errors[0].message);
  }

  return json.data.getDownloadUrl as string;
}

