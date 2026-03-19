import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Search | VaultStream',
  description: 'Sift through the global catalog mapping algorithmic relevance directly against Vault constraints.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
