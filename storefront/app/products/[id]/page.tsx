import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getProduct, getProductReviewSummary, resolveStorefront } from '@/lib/api/storefront';
import { ProductDetailClient } from './ProductDetailClient';
import { resolveTenantId, resolveTenantInfo } from '@/lib/tenant';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { ProductSchemaData } from '@/lib/seo/structured-data';
import { Product, ProductImage } from '@/types/storefront';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Helper function to get image URL from product images
function getProductImageUrl(image: ProductImage | string): string {
  return typeof image === 'string' ? image : image.url;
}

// Helper function to get all image URLs
function getProductImageUrls(images?: (ProductImage | string)[]): string[] {
  if (!images || images.length === 0) return [];
  return images.map(getProductImageUrl);
}

// Helper to map inventory status to schema.org availability
function getSchemaAvailability(product: Product): 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder' | 'LimitedAvailability' {
  switch (product.inventoryStatus) {
    case 'IN_STOCK':
      return 'InStock';
    case 'LOW_STOCK':
      return 'LimitedAvailability';
    case 'OUT_OF_STOCK':
      return 'OutOfStock';
    case 'BACK_ORDER':
      return 'BackOrder';
    default:
      return product.status === 'ACTIVE' ? 'InStock' : 'OutOfStock';
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const slug = headersList.get('x-tenant-slug');
  if (!slug) {
    return { title: 'Product Not Found' };
  }
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const { id } = await params;

  // Resolve tenant and storefront info
  const [tenantId, resolution] = await Promise.all([
    resolveTenantId(slug),
    resolveStorefront(slug),
  ]);

  if (!tenantId) {
    return { title: 'Product Not Found' };
  }

  // Fetch product
  const product = await getProduct(tenantId, tenantId, id);
  if (!product) {
    return { title: 'Product Not Found' };
  }

  const storeName = resolution?.name || 'Store';
  const images = getProductImageUrls(product.images);
  const productUrl = `${baseUrl}/products/${product.slug || id}`;

  // Prefer dedicated SEO fields, fallback to auto-generated
  const title = product.seoTitle || `${product.name} | ${storeName}`;
  const description = product.seoDescription
    || product.description?.slice(0, 160)
    || `Shop ${product.name} at ${storeName}`;
  const ogImageUrl = product.ogImage || images[0];

  return {
    title,
    description,
    openGraph: {
      title: product.seoTitle || product.name,
      description,
      type: 'website',
      images: ogImageUrl ? [{ url: ogImageUrl }] : images.map(url => ({ url })),
      url: productUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.seoTitle || product.name,
      description,
      images: ogImageUrl ? [ogImageUrl] : images.slice(0, 1),
    },
    alternates: {
      canonical: productUrl,
    },
    ...(product.seoKeywords && product.seoKeywords.length > 0 && {
      keywords: product.seoKeywords,
    }),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const slug = headersList.get('x-tenant-slug');
  if (!slug) {
    notFound();
  }
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  const { id } = await params;

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  if (!tenantId) {
    notFound();
  }

  // Fetch product from real API using tenant UUID
  const product = await getProduct(tenantId, tenantId, id);

  if (!product) {
    notFound();
  }

  // Enrich product with review summary if not already present
  if (!product.averageRating) {
    const reviewSummary = await getProductReviewSummary(tenantId, tenantId, product.id);
    if (reviewSummary) {
      product.averageRating = reviewSummary.averageRating;
      product.reviewCount = reviewSummary.reviewCount;
    }
  }

  // Prepare JSON-LD schema data
  const images = getProductImageUrls(product.images);
  const productUrl = `${baseUrl}/products/${product.slug || id}`;

  const productSchemaData: ProductSchemaData = {
    id: product.id,
    name: product.name,
    description: product.description || '',
    sku: product.sku,
    brand: product.brand,
    images,
    price: parseFloat(product.price),
    currency: product.currency || 'USD',
    availability: getSchemaAvailability(product),
    url: productUrl,
    reviewCount: product.reviewCount,
    ratingValue: product.averageRating,
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Products', url: `${baseUrl}/products` },
    { name: product.name, url: productUrl },
  ];

  return (
    <>
      <ProductJsonLd product={productSchemaData} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ProductDetailClient product={product} />
    </>
  );
}
