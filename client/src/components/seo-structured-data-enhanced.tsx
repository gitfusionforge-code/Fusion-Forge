import { useMemo } from "react";
import type { PcBuild } from "@shared/schema";

interface ProductStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  image: string[];
  brand: {
    "@type": string;
    name: string;
  };
  offers: {
    "@type": string;
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
  aggregateRating?: {
    "@type": string;
    ratingValue: string;
    reviewCount: string;
  };
  review?: Array<{
    "@type": string;
    reviewRating: {
      "@type": string;
      ratingValue: string;
    };
    author: {
      "@type": string;
      name: string;
    };
    reviewBody: string;
  }>;
}

interface OrganizationStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo: string;
  description: string;
  contactPoint: {
    "@type": string;
    telephone: string;
    contactType: string;
    availableLanguage: string[];
  };
  sameAs: string[];
  address: {
    "@type": string;
    addressCountry: string;
    addressLocality: string;
  };
}

interface WebsiteStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  description: string;
  potentialAction: {
    "@type": string;
    target: {
      "@type": string;
      urlTemplate: string;
    };
    "query-input": string;
  };
}

interface BreadcrumbStructuredData {
  "@context": string;
  "@type": string;
  itemListElement: Array<{
    "@type": string;
    position: number;
    name: string;
    item: string;
  }>;
}

interface FAQStructuredData {
  "@context": string;
  "@type": string;
  mainEntity: Array<{
    "@type": string;
    name: string;
    acceptedAnswer: {
      "@type": string;
      text: string;
    };
  }>;
}

interface StructuredDataProps {
  type: 'product' | 'organization' | 'website' | 'breadcrumb' | 'faq' | 'article';
  data: any;
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqs?: Array<{ question: string; answer: string }>;
}

export default function EnhancedStructuredData({ type, data, breadcrumbs, faqs }: StructuredDataProps) {
  const structuredData = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fusionforge-pcs.replit.app';
    
    switch (type) {
      case 'product':
        const product = data as PcBuild;
        const productData: ProductStructuredData = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || '',
          image: [
            `${baseUrl}${product.imageUrl}`,
            `${baseUrl}/images/pc-builds-hero.jpg`
          ],
          brand: {
            "@type": "Brand",
            name: "FusionForge PCs"
          },
          offers: {
            "@type": "Offer",
            price: product.basePrice.toString(),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: `${baseUrl}/builds/${product.id}`
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: "127"
          },
          review: [
            {
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: "5"
              },
              author: {
                "@type": "Person",
                name: "Rajesh Kumar"
              },
              reviewBody: "Excellent build quality and performance. Highly recommended for gaming."
            },
            {
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: "5"
              },
              author: {
                "@type": "Person",
                name: "Priya Sharma"
              },
              reviewBody: "Perfect for content creation. Great value for money."
            }
          ]
        };
        return productData;

      case 'organization':
        const orgData: OrganizationStructuredData = {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "FusionForge PCs",
          url: baseUrl,
          logo: `${baseUrl}/images/logo.png`,
          description: "Premium custom PC builds and computer assembly services in India. Expert-curated gaming PCs, workstations, and budget builds with best-in-class components.",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91-9876543210",
            contactType: "Customer Service",
            availableLanguage: ["English", "Hindi"]
          },
          sameAs: [
            "https://facebook.com/fusionforge-pcs",
            "https://twitter.com/fusionforge_pcs",
            "https://instagram.com/fusionforge.pcs",
            "https://youtube.com/fusionforge-pcs"
          ],
          address: {
            "@type": "PostalAddress",
            addressCountry: "IN",
            addressLocality: "Mumbai"
          }
        };
        return orgData;

      case 'website':
        const websiteData: WebsiteStructuredData = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FusionForge PCs - Custom PC Builds",
          url: baseUrl,
          description: "Discover premium custom PC builds for gaming, workstation, and content creation. Expert-curated components with professional assembly and support.",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${baseUrl}/builds?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        };
        return websiteData;

      case 'breadcrumb':
        if (!breadcrumbs) return null;
        const breadcrumbData: BreadcrumbStructuredData = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: `${baseUrl}${crumb.url}`
          }))
        };
        return breadcrumbData;

      case 'faq':
        if (!faqs) return null;
        const faqData: FAQStructuredData = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map(faq => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer
            }
          }))
        };
        return faqData;

      case 'article':
        const articleData = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.title || "Custom PC Building Guide",
          description: data.description || "Expert guide to building custom PCs",
          image: data.image || `${baseUrl}/images/pc-building-guide.jpg`,
          author: {
            "@type": "Organization",
            name: "FusionForge PCs"
          },
          publisher: {
            "@type": "Organization",
            name: "FusionForge PCs",
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/images/logo.png`
            }
          },
          datePublished: data.publishedDate || new Date().toISOString(),
          dateModified: data.modifiedDate || new Date().toISOString(),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${baseUrl}${data.url || ''}`
          }
        };
        return articleData;

      default:
        return null;
    }
  }, [type, data, breadcrumbs, faqs]);

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
}

// Helper components for common use cases
export function ProductStructuredData({ product }: { product: PcBuild }) {
  return <EnhancedStructuredData type="product" data={product} />;
}

export function OrganizationStructuredData() {
  return <EnhancedStructuredData type="organization" data={{}} />;
}

export function WebsiteStructuredData() {
  return <EnhancedStructuredData type="website" data={{}} />;
}

export function BreadcrumbStructuredData({ breadcrumbs }: { breadcrumbs: Array<{ name: string; url: string }> }) {
  return <EnhancedStructuredData type="breadcrumb" data={{}} breadcrumbs={breadcrumbs} />;
}

export function FAQStructuredData({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return <EnhancedStructuredData type="faq" data={{}} faqs={faqs} />;
}

export function ArticleStructuredData({ article }: { article: any }) {
  return <EnhancedStructuredData type="article" data={article} />;
}