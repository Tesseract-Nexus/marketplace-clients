'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import {
  getProductReviews,
  createReview,
  addReviewReaction,
  uploadReviewMedia,
  Review,
  ReviewsResponse,
  ReviewMedia,
} from '@/lib/api/reviews';
import { cn } from '@/lib/utils';
import { ReviewImageUpload, UploadedImage } from './ReviewImageUpload';
import { ReviewImageGallery } from './ReviewImageGallery';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { tenant } = useTenant();
  const { isAuthenticated, accessToken, customer } = useAuthStore();

  const tenantId = tenant?.id || 'demo';
  const storefrontId = tenant?.storefrontId || 'demo';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewsResponse['summary']>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 5,
    reviewerName: '',
    reviewerEmail: '',
  });
  const [reviewImages, setReviewImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId, page]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch approved reviews
      const data = await getProductReviews(tenantId, storefrontId, productId, {
        page,
        limit: 10,
      });

      let allReviews = data.reviews;

      // If user is authenticated, also fetch their own pending reviews
      if (isAuthenticated && customer?.id) {
        try {
          const pendingData = await getProductReviews(tenantId, storefrontId, productId, {
            page: 1,
            limit: 10,
            status: 'PENDING',
          });
          // Filter to only show current user's pending reviews
          const userPendingReviews = pendingData.reviews.filter(
            (r) => r.userId === customer.id
          );
          // Mark them as pending and add to the list
          const markedPending = userPendingReviews.map((r) => ({
            ...r,
            _isPending: true,
          }));
          allReviews = [...markedPending, ...allReviews];
        } catch {
          // Ignore errors fetching pending reviews
        }
      }

      setReviews(allReviews);
      setSummary(data.summary);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setError('Unable to load reviews');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine reviewer name and email
    const reviewerName = isAuthenticated && customer
      ? (customer.firstName && customer.lastName
          ? `${customer.firstName} ${customer.lastName}`
          : customer.email || formData.reviewerName)
      : formData.reviewerName;
    const reviewerEmail = isAuthenticated && customer?.email
      ? customer.email
      : formData.reviewerEmail;

    if (!reviewerName || !reviewerEmail) {
      setSubmitError('Name and email are required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setUploadProgress('');

    try {
      // First create the review
      const review = await createReview(
        tenantId,
        storefrontId,
        accessToken || null,
        {
          targetId: productId,
          targetType: 'PRODUCT',
          type: 'PRODUCT',
          title: formData.title || undefined,
          content: formData.content,
          ratings: [{ aspect: 'overall', score: formData.rating, maxScore: 5 }],
          reviewerName,
          reviewerEmail,
        },
        customer?.id,
        reviewerName
      );

      // Then upload images if any
      if (reviewImages.length > 0) {
        setUploadProgress('Uploading images...');

        // Update images state to show uploading
        setReviewImages(prev => prev.map(img => ({ ...img, uploading: true })));

        for (const [index, image] of reviewImages.entries()) {
          setUploadProgress(`Uploading image ${index + 1} of ${reviewImages.length}...`);

          try {
            await uploadReviewMedia(
              tenantId,
              storefrontId,
              accessToken,
              review.id,
              image.file
            );

            // Mark as uploaded
            setReviewImages(prev => prev.map(img =>
              img.id === image.id ? { ...img, uploading: false, uploaded: true } : img
            ));
          } catch {
            // Mark as error but continue with other images
            setReviewImages(prev => prev.map(img =>
              img.id === image.id
                ? { ...img, uploading: false, error: 'Failed to upload' }
                : img
            ));
          }
        }
      }

      setSubmitSuccess(true);
      setFormData({ title: '', content: '', rating: 5, reviewerName: '', reviewerEmail: '' });
      setReviewImages([]);
      setShowForm(false);

      // Refresh reviews after a short delay (allow moderation)
      setTimeout(() => {
        fetchReviews();
        setSubmitSuccess(false);
      }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!accessToken) return;

    try {
      await addReviewReaction(tenantId, storefrontId, accessToken, reviewId, 'HELPFUL');
      // Update local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
        )
      );
    } catch {
      // Silently fail
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getOverallRating = (review: Review): number => {
    if (!review.ratings) return 5;

    // Handle array format: [{ aspect: 'overall', score: 5, maxScore: 5 }]
    if (Array.isArray(review.ratings)) {
      if (review.ratings.length === 0) return 5;
      const overall = review.ratings.find((r) => r.aspect === 'overall');
      return overall?.score || review.ratings[0]?.score || 5;
    }

    // Handle JSONB object format: { "overall": { "score": 5, "maxScore": 5 } }
    const ratingsObj = review.ratings as unknown as Record<string, { score: number; maxScore: number }>;
    if (ratingsObj.overall) {
      return ratingsObj.overall.score || 5;
    }
    // Fallback to first rating found
    const firstRating = Object.values(ratingsObj)[0];
    return firstRating?.score || 5;
  };

  // Calculate rating distribution and average from reviews
  const calculateRatingSummary = () => {
    // Filter out pending reviews from stats (only count approved)
    const approvedReviews = reviews.filter((r) => !(r as any)._isPending);

    if (approvedReviews.length === 0) {
      return {
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        average: 0,
        total: 0,
      };
    }

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    approvedReviews.forEach((review) => {
      const rating = getOverallRating(review);
      const roundedRating = Math.round(rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        distribution[roundedRating] = (distribution[roundedRating] || 0) + 1;
      }
      totalScore += rating;
    });

    return {
      distribution,
      average: totalScore / approvedReviews.length,
      total: approvedReviews.length,
    };
  };

  // Use server summary if available and valid, otherwise calculate from reviews
  const calculatedSummary = calculateRatingSummary();
  const ratingDistribution =
    summary?.ratingDistribution && Object.values(summary.ratingDistribution).some((v) => v > 0)
      ? summary.ratingDistribution
      : calculatedSummary.distribution;
  const totalReviewCount =
    summary?.totalReviews && summary.totalReviews > 0
      ? summary.totalReviews
      : calculatedSummary.total;
  const averageRating =
    summary?.averageRating && summary.averageRating > 0
      ? summary.averageRating
      : calculatedSummary.average;

  if (isLoading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>Thank you! Your review has been submitted and is pending approval.</span>
        </div>
      )}

      {/* Rating Summary */}
      {totalReviewCount > 0 && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center md:justify-start mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-5 w-5',
                    i < Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {totalReviewCount} review{totalReviewCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const percentage = totalReviewCount > 0 ? (count / totalReviewCount) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-3 text-sm">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Separator />

      {/* Write Review Button / Form */}
      <div>
        {showForm ? (
          <form onSubmit={handleSubmitReview} className="space-y-4 bg-muted/50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Write a Review for {productName}</h3>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {submitError}
              </div>
            )}

            {/* Name and Email fields for anonymous users */}
            {!isAuthenticated && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewer-name">Your Name *</Label>
                  <Input
                    id="reviewer-name"
                    placeholder="John Doe"
                    value={formData.reviewerName}
                    onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewer-email">Your Email *</Label>
                  <Input
                    id="reviewer-email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.reviewerEmail}
                    onChange={(e) => setFormData({ ...formData, reviewerEmail: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Your Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1"
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        star <= formData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-title">Title (optional)</Label>
              <Input
                id="review-title"
                placeholder="Summarize your review"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-content">Your Review</Label>
              <Textarea
                id="review-content"
                placeholder="Share your experience with this product..."
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Add Photos (optional)
              </Label>
              <ReviewImageUpload
                images={reviewImages}
                onImagesChange={setReviewImages}
                disabled={isSubmitting}
                maxImages={5}
                maxSizeMB={5}
              />
            </div>

            {uploadProgress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" className="btn-tenant-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button className="btn-tenant-primary" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Reviews List */}
      {error ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < getOverallRating(review)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    {(review as any)._isPending && (
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
                        Pending Approval
                      </Badge>
                    )}
                    {review.verifiedPurchase && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Purchase
                      </Badge>
                    )}
                  </div>

                  {review.title && (
                    <h4 className="font-semibold">{review.title}</h4>
                  )}

                  <p className="text-sm text-muted-foreground mt-1">
                    {review.userName || 'Anonymous'} - {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed">{review.content}</p>

              {/* Review Images */}
              {review.media && (
                (() => {
                  // Handle both array and JSONB object format
                  const mediaList: ReviewMedia[] = Array.isArray(review.media)
                    ? review.media
                    : Object.values(review.media as Record<string, ReviewMedia>);
                  return mediaList.length > 0 ? (
                    <div className="mt-3">
                      <ReviewImageGallery media={mediaList} />
                    </div>
                  ) : null;
                })()
              )}

              {/* Comments/Replies */}
              {review.comments && (
                (() => {
                  const commentsList = Array.isArray(review.comments)
                    ? review.comments.filter((c) => !c.isInternal)
                    : Object.values(review.comments).filter((c: any) => !c.isInternal);
                  if (commentsList.length === 0) return null;
                  return (
                    <div className="mt-4 pl-4 border-l-2 border-muted space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Seller Response:</p>
                      {commentsList.map((comment: any) => (
                        <div key={comment.id} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{comment.userName || 'Seller'}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}

              <div className="mt-3 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handleHelpful(review.id)}
                  disabled={!isAuthenticated}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpfulCount})
                </Button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
