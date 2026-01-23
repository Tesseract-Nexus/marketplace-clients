'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Eye, CheckCircle, XCircle, Flag, Star, MessageSquare, Shield, AlertCircle, X, Loader2, Sparkles, ShieldCheck, Camera, ThumbsUp, Home, MessageCircle, Clock, TrendingUp } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { PageError } from '@/components/PageError';
import { PageLoading } from '@/components/common';
import { Pagination } from '@/components/Pagination';
import { FilterPanel, QuickFilters, QuickFilter } from '@/components/data-listing';
import { reviewService } from '@/lib/services/reviewService';
import { productService } from '@/lib/services/productService';
import type { Review, ReviewStatus, UpdateReviewStatusRequest, ReviewMedia, Product } from '@/lib/api/types';
import { useToast } from '@/contexts/ToastContext';

const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FLAGGED', label: 'Flagged' },
];

const typeOptions = [
  { value: 'ALL', label: 'All Types' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'EXPERIENCE', label: 'Experience' },
];

export default function ReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isInternalReply, setIsInternalReply] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<UpdateReviewStatusRequest>({
    status: 'APPROVED' as ReviewStatus,
    moderationNotes: '',
  });
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [productsCache, setProductsCache] = useState<Record<string, Product>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Load reviews
  useEffect(() => {
    loadReviews();
  }, [statusFilter, typeFilter]);

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyContent.trim()) return;
    try {
      setError(null);
      await reviewService.addComment(selectedReview.id, replyContent, isInternalReply);
      toast.success('Reply Sent', isInternalReply ? 'Internal note added successfully' : 'Reply posted successfully');
      setShowReplyModal(false);
      setSelectedReview(null);
      setReplyContent('');
      setIsInternalReply(false);
      loadReviews();
    } catch (error) {
      console.error('Error submitting reply:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit reply. Please try again.';
      setError(errorMessage);
      toast.error('Reply Failed', errorMessage);
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getReviews({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
      });
      setReviews(response.data);

      // Load product details for product reviews
      loadProductDetails(response.data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setError(error instanceof Error ? error.message : 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load product details for reviews with PRODUCT target type
  const loadProductDetails = async (reviewsList: Review[]) => {
    const productIds = [...new Set(
      reviewsList
        .filter(r => r.targetType === 'PRODUCT' && r.targetId && !productsCache[r.targetId])
        .map(r => r.targetId)
    )];

    if (productIds.length === 0) return;

    const newProducts: Record<string, Product> = {};
    await Promise.all(
      productIds.map(async (id) => {
        try {
          const response = await productService.getProduct(id);
          if (response.data) {
            newProducts[id] = response.data;
          }
        } catch (err) {
          console.error(`Failed to load product ${id}:`, err);
        }
      })
    );

    if (Object.keys(newProducts).length > 0) {
      setProductsCache(prev => ({ ...prev, ...newProducts }));
    }
  };

  const filteredReviews = reviews.filter((review) =>
    review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (review.title && review.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    review.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredReviews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedReview) return;
    try {
      setError(null);
      await reviewService.updateReviewStatus(selectedReview.id, statusUpdate);
      toast.success('Status Updated', `Review status updated to ${statusUpdate.status}`);
      setShowStatusModal(false);
      setSelectedReview(null);
      setStatusUpdate({
        status: 'APPROVED' as ReviewStatus,
        moderationNotes: '',
      });
      loadReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update review status. Please try again.';
      setError(errorMessage);
      toast.error('Update Failed', errorMessage);
    }
  };

  const toggleReviewSelection = (reviewId: string) => {
    setSelectedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const toggleAllReviews = () => {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews.map((r) => r.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'flag' | 'feature') => {
    try {
      setError(null);
      const reviewIds = Array.from(selectedReviews);
      for (const id of reviewIds) {
        if (action === 'feature') {
          const review = reviews.find((r) => r.id === id);
          if (review) {
            await reviewService.updateReview(id, { featured: !review.featured });
          }
        } else {
          const statusMap = {
            approve: 'APPROVED' as ReviewStatus,
            reject: 'REJECTED' as ReviewStatus,
            flag: 'FLAGGED' as ReviewStatus,
          };
          await reviewService.updateReviewStatus(id, {
            status: statusMap[action],
            moderationNotes: `Bulk ${action}d`,
          });
        }
      }
      const actionLabels = {
        approve: 'approved',
        reject: 'rejected',
        flag: 'flagged',
        feature: 'featured status toggled'
      };
      toast.success('Bulk Action Complete', `${reviewIds.length} review${reviewIds.length !== 1 ? 's' : ''} ${actionLabels[action]}`);
      setSelectedReviews(new Set());
      setShowBulkActions(false);
      loadReviews();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform bulk action. Please try again.';
      setError(errorMessage);
      toast.error('Bulk Action Failed', errorMessage);
    }
  };

  const getReviewStatusType = (status: ReviewStatus): StatusType => {
    const mapping: Record<ReviewStatus, StatusType> = {
      DRAFT: 'neutral',
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      FLAGGED: 'error',
      ARCHIVED: 'neutral',
    };
    return mapping[status] || 'neutral';
  };

  const getStatusBadgeClass = (status: ReviewStatus) => {
    // Legacy function - kept for backward compatibility
    // Use StatusBadge component instead where possible
    const classes: Record<ReviewStatus, string> = {
      DRAFT: 'bg-neutral-muted text-neutral-muted-foreground border-transparent',
      PENDING: 'bg-warning-muted text-warning-muted-foreground border-transparent',
      APPROVED: 'bg-success-muted text-success-muted-foreground border-transparent',
      REJECTED: 'bg-error-muted text-error-muted-foreground border-transparent',
      FLAGGED: 'bg-error-muted text-error-muted-foreground border-transparent',
      ARCHIVED: 'bg-neutral-muted text-neutral-muted-foreground border-transparent',
    };
    return classes[status] || classes.PENDING;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'fill-yellow-400 text-warning' : 'text-muted-foreground'
          )}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  const getAverageRating = (review: Review): number | undefined => {
    if (!review.ratings) return undefined;
    // Handle both array format and object format (JSONB from backend)
    if (Array.isArray(review.ratings)) {
      if (review.ratings.length === 0) return undefined;
      const total = review.ratings.reduce((sum, r) => sum + r.score, 0);
      return total / review.ratings.length;
    }
    // Handle object format: { "overall": { "score": 5, "maxScore": 5 } }
    const ratingsObj = review.ratings as unknown as Record<string, { score: number; maxScore: number }>;
    const entries = Object.entries(ratingsObj);
    if (entries.length === 0) return undefined;
    const total = entries.reduce((sum, [, r]) => sum + (r.score || 0), 0);
    return total / entries.length;
  };

  // Calculate summary metrics
  const totalReviews = reviews.length;
  const pendingReviews = reviews.filter((r) => r.status === 'PENDING').length;
  const approvedReviews = reviews.filter((r) => r.status === 'APPROVED').length;
  const rejectedReviews = reviews.filter((r) => r.status === 'REJECTED').length;
  const flaggedReviews = reviews.filter((r) => r.status === 'FLAGGED').length;

  // Calculate average rating across all reviews
  const averageRating = useMemo(() => {
    const ratingsWithValues = reviews
      .map(r => getAverageRating(r))
      .filter((r): r is number => r !== undefined);
    if (ratingsWithValues.length === 0) return 0;
    return ratingsWithValues.reduce((sum, r) => sum + r, 0) / ratingsWithValues.length;
  }, [reviews]);

  // Quick filters configuration
  const quickFilters: QuickFilter[] = useMemo(() => [
    { id: 'PENDING', label: 'Pending', icon: Clock, color: 'warning', count: pendingReviews },
    { id: 'APPROVED', label: 'Approved', icon: CheckCircle, color: 'success', count: approvedReviews },
    { id: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'error', count: rejectedReviews },
    { id: 'FLAGGED', label: 'Flagged', icon: Flag, color: 'error', count: flaggedReviews },
  ], [pendingReviews, approvedReviews, rejectedReviews, flaggedReviews]);

  // Active quick filter state
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  const handleQuickFilterToggle = (filterId: string) => {
    if (statusFilter === filterId) {
      setStatusFilter('ALL');
      setActiveQuickFilters([]);
    } else {
      setStatusFilter(filterId);
      setActiveQuickFilters([filterId]);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setSearchQuery('');
    setActiveQuickFilters([]);
  };

  // Calculate active filter count
  const activeFilterCount = (statusFilter !== 'ALL' ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0);

  return (
    <PermissionGate
      permission={Permission.REVIEWS_READ}
      fallback="styled"
      fallbackTitle="Reviews Access Required"
      fallbackDescription="You don't have the required permissions to view reviews. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Reviews Management"
          description="Moderate and manage customer reviews across all products and services"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Customers', href: '/customers' },
            { label: 'Reviews' },
          ]}
        />

      {/* Error Alert */}
      <PageError error={error} onDismiss={() => setError(null)} />

      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Star className="h-3.5 w-3.5" />
            Total
          </div>
          <p className="text-xl font-bold text-foreground">{totalReviews}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Avg Rating
          </div>
          <p className="text-xl font-bold text-warning">{averageRating.toFixed(1)}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </div>
          <p className="text-xl font-bold text-warning">{pendingReviews}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Approved
          </div>
          <p className="text-xl font-bold text-success">{approvedReviews}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <FilterPanel
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search reviews..."
        activeFilterCount={activeFilterCount}
        onClearAll={clearAllFilters}
        className="mb-6"
        quickFilters={
          <QuickFilters
            filters={quickFilters}
            activeFilters={activeQuickFilters}
            onFilterToggle={handleQuickFilterToggle}
            onClearAll={clearAllFilters}
            showClearAll={false}
            size="sm"
          />
        }
      >
        <Select
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setActiveQuickFilters(value !== 'ALL' ? [value] : []);
          }}
          options={statusOptions}
        />
        <Select
          value={typeFilter}
          onChange={(value) => setTypeFilter(value)}
          options={typeOptions}
        />
      </FilterPanel>

      {/* Bulk Actions Toolbar */}
      {selectedReviews.size > 0 && (
        <div className="bg-primary rounded-lg p-4 mb-6 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-primary-foreground">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-base sm:text-lg">
                {selectedReviews.size} review{selectedReviews.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                onClick={() => handleBulkAction('approve')}
                className="bg-success hover:bg-success text-white flex-1 sm:flex-none"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Approve All</span>
                <span className="sm:hidden">Approve</span>
              </Button>
              <Button
                onClick={() => handleBulkAction('reject')}
                className="bg-error hover:bg-error text-white flex-1 sm:flex-none"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Reject All</span>
                <span className="sm:hidden">Reject</span>
              </Button>
              <Button
                onClick={() => handleBulkAction('flag')}
                className="bg-warning hover:bg-warning text-white flex-1 sm:flex-none"
                size="sm"
              >
                <Flag className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Flag All</span>
                <span className="sm:hidden">Flag</span>
              </Button>
              <Button
                onClick={() => handleBulkAction('feature')}
                className="bg-warning hover:bg-warning text-white flex-1 sm:flex-none"
                size="sm"
              >
                <Star className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Toggle Featured</span>
                <span className="sm:hidden">Feature</span>
              </Button>
              <Button
                onClick={() => setSelectedReviews(new Set())}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Select All */}
      {paginatedReviews.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={paginatedReviews.every(r => selectedReviews.has(r.id)) && paginatedReviews.length > 0}
              onChange={() => {
                if (paginatedReviews.every(r => selectedReviews.has(r.id))) {
                  setSelectedReviews(new Set(Array.from(selectedReviews).filter(id => !paginatedReviews.find(r => r.id === id))));
                } else {
                  setSelectedReviews(new Set([...Array.from(selectedReviews), ...paginatedReviews.map(r => r.id)]));
                }
              }}
              className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
            />
            <span className="text-sm font-semibold text-foreground">
              Select all reviews on this page
            </span>
          </label>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-3 text-muted-foreground">Loading reviews...</p>
          </div>
        ) : paginatedReviews.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground">
            No reviews found
          </div>
        ) : (
          paginatedReviews.map((review) => {
            const avgRating = getAverageRating(review);

            return (
              <div
                key={review.id}
                className={cn(
                  "bg-card rounded-lg border border-border p-4 sm:p-5 hover:border-primary/30 transition-colors",
                  selectedReviews.has(review.id) && "ring-2 ring-primary border-primary"
                )}
              >
                <div className="flex items-start gap-4 mb-4">
                  <input
                    type="checkbox"
                    checked={selectedReviews.has(review.id)}
                    onChange={() => toggleReviewSelection(review.id)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="flex-1 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        getStatusBadgeClass(review.status)
                      )}>
                        {review.status}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-foreground border border-border font-semibold">
                        {review.type}
                      </span>
                      {review.featured && (
                        <span className="text-xs px-3 py-1 rounded-full bg-warning-muted text-warning-muted-foreground border-transparent font-semibold inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" aria-hidden="true" /> Featured
                        </span>
                      )}
                      {review.verifiedPurchase && (
                        <span className="text-xs px-3 py-1 rounded-full bg-success-muted text-success-muted-foreground border-transparent font-semibold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Verified Purchase
                        </span>
                      )}
                    </div>

                    {avgRating && (
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(Math.round(avgRating))}
                        <span className="text-sm text-muted-foreground font-medium">
                          {avgRating.toFixed(1)} / 5
                        </span>
                      </div>
                    )}

                    {review.title && (
                      <h3 className="text-lg font-bold text-foreground mb-2">{review.title}</h3>
                    )}

                    <p className="text-foreground mb-4 line-clamp-3">{review.content}</p>

                    {/* Review Images */}
                    {review.media && (() => {
                      const mediaList = Array.isArray(review.media)
                        ? review.media
                        : Object.values(review.media as Record<string, ReviewMedia>);
                      const images = mediaList.filter((m) => m.type === 'IMAGE');
                      return images.length > 0 ? (
                        <div className="mt-3 mb-4">
                          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><Camera className="w-4 h-4" aria-hidden="true" /> {images.length} image{images.length > 1 ? 's' : ''} attached</p>
                          <div className="flex flex-wrap gap-3">
                            {images.map((img) => (
                              <a
                                key={img.id}
                                href={img.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative w-24 h-24 rounded-lg overflow-hidden border border-border hover:border-primary/70 hover:shadow-md transition-all"
                              >
                                <img
                                  src={img.thumbnailUrl || img.url}
                                  alt={img.caption || 'Review image'}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>By: {review.userName || review.userId}</span>
                      {review.targetType === 'PRODUCT' && productsCache[review.targetId] ? (() => {
                        const product = productsCache[review.targetId];
                        const firstImage = product.images?.[0];
                        const imageUrl = firstImage
                          ? (typeof firstImage === 'string' ? firstImage : firstImage.url)
                          : null;
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Product:</span>
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-6 h-6 rounded object-cover border border-border"
                              />
                            )}
                            <a
                              href={`/products/${review.targetId}`}
                              className="text-primary hover:text-primary hover:underline font-medium"
                            >
                              {product.name}
                            </a>
                          </div>
                        );
                      })() : (
                        <span>Target: {review.targetType} #{review.targetId.substring(0, 8)}...</span>
                      )}
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      {review.helpfulCount > 0 && (
                        <span className="text-primary inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" /> {review.helpfulCount} helpful</span>
                      )}
                      {review.reportCount > 0 && (
                        <span className="text-error inline-flex items-center gap-1"><Flag className="w-3.5 h-3.5" aria-hidden="true" /> {review.reportCount} reports</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReview(review);
                        setReplyContent('');
                        setIsInternalReply(false);
                        setShowReplyModal(true);
                      }}
                      className="hover:bg-primary/10 hover:text-primary"
                      aria-label="Reply to review"
                    >
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReview(review);
                        setStatusUpdate({
                          status: 'APPROVED' as ReviewStatus,
                          moderationNotes: '',
                        });
                        setShowStatusModal(true);
                      }}
                      className="hover:bg-primary/10 hover:text-primary"
                      aria-label="View review details"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    {review.status === 'PENDING' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              setError(null);
                              await reviewService.updateReviewStatus(review.id, {
                                status: 'APPROVED',
                                moderationNotes: 'Quick approved',
                              });
                              toast.success('Review Approved', 'Review has been approved successfully');
                              loadReviews();
                            } catch (error) {
                              console.error('Error approving review:', error);
                              const errorMessage = error instanceof Error ? error.message : 'Failed to approve review. Please try again.';
                              setError(errorMessage);
                              toast.error('Approval Failed', errorMessage);
                            }
                          }}
                          className="hover:bg-success-muted hover:text-success"
                          aria-label="Approve review"
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              setError(null);
                              await reviewService.updateReviewStatus(review.id, {
                                status: 'REJECTED',
                                moderationNotes: 'Quick rejected',
                              });
                              toast.success('Review Rejected', 'Review has been rejected successfully');
                              loadReviews();
                            } catch (error) {
                              console.error('Error rejecting review:', error);
                              const errorMessage = error instanceof Error ? error.message : 'Failed to reject review. Please try again.';
                              setError(errorMessage);
                              toast.error('Rejection Failed', errorMessage);
                            }
                          }}
                          className="hover:bg-error-muted hover:text-error"
                          aria-label="Reject review"
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          setError(null);
                          await reviewService.updateReviewStatus(review.id, {
                            status: 'FLAGGED',
                            moderationNotes: 'Flagged for review',
                          });
                          toast.success('Review Flagged', 'Review has been flagged for moderation');
                          loadReviews();
                        } catch (error) {
                          console.error('Error flagging review:', error);
                          const errorMessage = error instanceof Error ? error.message : 'Failed to flag review. Please try again.';
                          setError(errorMessage);
                          toast.error('Flag Failed', errorMessage);
                        }
                      }}
                      className="hover:bg-warning-muted hover:text-warning"
                      aria-label="Flag review for moderation"
                    >
                      <Flag className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                </div>

                {/* Comments Section */}
                {review.comments && (Array.isArray(review.comments) ? review.comments.length > 0 : Object.keys(review.comments).length > 0) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-semibold text-foreground mb-2">Replies & Comments:</p>
                    <div className="space-y-3">
                      {(Array.isArray(review.comments)
                        ? review.comments
                        : Object.entries(review.comments as unknown as Record<string, any>).map(([id, c]) => ({ id, ...c }))
                      ).map((comment: any) => (
                        <div key={comment.id} className={cn("text-sm p-3 rounded-lg", comment.isInternal ? "bg-warning-muted border border-warning/20" : "bg-muted border border-border")}>
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{comment.userName}</span>
                              {comment.isInternal && (
                                <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">Internal Note</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-foreground">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {review.ratings && (Array.isArray(review.ratings) ? review.ratings.length > 0 : Object.keys(review.ratings).length > 0) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-semibold text-foreground mb-2">Detailed Ratings:</p>
                    <div className="flex flex-wrap gap-3">
                      {(Array.isArray(review.ratings)
                        ? review.ratings
                        : Object.entries(review.ratings as unknown as Record<string, any>).map(([aspect, r]) => ({ id: aspect, aspect, ...r }))
                      ).map((rating: any) => (
                        <div key={rating.id || rating.aspect} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{rating.aspect}:</span>
                          <span className="font-semibold text-foreground">
                            {rating.score}/{rating.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredReviews.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold text-foreground">
                Reply to Review
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-2">Review Content:</p>
                {selectedReview.title && (
                  <h3 className="font-bold text-foreground mb-2">{selectedReview.title}</h3>
                )}
                <p className="text-foreground">{selectedReview.content}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Your Reply
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="internal-reply"
                  checked={isInternalReply}
                  onChange={(e) => setIsInternalReply(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                />
                <label htmlFor="internal-reply" className="text-sm text-foreground">
                  This is an internal note (not visible to customer)
                </label>
              </div>
            </div>

            <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedReview(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim()}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold text-foreground">
                Update Review Status
              </h2>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Product Info */}
              {selectedReview.targetType === 'PRODUCT' && productsCache[selectedReview.targetId] && (() => {
                const product = productsCache[selectedReview.targetId];
                const firstImage = product.images?.[0];
                const imageUrl = firstImage
                  ? (typeof firstImage === 'string' ? firstImage : firstImage.url)
                  : null;
                return (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-muted-foreground font-medium mb-2">Product Being Reviewed:</p>
                    <div className="flex items-center gap-4">
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover border border-border"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-foreground">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                        <p className="text-sm font-medium text-primary">${product.price}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-2">Review Content:</p>
                {selectedReview.title && (
                  <h3 className="font-bold text-foreground mb-2">{selectedReview.title}</h3>
                )}
                <p className="text-foreground">{selectedReview.content}</p>

                {/* Review Images in Modal */}
                {selectedReview.media && (() => {
                  const mediaList = Array.isArray(selectedReview.media)
                    ? selectedReview.media
                    : Object.values(selectedReview.media as Record<string, ReviewMedia>);
                  const images = mediaList.filter((m) => m.type === 'IMAGE');
                  return images.length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1"><Camera className="w-4 h-4" aria-hidden="true" /> Attached Images ({images.length}):</p>
                      <div className="flex flex-wrap gap-3">
                        {images.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => setPreviewImage(img.url)}
                            className="relative group focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
                          >
                            <img
                              src={img.thumbnailUrl || img.url}
                              alt={img.caption || 'Review image'}
                              className="w-32 h-32 object-cover rounded-lg border border-border group-hover:border-primary/70 transition-all"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-xs bg-black/50 px-2 py-1 rounded">
                                Click to view
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  New Status
                </label>
                <Select
                  value={statusUpdate.status}
                  onChange={(value) => setStatusUpdate({ ...statusUpdate, status: value as ReviewStatus })}
                  options={[
                    { value: 'APPROVED', label: 'Approved' },
                    { value: 'REJECTED', label: 'Rejected' },
                    { value: 'FLAGGED', label: 'Flagged' },
                    { value: 'PENDING', label: 'Pending' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Moderation Notes
                </label>
                <textarea
                  value={statusUpdate.moderationNotes || ''}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, moderationNotes: e.target.value })}
                  placeholder="Add notes about this moderation decision..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                  rows={4}
                />
              </div>
            </div>

            <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedReview(null);
                }}
                variant="outline"
              >
                Cancel
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  Update Status
                </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={previewImage}
            alt="Review image preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      </div>
    </div>
    </PermissionGate>
  );
}
