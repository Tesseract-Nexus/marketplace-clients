import { ErrorState } from '@/components/ui/error-state';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <ErrorState
        type="not_found"
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        showHomeButton
        showSuggestions
        suggestions={[
          'Check the URL for typos',
          'The page may have been deleted or moved',
          'Try navigating from the dashboard',
        ]}
      />
    </div>
  );
}
