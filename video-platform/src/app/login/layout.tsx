import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | VaultStream',
  description: 'Access your premium video VaultStream account securely to enjoy uninterrupted streaming.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
