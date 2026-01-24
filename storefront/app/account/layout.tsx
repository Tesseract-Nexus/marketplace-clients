import { Metadata } from 'next';
import { AccountLayoutClient } from './AccountLayoutClient';

export const metadata: Metadata = {
  title: 'My Account',
  robots: 'noindex, nofollow',
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountLayoutClient>{children}</AccountLayoutClient>;
}
