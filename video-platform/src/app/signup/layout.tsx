import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | VaultStream',
  description: 'Create your VaultStream credentials to unlock global premium content and high-definition streams.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
