import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  robots: 'noindex, nofollow',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
