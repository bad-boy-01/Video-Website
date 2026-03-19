import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Identity Profile | VaultStream',
  description: 'Manage root identity matrices, view subscriptions, and control session endpoints centrally.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
