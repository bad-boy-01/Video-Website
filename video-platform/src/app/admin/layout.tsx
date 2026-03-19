import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Hub | VaultStream',
  description: 'Secured global administration control dashboard mapping aggregate active payloads locally.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
