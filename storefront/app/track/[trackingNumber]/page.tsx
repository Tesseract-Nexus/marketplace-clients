'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Truck,
  CheckCircle2,
  Circle,
  ArrowLeft,
  MapPin,
  Clock,
  AlertCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  ShipmentTracking,
  ShipmentStatus,
  getStatusLabel,
  getStatusColor,
  getStatusProgress,
} from '@/lib/api/shipping';

const statusIcons: Record<ShipmentStatus, React.ReactNode> = {
  PENDING: <Circle className="w-5 h-5" />,
  CREATED: <Package className="w-5 h-5" />,
  PICKED_UP: <Package className="w-5 h-5" />,
  IN_TRANSIT: <Truck className="w-5 h-5" />,
  OUT_FOR_DELIVERY: <Truck className="w-5 h-5" />,
  DELIVERED: <CheckCircle2 className="w-5 h-5" />,
  FAILED: <AlertCircle className="w-5 h-5" />,
  CANCELLED: <XCircle className="w-5 h-5" />,
  RETURNED: <RefreshCw className="w-5 h-5" />,
};

const progressSteps: ShipmentStatus[] = [
  'CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export default function TrackingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const trackingNumber = params.trackingNumber as string;

  const [tracking, setTracking] = useState<ShipmentTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackingNumber) {
      fetchTracking();
    }
  }, [trackingNumber]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shipping/track/${encodeURIComponent(trackingNumber)}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Shipment not found');
      }

      const data = await response.json();
      setTracking(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: ShipmentStatus): 'completed' | 'current' | 'pending' => {
    if (!tracking) return 'pending';

    const currentIndex = progressSteps.indexOf(tracking.status);
    const stepIndex = progressSteps.indexOf(step);

    // Handle special statuses
    if (tracking.status === 'FAILED' || tracking.status === 'CANCELLED' || tracking.status === 'RETURNED') {
      return stepIndex < currentIndex ? 'completed' : 'pending';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tracking Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || `We couldn't find any shipment with tracking number "${trackingNumber}". Please check the number and try again.`}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/track"
              className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all"
            >
              Try Again
            </Link>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTerminalStatus = ['DELIVERED', 'FAILED', 'CANCELLED', 'RETURNED'].includes(tracking.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/track"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Track Another Package
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tracking Details</h1>
            <p className="text-gray-600 mt-1">
              Tracking #: <span className="font-mono font-semibold">{tracking.trackingNumber}</span>
            </p>
          </div>
          <button
            onClick={fetchTracking}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(tracking.status)}`}>
            {statusIcons[tracking.status]}
            {getStatusLabel(tracking.status)}
          </div>
          {tracking.carrier && (
            <div className="text-gray-600">
              via <span className="font-semibold">{tracking.carrier}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isTerminalStatus || tracking.status === 'DELIVERED' ? (
          <div className="mb-8">
            <div className="relative">
              {/* Background line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
              {/* Progress line */}
              <div
                className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${getStatusProgress(tracking.status)}%` }}
              />

              {/* Steps */}
              <div className="relative flex justify-between">
                {progressSteps.map((step) => {
                  const stepStatus = getStepStatus(step);
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-all ${
                          stepStatus === 'completed'
                            ? 'border-primary bg-primary text-white'
                            : stepStatus === 'current'
                            ? 'border-primary text-primary'
                            : 'border-gray-200 text-gray-400'
                        }`}
                      >
                        {stepStatus === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          statusIcons[step]
                        )}
                      </div>
                      <span
                        className={`mt-2 text-xs font-medium text-center ${
                          stepStatus === 'pending' ? 'text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {getStatusLabel(step)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm">
              {tracking.status === 'FAILED' && 'Delivery attempt failed. Please contact support for assistance.'}
              {tracking.status === 'CANCELLED' && 'This shipment has been cancelled.'}
              {tracking.status === 'RETURNED' && 'This package is being returned to the sender.'}
            </p>
          </div>
        )}

        {/* Estimated/Actual Delivery */}
        <div className="flex flex-col sm:flex-row gap-6">
          {tracking.estimatedDelivery && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Estimated Delivery</div>
                <div className="font-semibold text-gray-900">
                  {formatDate(tracking.estimatedDelivery)}
                </div>
              </div>
            </div>
          )}
          {tracking.actualDelivery && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Delivered</div>
                <div className="font-semibold text-gray-900">
                  {formatDate(tracking.actualDelivery)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Route Info */}
      {(tracking.fromAddress || tracking.toAddress) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Route</h2>
          <div className="flex items-center gap-4">
            {tracking.fromAddress && (
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">From</div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {tracking.fromAddress.city}, {tracking.fromAddress.state}
                  </span>
                </div>
              </div>
            )}
            {tracking.fromAddress && tracking.toAddress && (
              <div className="flex-shrink-0">
                <div className="w-8 h-0.5 bg-gray-200" />
              </div>
            )}
            {tracking.toAddress && (
              <div className="flex-1 text-right">
                <div className="text-sm text-gray-500 mb-1">To</div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-medium text-gray-900">
                    {tracking.toAddress.city}, {tracking.toAddress.state}
                  </span>
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking History */}
      {tracking.events && tracking.events.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h2>
          <div className="space-y-4">
            {tracking.events.map((event, index) => (
              <div key={event.id || index} className="flex gap-4">
                <div className="flex-shrink-0 relative">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                  {index < tracking.events.length - 1 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="font-medium text-gray-900">{event.description}</div>
                    <div className="text-sm text-gray-500">{formatDate(event.timestamp)}</div>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Link */}
      {tracking.orderNumber && (
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            This shipment is for order{' '}
            <span className="font-semibold">#{tracking.orderNumber}</span>
          </p>
        </div>
      )}
    </div>
  );
}
