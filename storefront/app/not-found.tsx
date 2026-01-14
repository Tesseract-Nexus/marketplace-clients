import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
        <FileQuestion className="h-12 w-12 text-gray-400" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-muted-foreground max-w-[500px] mx-auto text-lg">
          We couldn't find the page you were looking for. It might have been removed, renamed, or doesn't exist.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/">
          <Button size="lg" className="font-semibold">
            Return Home
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" size="lg" className="font-semibold">
            Browse Products
          </Button>
        </Link>
      </div>
    </div>
  );
}
