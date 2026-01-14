/**
 * JSON-LD Structured Data Component
 *
 * Renders schema.org structured data as JSON-LD script tags.
 * Supports multiple schemas and automatic graph combination.
 */

import { renderJsonLd, combineSchemas } from '@/lib/seo/structured-data';

// =============================================================================
// JSON-LD COMPONENT
// =============================================================================

interface JsonLdProps {
  /** Single schema object or array of schemas */
  schema: object | object[];
  /** Optional key for React */
  id?: string;
}

/**
 * Renders JSON-LD structured data
 */
export function JsonLd({ schema, id }: JsonLdProps) {
  const schemas = Array.isArray(schema) ? schema : [schema];
  const combinedSchema = schemas.length > 1 ? combineSchemas(schemas) : schemas[0];

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: renderJsonLd(combinedSchema!),
      }}
    />
  );
}

// =============================================================================
// SPECIALIZED SCHEMA COMPONENTS
// =============================================================================

import {
  generateProductSchema,
  generateOrganizationSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateLocalBusinessSchema,
  generateSpeakableSchema,
  generateVideoSchema,
  generateWebSiteSchema,
  type ProductSchemaData,
  type OrganizationSchema,
  type FAQItem,
  type HowToSchema,
  type BreadcrumbItem,
  type ArticleSchema,
  type LocalBusinessSchema,
  type SpeakableSchema,
  type VideoSchema,
} from '@/lib/seo/structured-data';

/**
 * Product structured data
 */
export function ProductJsonLd({ product }: { product: ProductSchemaData }) {
  return <JsonLd schema={generateProductSchema(product)} id="product-jsonld" />;
}

/**
 * Organization structured data
 */
export function OrganizationJsonLd({ organization }: { organization: OrganizationSchema }) {
  return <JsonLd schema={generateOrganizationSchema(organization)} id="organization-jsonld" />;
}

/**
 * FAQ page structured data
 */
export function FAQJsonLd({ items }: { items: FAQItem[] }) {
  return <JsonLd schema={generateFAQSchema(items)} id="faq-jsonld" />;
}

/**
 * HowTo structured data
 */
export function HowToJsonLd({ howTo }: { howTo: HowToSchema }) {
  return <JsonLd schema={generateHowToSchema(howTo)} id="howto-jsonld" />;
}

/**
 * Breadcrumb structured data
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return <JsonLd schema={generateBreadcrumbSchema(items)} id="breadcrumb-jsonld" />;
}

/**
 * Article structured data (with E-E-A-T author info)
 */
export function ArticleJsonLd({ article }: { article: ArticleSchema }) {
  return <JsonLd schema={generateArticleSchema(article)} id="article-jsonld" />;
}

/**
 * Local business / Store structured data
 */
export function LocalBusinessJsonLd({ business }: { business: LocalBusinessSchema }) {
  return <JsonLd schema={generateLocalBusinessSchema(business)} id="localbusiness-jsonld" />;
}

/**
 * Speakable structured data for Google Assistant
 */
export function SpeakableJsonLd({
  pageUrl,
  speakable,
}: {
  pageUrl: string;
  speakable: SpeakableSchema;
}) {
  return <JsonLd schema={generateSpeakableSchema(pageUrl, speakable)} id="speakable-jsonld" />;
}

/**
 * Video structured data
 */
export function VideoJsonLd({ video }: { video: VideoSchema }) {
  return <JsonLd schema={generateVideoSchema(video)} id="video-jsonld" />;
}

/**
 * WebSite structured data with search action
 */
export function WebSiteJsonLd({
  name,
  url,
  searchUrl,
}: {
  name: string;
  url: string;
  searchUrl: string;
}) {
  return <JsonLd schema={generateWebSiteSchema(name, url, searchUrl)} id="website-jsonld" />;
}

// =============================================================================
// COMBINED PAGE SCHEMA
// =============================================================================

interface PageSchemaProps {
  breadcrumbs?: BreadcrumbItem[];
  organization?: OrganizationSchema;
  product?: ProductSchemaData;
  article?: ArticleSchema;
  faq?: FAQItem[];
  howTo?: HowToSchema;
  localBusiness?: LocalBusinessSchema;
  speakable?: { pageUrl: string; config: SpeakableSchema };
  video?: VideoSchema;
  website?: { name: string; url: string; searchUrl: string };
}

/**
 * Combined page schema - renders all applicable structured data
 */
export function PageSchema({
  breadcrumbs,
  organization,
  product,
  article,
  faq,
  howTo,
  localBusiness,
  speakable,
  video,
  website,
}: PageSchemaProps) {
  const schemas: object[] = [];

  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs));
  }
  if (organization) {
    schemas.push(generateOrganizationSchema(organization));
  }
  if (product) {
    schemas.push(generateProductSchema(product));
  }
  if (article) {
    schemas.push(generateArticleSchema(article));
  }
  if (faq && faq.length > 0) {
    schemas.push(generateFAQSchema(faq));
  }
  if (howTo) {
    schemas.push(generateHowToSchema(howTo));
  }
  if (localBusiness) {
    schemas.push(generateLocalBusinessSchema(localBusiness));
  }
  if (speakable) {
    schemas.push(generateSpeakableSchema(speakable.pageUrl, speakable.config));
  }
  if (video) {
    schemas.push(generateVideoSchema(video));
  }
  if (website) {
    schemas.push(generateWebSiteSchema(website.name, website.url, website.searchUrl));
  }

  if (schemas.length === 0) return null;

  return <JsonLd schema={schemas} id="page-schema" />;
}

export default JsonLd;
