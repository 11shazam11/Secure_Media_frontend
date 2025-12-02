
import { supabase } from "./supabaseClient";
import { createUploadUrlForFile } from "./api";
import type { UploadTicket } from "./api";

const API_URL = "http://localhost:4000/graphql";

async function sha256FromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function finalizeUpload(
  assetId: string,
  clientSha256: string,
  version: number,
  token: string
) {
  const body = {
    query: `
      mutation FinalizeUpload($assetId: ID!, $clientSha256: String!, $version: Int!) {
        finalizeUpload(assetId: $assetId, clientSha256: $clientSha256, version: $version) {
          id
          status
          sha256
          version
        }
      }
    `,
    variables: { assetId, clientSha256, version },
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
    throw new Error(json.errors[0].message);
  }

  return json.data.finalizeUpload as {
    id: string;
    status: string;
    sha256: string;
    version: number;
  };
}

// NEW: return a controller + promise so caller can cancel
export type UploadTask = {
  controller: AbortController;
  promise: Promise<void>;
};

export function startUploadWithTicket(
  file: File,
  setStatus: (msg: string) => void,
  setProgress: (value: number) => void
): UploadTask {
  const controller = new AbortController();

  const promise = (async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("Not signed in");

    setStatus("Requesting upload ticket…");
    setProgress(0);

    const ticket: UploadTicket = await createUploadUrlForFile(file, token);

    // 1) upload with progress using XMLHttpRequest + AbortController
    setStatus("Uploading to storage…");

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("PUT", ticket.uploadUrl, true);

      // tie AbortController to XHR
      const abortHandler = () => {
        xhr.abort();
      };
      controller.signal.addEventListener("abort", abortHandler);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setProgress(pct);
        }
      };

      xhr.onload = () => {
        controller.signal.removeEventListener("abort", abortHandler);
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        controller.signal.removeEventListener("abort", abortHandler);
        reject(new Error("Network error during upload"));
      };

      xhr.onabort = () => {
        controller.signal.removeEventListener("abort", abortHandler);
        reject(new DOMException("Upload aborted", "AbortError"));
      };

      xhr.send(file);
    });

    // 2) hash + finalize
    setStatus("Computing file hash…");
    const hash = await sha256FromFile(file);

    setStatus("Finalizing upload…");
    const result = await finalizeUpload(ticket.assetId, hash, 1, token);

    if (result.status !== "ready") {
      throw new Error(`File is ${result.status}`);
    }

    setStatus("Upload complete and verified");
    setProgress(100);
  })();

  return { controller, promise };
}
