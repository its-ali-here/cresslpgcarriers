'use client';

import dynamic from 'next/dynamic';

// ssr: false prevents Next.js from rendering this on the server at build time.
// The Supabase client requires browser env vars that aren't available during prerendering.
const ClientApp = dynamic(
  () => import('@/components/ClientApp'),
  { ssr: false }
);

export default function Home() {
  return <ClientApp />;
}
