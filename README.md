# Secure Media Vault - Frontend README

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation & Running](#installation--running)
- [Project Structure](#project-structure)
- [Features](#features)
- [Configuration](#configuration)
- [Build & Deployment](#build--deployment)
- [Authentication Flow](#authentication-flow)
- [File Upload Process](#file-upload-process)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## One-line Summary
React + TypeScript frontend for secure file upload, sharing, and management with Supabase authentication and GraphQL integration.

---

## Prerequisites
- **Node.js** >= 16.x  
- **npm** or **yarn**  
- **VS Code** (recommended) with TypeScript/React extensions  
- **Supabase Project** (pre-created)  
- **Backend GraphQL server** running locally or deployed  

Install Node.js from [nodejs.org](https://nodejs.org) and verify installation: 
node --version
npm --version



---

## Environment Variables
Create `.env` in frontend root with:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

- Find values in Supabase Dashboard under Settings → API  
- Use backend GraphQL server URL for `VITE_API_ENDPOINT`  
- Never use Service Role Key in frontend  
- Add `.env` to `.gitignore`

---

## Installation & Running

### Install dependencies
npm install

### Start development server
npm run dev


### Preview production build locally
npm run preview
Serves production build on `http://localhost:4173`

---

## Project Structure
frontend/
├── src/
│ ├── components/
│ │ ├── Dashboard.tsx # Main file management UI
│ │ ├── FileCard.tsx # Individual file card component
│ │ ├── AssetDetailsModal.tsx # File details & download/share
│ │ ├── ShareDialog.tsx # Share permission dialog
│ │ ├── SignInForm.tsx # Login form
│ │ ├── SignUpForm.tsx # Registration form
│ │ └── AuthProvider.tsx # Auth context provider
│ ├── services/
│ │ ├── supabaseClient.ts # Supabase client init
│ │ ├── api.ts # GraphQL API calls
│ │ └── upload.ts # File upload + SHA256 hashing
│ ├── App.tsx # Main app component
│ ├── main.tsx # Entry point
│ └── index.css # Styles
├── .env # Environment variables (git-ignored)
├── .env.example # Example environment variables template
├── vite.config.ts # Vite config
├── tsconfig.json # TypeScript config
├── package.json # Dependencies & scripts
└── README.md # This file

---

## Features

### Authentication
- Email/password sign-up & sign-in  
- Google OAuth (if configured)  
- Session management via Supabase Auth  
- Protected routes for signed-in users  

### File Management
- Drag-and-drop or click-to-browse upload  
- Secure signed URLs (90-second expiry) for downloads  
- Share files with specific emails  
- Delete with version conflict protection  
- Search files by name  
- Upload progress & status tracking  

### Security
- Client-side SHA256 hash verification  
- Version conflict detection  
- Backend enforced RLS  
- JWT authentication tokens  
- Time-limited signed download URLs  

### User Experience
- Real-time upload progress bar  
- File metadata modal  
- Status badges (Ready, Uploading, Corrupt, Draft)  
- Responsive design, mobile & desktop  
- Clear error messages & notifications  

---

## Configuration

### Supabase Client (`src/services/supabaseClient.ts`)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

text

### GraphQL API Calls (`src/services/api.ts`)
const API_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:4000/graphql';

export async function fetchMyAssets(token: string, q: string, statusFilter: string) {
const res = await fetch(API_URL, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': Bearer ${token},
},
body: JSON.stringify({
query: query MyAssets(...) { ... },
variables: { q, statusFilter },
}),
});
return res.json();
}

text

---

## Build & Deployment

### Build production package
npm run build

text
Output in `dist/`

### Deployment options:
- **Vercel:**  
npm install -g vercel
vercel

text
- **Netlify:**  
npm install -g netlify-cli
netlify deploy --prod --dir dist

text
- **GitHub Pages:**  
Build and push `dist/` to `gh-pages` branch

Set production environment variables on hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_ENDPOINT`

---

## Authentication Flow

- Sign-Up: User registers via email/password → Supabase creates user → User logged in & redirected to dashboard
- Sign-In: User enters credentials → Auth validated → JWT stored → Context updated → Protected routes unlocked
- Sign-Out: User clicks sign out → Session cleared → Redirect to sign-in
- Session Persistence: Sessions saved in localStorage, restored on refresh

---

## File Upload Process

1. User selects file (drag/drop or browse)  
2. Frontend calculates SHA256 hash client-side  
3. Calls backend mutation to get upload URL & nonce  
4. Upload file to Supabase Storage via signed URL  
5. Server verifies hash matches uploaded file  
6. File status updates (draft → uploading → ready)  
7. File appears in dashboard  

### SHA256 Client Hash Calculation (`src/services/upload.ts`)
async function calculateSHA256(file: File): Promise<string> {
const buffer = await file.arrayBuffer();
const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function startUploadWithTicket(file: File, onProgress: (pct: number) => void) {
const hash = await calculateSHA256(file);
// Continue upload with hash verification
}

text

---

## Testing

Run tests with:
npm run test

text

- Authentication tests: `npm run test -- --grep "auth"`
- File upload tests: `npm run test -- --grep "upload"`
- Version conflict tests: `npm run test -- --grep "version.*conflict"`

---

## Troubleshooting

- **VITE_SUPABASE_URL missing**: Create `.env` with correct keys  
- **GraphQL endpoint not responding**: Check backend is running, URL matches, and CORS  
- **Upload fails with "Not signed in"**: Verify user logged in, JWT present, Supabase session  
- **Empty file list in dashboard**: Check backend status, GraphQL data, authentication  
- **Download URL expires immediately**: Ensure download starts within 90 seconds TTL, check server time sync  
- **Drag-drop upload fails**: Verify event listeners, try browser alternatives, inspect console errors  

---

## Performance Optimization

- Vite auto code splitting  
- Use lazy loading and `.webp` images  
- Monitor bundle size with build output  
- Cache Supabase auth and GraphQL queries where possible  

---

## Next Steps

1. Create Supabase project  
2. Add `.env` with your settings  
3. Run backend server (`npm run dev`)  
4. Run frontend (`npm run dev`)  
5. Access at `http://localhost:5173`  
6. Register account, upload and test files  

---

## Support & Resources

- [Supabase Docs](https://supabase.com/docs)  
- [React Documentation](https://react.dev)  
- [TypeScript Handbook](https://www.typescriptlang.org/docs)  
- [Vite Guide](https://vitejs.dev/guide)  
- [GraphQL Queries](https://graphql.org/learn)  
- [Supabase Auth](https://supabase.com/docs/guides/auth)  
