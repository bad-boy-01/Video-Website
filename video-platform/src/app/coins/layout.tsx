import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Treasury | VaultStream',
  description: 'Purchase secure digital Vault credits strictly via Razorpay integrations to unlock classified Vaults.',
};

export default function CoinsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
