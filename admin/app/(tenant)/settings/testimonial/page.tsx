'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  Star,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/PageHeader';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { Label } from '@/components/ui/label';
import { PermissionGate, Permission } from '@/components/permission-gate';

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'revision_needed';
  revisionNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export default function TestimonialSettingsPage() {
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state - rating starts at 0 (unset)
  const [formData, setFormData] = useState({
    quote: '',
    name: '',
    role: '',
    company: '',
    rating: 0,
  });

  // Fetch existing testimonial
  useEffect(() => {
    async function fetchTestimonial() {
      if (!currentTenant?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/testimonials', {
          headers: {
            'x-jwt-claim-tenant-id': currentTenant.id,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setTestimonial(result.data);
            setFormData({
              quote: result.data.quote || '',
              name: result.data.name || '',
              role: result.data.role || '',
              company: result.data.company || currentTenant.name || '',
              rating: result.data.rating || 5,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching testimonial:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTestimonial();
  }, [currentTenant?.id, currentTenant?.name]);

  // Pre-fill form from user and tenant context (only if no existing testimonial)
  useEffect(() => {
    if (!testimonial) {
      setFormData(prev => ({
        ...prev,
        name: user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || prev.name,
        role: user?.jobTitle || prev.role,
        company: currentTenant?.name || prev.company,
      }));
    }
  }, [currentTenant?.name, user?.displayName, user?.firstName, user?.lastName, user?.jobTitle, testimonial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const method = testimonial ? 'PUT' : 'POST';
      const response = await fetch('/api/testimonials', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-jwt-claim-tenant-id': currentTenant?.id || '',
          'x-tenant-name': currentTenant?.name || '',
          'x-tenant-company': currentTenant?.name || '',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit testimonial');
      }

      setTestimonial(result.data);
      setIsEditing(false);
      setSuccessMessage(
        testimonial
          ? 'Your testimonial has been updated and will be reviewed shortly.'
          : 'Thank you for your testimonial! It will be reviewed and published soon.'
      );
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-success-muted text-success-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Approved & Published
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-warning-muted text-warning-muted-foreground">
            <Clock className="h-4 w-4" />
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-error-muted text-error-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Not Approved
          </span>
        );
      case 'revision_needed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-info-muted text-info-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            Revision Requested
          </span>
        );
      default:
        return null;
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type={interactive ? 'button' : undefined}
              disabled={!interactive}
              onClick={interactive ? () => setFormData(prev => ({ ...prev, rating: star })) : undefined}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            >
              <Star
                className={`h-6 w-6 ${
                  star <= rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
        {interactive && rating === 0 && (
          <span className="text-sm text-muted-foreground">Click to rate</span>
        )}
      </div>
    );
  };

  if (!currentTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground">Loading tenant information...</p>
        </div>
      </div>
    );
  }

  const showForm = !testimonial || isEditing;

  return (
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="Your Testimonial"
      fallbackDescription="You don't have permission to manage testimonials."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Your Testimonial"
          description="Share your experience with Tesserix to help other businesses"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Testimonial' },
          ]}
        />

        {/* Info Card */}
        <div className="bg-gradient-to-r from-primary/10 to-violet-100 rounded-xl border border-primary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquareQuote className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Share Your Success Story</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your feedback helps other businesses discover how Tesserix can help them grow.
                Approved testimonials may be featured on our website.
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-success-muted border border-success/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
            <p className="text-sm text-success-muted-foreground">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-error-muted border border-error/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
            <p className="text-sm text-error-muted-foreground">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-12 w-12 bg-muted rounded-full" />
              <div className="h-4 w-48 bg-muted rounded" />
            </div>
          </div>
        ) : showForm ? (
          /* Testimonial Form */
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                <Edit3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {testimonial ? 'Edit Your Testimonial' : 'Write Your Testimonial'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {testimonial ? 'Update your feedback below' : 'Tell us about your experience'}
                </p>
              </div>
            </div>

            {testimonial?.status === 'revision_needed' && testimonial.revisionNotes && (
              <div className="bg-info-muted border border-info/20 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-info mb-1">Revision Requested</h4>
                <p className="text-sm text-info-muted-foreground">{testimonial.revisionNotes}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rating">Your Rating</Label>
                {renderStars(formData.rating, true)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote">Your Testimonial *</Label>
                <Textarea
                  id="quote"
                  placeholder="Share your experience with Tesserix. What problems did it solve? How has it helped your business?"
                  value={formData.quote}
                  onChange={(e) => setFormData(prev => ({ ...prev, quote: e.target.value }))}
                  rows={5}
                  required
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Minimum 50 characters recommended</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Input
                    id="role"
                    placeholder="Store Owner, CEO, Manager, etc."
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company/Store Name</Label>
                <Input
                  id="company"
                  placeholder="Your business name"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {testimonial ? 'Update Testimonial' : 'Submit Testimonial'}
                    </>
                  )}
                </Button>
                {testimonial && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* Existing Testimonial Display */
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-muted rounded-lg flex items-center justify-center">
                  <MessageSquareQuote className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Your Testimonial</h3>
                  {testimonial?.submittedAt && (
                    <p className="text-sm text-muted-foreground">
                      Submitted {new Date(testimonial.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {testimonial && getStatusBadge(testimonial.status)}
            </div>

            {testimonial?.status === 'revision_needed' && testimonial.revisionNotes && (
              <div className="bg-info-muted border border-info/20 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-info mb-1">Feedback from Review Team</h4>
                <p className="text-sm text-info-muted-foreground">{testimonial.revisionNotes}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                {testimonial && renderStars(testimonial.rating)}
              </div>

              <blockquote className="text-lg text-foreground italic border-l-4 border-primary pl-4">
                &ldquo;{testimonial?.quote}&rdquo;
              </blockquote>

              <div className="pt-4 border-t">
                <p className="font-semibold text-foreground">{testimonial?.name}</p>
                {testimonial?.role && (
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                )}
                {testimonial?.company && (
                  <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Testimonial
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Editing will require re-approval before the updated version is published.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
