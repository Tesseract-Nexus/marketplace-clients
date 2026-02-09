import type { Product, Category, ProductImage } from '@/lib/api/types';

// --- Score interfaces ---

export interface ProductSEOScore {
  id: string;
  name: string;
  slug?: string;
  score: number;
  issues: string[];
  hasTitle: boolean;
  hasDescription: boolean;
  hasKeywords: boolean;
  hasImage: boolean;
  hasOgImage: boolean;
  hasSlug: boolean;
  hasBrand: boolean;
}

export interface CategorySEOScore {
  id: string;
  name: string;
  slug: string;
  score: number;
  issues: string[];
  hasTitle: boolean;
  hasDescription: boolean;
  hasKeywords: boolean;
  hasImage: boolean;
}

export interface FieldCompletionRates {
  title: number;
  description: number;
  keywords: number;
  images: number;
  ogImage: number;
  slug: number;
}

export interface SEOAnalytics {
  totalProducts: number;
  totalCategories: number;
  overallScore: number;
  optimizedCount: number;
  needsWorkCount: number;
  poorCount: number;
  fieldCompletionRates: FieldCompletionRates;
  productScores: ProductSEOScore[];
  categoryScores: CategorySEOScore[];
}

// --- Helpers ---

function getProductImages(product: Product): string[] {
  if (!product.images || product.images.length === 0) return [];
  return product.images
    .map((img) => (typeof img === 'string' ? img : (img as ProductImage).url))
    .filter(Boolean);
}

// --- Product scoring ---

export function calculateProductSEOScore(product: Product): ProductSEOScore {
  let score = 0;
  const issues: string[] = [];

  const title = product.seoTitle?.trim() || '';
  const name = product.name?.trim() || '';
  const description = product.seoDescription?.trim() || '';
  const productDesc = product.description?.trim() || '';
  const keywords = product.seoKeywords || [];
  const images = getProductImages(product);
  const ogImage = product.ogImage?.trim() || '';
  const slug = product.slug?.trim() || '';
  const brand = product.brand?.trim() || '';

  // Has seoTitle OR name > 10 chars (15 pts)
  const hasTitle = title.length > 0 || name.length > 10;
  if (hasTitle) {
    score += 15;
  } else {
    issues.push('Missing SEO title');
  }

  // seoTitle length 30-60 chars (10 pts)
  if (title.length >= 30 && title.length <= 60) {
    score += 10;
  } else if (title.length > 0) {
    if (title.length < 30) issues.push('SEO title too short (aim for 30-60 characters)');
    if (title.length > 60) issues.push('SEO title too long (aim for 30-60 characters)');
  }

  // Has seoDescription OR description > 50 chars (15 pts)
  const hasDescription = description.length > 0 || productDesc.length > 50;
  if (hasDescription) {
    score += 15;
  } else {
    issues.push('Missing SEO description');
  }

  // seoDescription length 120-160 chars (10 pts)
  if (description.length >= 120 && description.length <= 160) {
    score += 10;
  } else if (description.length > 0) {
    if (description.length < 120) issues.push('SEO description too short (aim for 120-160 characters)');
    if (description.length > 160) issues.push('SEO description too long (aim for 120-160 characters)');
  }

  // Has at least 1 seoKeyword (10 pts)
  const hasKeywords = keywords.length >= 1;
  if (hasKeywords) {
    score += 10;
  } else {
    issues.push('Missing SEO keywords');
  }

  // Has 3+ seoKeywords (5 pts)
  if (keywords.length >= 3) {
    score += 5;
  } else if (keywords.length > 0) {
    issues.push('Add more keywords (aim for 3+)');
  }

  // Has at least 1 product image (15 pts)
  const hasImage = images.length > 0;
  if (hasImage) {
    score += 15;
  } else {
    issues.push('Missing product images');
  }

  // Has ogImage set (5 pts)
  const hasOgImage = ogImage.length > 0;
  if (hasOgImage) {
    score += 5;
  } else {
    issues.push('Missing social sharing (OG) image');
  }

  // Has product slug (10 pts)
  const hasSlug = slug.length > 0;
  if (hasSlug) {
    score += 10;
  } else {
    issues.push('Missing URL slug');
  }

  // Has brand (5 pts)
  const hasBrand = brand.length > 0;
  if (hasBrand) {
    score += 5;
  } else {
    issues.push('Missing brand');
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    score,
    issues,
    hasTitle: title.length > 0,
    hasDescription: description.length > 0,
    hasKeywords,
    hasImage,
    hasOgImage,
    hasSlug,
    hasBrand,
  };
}

// --- Category scoring ---

export function calculateCategorySEOScore(category: Category): CategorySEOScore {
  let score = 0;
  const issues: string[] = [];

  const title = category.seoTitle?.trim() || '';
  const description = category.seoDescription?.trim() || '';
  const catDesc = category.description?.trim() || '';
  const hasKeywordsData =
    category.seoKeywords != null &&
    typeof category.seoKeywords === 'object' &&
    Object.keys(category.seoKeywords).length > 0;
  const hasImage = !!(category.imageUrl?.trim());

  // Title (25 pts)
  const hasTitle = title.length > 0 || (category.name?.trim().length || 0) > 5;
  if (hasTitle) score += 25;
  else issues.push('Missing SEO title');

  // Description (25 pts)
  const hasDescription = description.length > 0 || catDesc.length > 30;
  if (hasDescription) score += 25;
  else issues.push('Missing SEO description');

  // Keywords (25 pts)
  if (hasKeywordsData) score += 25;
  else issues.push('Missing SEO keywords');

  // Image (25 pts)
  if (hasImage) score += 25;
  else issues.push('Missing category image');

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    score,
    issues,
    hasTitle: title.length > 0,
    hasDescription: description.length > 0,
    hasKeywords: hasKeywordsData,
    hasImage,
  };
}

// --- Aggregate ---

export function aggregateSEOAnalytics(
  products: Product[],
  categories: Category[]
): SEOAnalytics {
  const productScores = products.map(calculateProductSEOScore);
  const categoryScores = categories.map(calculateCategorySEOScore);

  const totalProducts = productScores.length;
  const totalCategories = categoryScores.length;

  const optimizedCount = productScores.filter((p) => p.score >= 80).length;
  const needsWorkCount = productScores.filter((p) => p.score >= 50 && p.score < 80).length;
  const poorCount = productScores.filter((p) => p.score < 50).length;

  const overallScore =
    totalProducts > 0
      ? Math.round(productScores.reduce((sum, p) => sum + p.score, 0) / totalProducts)
      : 0;

  const pct = (count: number) => (totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0);

  const fieldCompletionRates: FieldCompletionRates = {
    title: pct(productScores.filter((p) => p.hasTitle).length),
    description: pct(productScores.filter((p) => p.hasDescription).length),
    keywords: pct(productScores.filter((p) => p.hasKeywords).length),
    images: pct(productScores.filter((p) => p.hasImage).length),
    ogImage: pct(productScores.filter((p) => p.hasOgImage).length),
    slug: pct(productScores.filter((p) => p.hasSlug).length),
  };

  return {
    totalProducts,
    totalCategories,
    overallScore,
    optimizedCount,
    needsWorkCount,
    poorCount,
    fieldCompletionRates,
    productScores,
    categoryScores,
  };
}

// --- Display helpers ---

export function getSEOScoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

export function getSEOScoreLabel(score: number): 'Good' | 'Fair' | 'Poor' {
  if (score >= 80) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}
