/**
 * Common UI Components
 *
 * Shared components for consistent UX across the admin portal.
 */

// Loading states
export { PageLoading, TableLoading, InlineLoading } from './PageLoading';

// Branded loaders (tiered loading system)
export { BrandedLoader, InitialLoader, PageLoader, Mark8lyIcon } from '../ui/branded-loader';

// Skeleton loaders (for perceived performance)
export {
  TableSkeleton,
  CardGridSkeleton,
  ListSkeleton,
  DashboardSkeleton,
  FormSkeleton,
} from '../ui/table-skeleton';

// Error states
export { PageError, CardError, EmptyState } from './PageError';
