'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Search, ArrowRight } from 'lucide-react';

export default function TrackingPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    router.push(`/track/${encodeURIComponent(trackingNumber.trim())}`);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">
            Enter your tracking number to see the delivery status of your package.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!trackingNumber.trim() || loading}
            className="w-full py-4 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Tracking...
              </>
            ) : (
              <>
                Track Package
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            You can find your tracking number in the shipping confirmation email or on your order details page.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-primary">1</div>
            <div className="text-sm text-gray-600 mt-1">Enter tracking number</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-primary">2</div>
            <div className="text-sm text-gray-600 mt-1">View shipment status</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-sm text-gray-600 mt-1">Track in real-time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
