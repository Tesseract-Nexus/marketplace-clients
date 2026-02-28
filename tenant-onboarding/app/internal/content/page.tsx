'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageCircle,
  Quote,
  Sparkles,
  Shield,
  CreditCard,
  Mail,
  Plug,
  Pencil,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type ContentType = 'faqs' | 'testimonials' | 'features' | 'trust-badges' | 'payment-plans' | 'contacts' | 'integrations';

interface ContentItem {
  id: string;
  [key: string]: unknown;
}

const contentTypes: { id: ContentType; label: string; icon: React.ElementType }[] = [
  { id: 'faqs', label: 'FAQs', icon: MessageCircle },
  { id: 'testimonials', label: 'Testimonials', icon: Quote },
  { id: 'features', label: 'Features', icon: Sparkles },
  { id: 'trust-badges', label: 'Trust Badges', icon: Shield },
  { id: 'payment-plans', label: 'Payment Plans', icon: CreditCard },
  { id: 'contacts', label: 'Contacts', icon: Mail },
  { id: 'integrations', label: 'Integrations', icon: Plug },
];

function ContentAdminContent() {
  const searchParams = useSearchParams();
  const adminKey = searchParams.get('key');

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>('faqs');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!adminKey) {
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    // Verify key by making a test request
    fetch(`/api/internal/content/faqs`, {
      headers: { 'X-Admin-Key': adminKey },
    })
      .then((res) => {
        if (res.ok) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setError('Invalid admin key');
        }
      })
      .catch(() => {
        setError('Failed to verify admin key');
      })
      .finally(() => setIsLoading(false));
  }, [adminKey]);

  // Fetch content when tab changes
  useEffect(() => {
    if (!isAuthorized || !adminKey) return;

    setIsLoading(true);
    fetch(`/api/internal/content/${activeTab}`, {
      headers: { 'X-Admin-Key': adminKey },
    })
      .then((res) => res.json())
      .then((data) => {
        setItems(data.data || []);
        setError(null);
      })
      .catch(() => {
        setError(`Failed to fetch ${activeTab}`);
        setItems([]);
      })
      .finally(() => setIsLoading(false));
  }, [activeTab, isAuthorized, adminKey]);

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editingId || !adminKey) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/internal/content/${activeTab}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const { data } = await res.json();
        setItems(items.map((item) => (item.id === editingId ? data : item)));
        setEditingId(null);
        setEditForm({});
      } else {
        setError('Failed to save changes');
      }
    } catch {
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminKey || !confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/internal/content/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': adminKey },
      });

      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
      } else {
        setError('Failed to delete item');
      }
    } catch {
      setError('Failed to delete item');
    }
  };

  const handleToggleActive = async (item: ContentItem) => {
    if (!adminKey) return;

    try {
      const res = await fetch(`/api/internal/content/${activeTab}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ active: !item.active }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setItems(items.map((i) => (i.id === item.id ? data : i)));
      }
    } catch {
      setError('Failed to toggle status');
    }
  };

  // Unauthorized view
  if (!isAuthorized && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            {error || 'Admin key required. Access this page with ?key=YOUR_ADMIN_KEY'}
          </p>
          <p className="text-sm text-gray-500">
            This page is for internal use only via port-forward.
          </p>
        </div>
      </div>
    );
  }

  // Loading view
  if (isLoading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Content Admin</h1>
            <p className="text-sm text-gray-500">Manage onboarding page content</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <Check className="w-4 h-4" />
            Authorized
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveTab(type.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === type.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 capitalize">{activeTab.replace('-', ' ')}</h2>
            <span className="text-sm text-gray-500">{items.length} items</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No {activeTab} found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="p-6">
                  {editingId === item.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      {Object.entries(editForm)
                        .filter(([key, value]) => {
                          // Skip system fields
                          if (['id', 'createdAt', 'updatedAt'].includes(key)) return false;
                          // Skip nested objects and arrays (relations)
                          if (value !== null && typeof value === 'object') return false;
                          // Skip null/undefined foreign keys that reference relations
                          if (key.endsWith('Id') && value === null) return false;
                          return true;
                        })
                        .map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            {typeof value === 'boolean' ? (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value as boolean}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, [key]: e.target.checked })
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-600">{value ? 'Yes' : 'No'}</span>
                              </label>
                            ) : typeof value === 'number' ? (
                              <input
                                type="number"
                                value={value as number}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, [key]: parseFloat(e.target.value) || 0 })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : key === 'answer' || key === 'description' || key === 'quote' || key === 'tagline' ? (
                              <textarea
                                value={(value as string) || ''}
                                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : key === 'price' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">₹</span>
                                <input
                                  type="text"
                                  value={(value as string) || ''}
                                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  placeholder="299.00"
                                />
                              </div>
                            ) : key === 'pageContext' ? (
                              <select
                                value={(value as string) || 'home'}
                                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                              >
                                <option value="home">Home</option>
                                <option value="pricing">Pricing</option>
                                <option value="onboarding">Onboarding</option>
                                <option value="all">All Pages</option>
                              </select>
                            ) : key === 'billingCycle' ? (
                              <select
                                value={(value as string) || 'monthly'}
                                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                              >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="one-time">One-time</option>
                              </select>
                            ) : key === 'currency' ? (
                              <select
                                value={(value as string) || 'INR'}
                                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                              >
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={(value as string) || ''}
                                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            )}
                          </div>
                        ))}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display View
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.active !== false
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.active !== false ? 'Active' : 'Inactive'}
                          </span>
                          {typeof item.pageContext === 'string' && item.pageContext && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {item.pageContext}
                            </span>
                          )}
                          {item.category && typeof item.category === 'object' && 'name' in (item.category as object) ? (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {(item.category as { name: string }).name}
                            </span>
                          ) : null}
                          {Array.isArray(item.features) ? (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                              {item.features.length} features
                            </span>
                          ) : null}
                          {typeof item.price === 'string' && item.price ? (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">
                              ₹{item.price}/{String(item.billingCycle || 'month')}
                            </span>
                          ) : null}
                          {typeof item.trialDays === 'number' && item.trialDays > 0 ? (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                              {item.trialDays} days trial
                            </span>
                          ) : null}
                          {typeof item.rating === 'number' ? (
                            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                              ★ {item.rating}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {(item.question as string) ||
                            (item.title as string) ||
                            (item.name as string) ||
                            (item.label as string) ||
                            (item.slug as string) ||
                            'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {(item.answer as string) ||
                            (item.description as string) ||
                            (item.quote as string) ||
                            (item.tagline as string) ||
                            ''}
                        </p>
                        {item.author ? (
                          <p className="text-xs text-gray-500 mt-1">
                            — {String(item.author)}
                            {item.role ? `, ${String(item.role)}` : ''}
                            {item.company ? ` at ${String(item.company)}` : ''}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title={item.active !== false ? 'Deactivate' : 'Activate'}
                        >
                          {item.active !== false ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gray-100 rounded-xl text-sm text-gray-600">
          <h3 className="font-semibold text-gray-900 mb-2">Access Instructions</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>This page is only accessible via port-forward</li>
            <li>
              Run: <code className="bg-gray-200 px-1 rounded">kubectl port-forward svc/tenant-onboarding 4201:80 -n marketplace</code>
            </li>
            <li>
              Access: <code className="bg-gray-200 px-1 rounded">http://localhost:4201/internal/content?key=YOUR_KEY</code>
            </li>
            <li>Changes take effect immediately on the public pages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function ContentAdminPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ContentAdminContent />
    </Suspense>
  );
}
