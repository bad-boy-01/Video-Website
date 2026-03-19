import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch History | VaultStream',
  description: 'Inspect localized timeline tracking vectors for your unique progression metadata globally.',
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
