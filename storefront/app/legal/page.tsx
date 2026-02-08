import { Metadata } from 'next';
import { LegalPageClient } from './LegalPageClient';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Security & Compliance',
    description: 'Our security practices, data protection policies, and compliance standards.',
  };
}

export default async function LegalPage() {
  return <LegalPageClient />;
}
