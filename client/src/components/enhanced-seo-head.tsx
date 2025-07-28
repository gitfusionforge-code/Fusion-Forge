import { useEffect } from "react";
import { useLocation } from "wouter";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  category?: string;
  tags?: string[];
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export default function EnhancedSEOHead({
  title = "FusionForge PCs - Premium Custom PC Builds & Gaming Computers",
  description = "Discover premium custom PC builds for gaming, workstation, and content creation. Expert-curated components with professional assembly, competitive pricing, and full support in India.",
  keywords = "custom PC builds, gaming computers, PC assembly, computer components, gaming PC India, workstation PC, budget PC builds, high-end gaming rigs, PC configurator",
  image = "/images/pc-builds-hero.jpg",
  url,
  type = "website",
  author = "FusionForge PCs",
  publishedDate,
  modifiedDate,
  category,
  tags = [],
  canonicalUrl,
  noIndex = false,
  noFollow = false
}: SEOHeadProps) {
  const [location] = useLocation();
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fusionforge-pcs.replit.app';
  const currentUrl = url || `${baseUrl}${location}`;
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
  const canonical = canonicalUrl || currentUrl;

  // Enhanced title generation
  const fullTitle = title.includes('FusionForge PCs') 
    ? title 
    : `${title} | FusionForge PCs - Custom PC Builds`;

  // Enhanced keywords
  const allKeywords = [
    ...keywords.split(',').map(k => k.trim()),
    ...tags,
    'PC builds India',
    'custom computers',
    'gaming PCs',
    'computer assembly'
  ].filter(Boolean).join(', ');

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Remove existing meta tags and add new ones
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', allKeywords);
    updateMetaTag('author', author);
    
    // Robots meta tag
    const robotsContent = [];
    if (noIndex) robotsContent.push('noindex');
    if (noFollow) robotsContent.push('nofollow');
    if (robotsContent.length === 0) robotsContent.push('index', 'follow');
    updateMetaTag('robots', robotsContent.join(', '));

    // Open Graph tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImageUrl, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'FusionForge PCs', true);
    updateMetaTag('og:locale', 'en_IN', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', fullImageUrl);
    updateMetaTag('twitter:site', '@fusionforge_pcs');
    updateMetaTag('twitter:creator', '@fusionforge_pcs');

    // Additional meta tags
    updateMetaTag('theme-color', '#1e40af');
    updateMetaTag('msapplication-TileColor', '#1e40af');
    updateMetaTag('application-name', 'FusionForge PCs');
    updateMetaTag('apple-mobile-web-app-title', 'FusionForge PCs');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    
    // Geo tags for local SEO
    updateMetaTag('geo.region', 'IN');
    updateMetaTag('geo.placename', 'India');
    updateMetaTag('ICBM', '19.0760,72.8777'); // Mumbai coordinates

    // Article specific tags
    if (type === 'article') {
      if (publishedDate) updateMetaTag('article:published_time', publishedDate, true);
      if (modifiedDate) updateMetaTag('article:modified_time', modifiedDate, true);
      if (author) updateMetaTag('article:author', author, true);
      if (category) updateMetaTag('article:section', category, true);
      tags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.setAttribute('content', tag);
        document.head.appendChild(meta);
      });
    }

    // Canonical URL
    updateLinkTag('canonical', canonical);

    // Preconnect to external domains for performance
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ];
    
    preconnectDomains.forEach(domain => {
      if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        document.head.appendChild(link);
      }
    });

    // DNS prefetch for better performance
    const dnsPrefetchDomains = [
      'https://api.fusionforge-pcs.com',
      'https://images.fusionforge-pcs.com'
    ];
    
    dnsPrefetchDomains.forEach(domain => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      }
    });

    // Language and alternate language tags
    updateLinkTag('alternate', `${currentUrl}?lang=hi`);
    document.documentElement.lang = 'en';

    // Breadcrumb schema cleanup - remove old breadcrumb scripts
    const oldBreadcrumbScripts = document.querySelectorAll('script[type="application/ld+json"]');
    oldBreadcrumbScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] === 'BreadcrumbList') {
          script.remove();
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });

  }, [
    fullTitle, description, allKeywords, fullImageUrl, currentUrl, canonical,
    type, author, publishedDate, modifiedDate, category, tags, noIndex, noFollow
  ]);

  return null; // This component only updates the document head
}

// Utility function to generate page-specific SEO data
export function generateSEOData(page: string, data?: any) {
  const baseTitle = "FusionForge PCs";
  
  const seoConfigs = {
    home: {
      title: `${baseTitle} - Premium Custom PC Builds & Gaming Computers India`,
      description: "India's premier custom PC building service. Expert-curated gaming PCs, workstations, and budget builds with professional assembly, best components, and full support.",
      keywords: "custom PC builds India, gaming computers, PC assembly, computer components, gaming PC India, workstation PC, budget PC builds, high-end gaming rigs",
      type: "website"
    },
    builds: {
      title: `PC Builds Catalog - ${baseTitle}`,
      description: "Explore our curated collection of custom PC builds for every budget and use case. From budget-friendly office PCs to high-end gaming rigs and professional workstations.",
      keywords: "PC builds catalog, gaming PCs, workstation computers, budget builds, high-end PCs, custom computers India",
      type: "website"
    },
    'build-details': {
      title: data?.name ? `${data.name} - Custom PC Build | ${baseTitle}` : `PC Build Details - ${baseTitle}`,
      description: data?.description || "Detailed specifications and performance analysis of this custom PC build with component breakdown and pricing.",
      keywords: `${data?.name || 'PC build'}, custom PC, gaming computer, ${data?.category || 'computer'} build, PC specifications`,
      type: "product",
      image: data?.imageUrl
    },
    configurator: {
      title: `PC Build Configurator - Custom Computer Builder | ${baseTitle}`,
      description: "Design your perfect custom PC with our interactive configurator. Select components, check compatibility, get performance estimates, and build within your budget.",
      keywords: "PC configurator, custom PC builder, computer components, build calculator, PC compatibility checker, component selector",
      type: "website"
    },
    contact: {
      title: `Contact Us - Custom PC Build Quotes | ${baseTitle}`,
      description: "Get personalized PC build recommendations and quotes from our experts. Contact FusionForge PCs for custom gaming computers and workstation builds.",
      keywords: "PC build quote, custom computer consultation, gaming PC quote, workstation quote, PC build expert, contact FusionForge",
      type: "website"
    },
    about: {
      title: `About Us - Expert PC Builders | ${baseTitle}`,
      description: "Learn about FusionForge PCs, India's leading custom PC building service. Our expert team delivers premium gaming computers and workstations with professional assembly.",
      keywords: "about FusionForge PCs, PC building experts, custom computer company, gaming PC specialists, computer assembly service",
      type: "website"
    },
    services: {
      title: `Services - PC Building & Assembly | ${baseTitle}`,
      description: "Professional PC building services including custom assembly, component selection, performance optimization, and ongoing support for gaming and workstation computers.",
      keywords: "PC building services, computer assembly, custom PC service, gaming PC assembly, workstation building, PC optimization",
      type: "website"
    },
    faq: {
      title: `FAQ - PC Building Questions Answered | ${baseTitle}`,
      description: "Frequently asked questions about custom PC builds, assembly process, warranty, components, pricing, and support. Get expert answers from FusionForge PCs.",
      keywords: "PC building FAQ, custom computer questions, gaming PC help, PC assembly questions, computer building guide",
      type: "website"
    },
    admin: {
      title: `Admin Dashboard - ${baseTitle}`,
      description: "Admin dashboard for managing customer inquiries and PC build requests",
      keywords: "admin dashboard, inquiry management",
      type: "website",
      noIndex: true
    }
  };

  return seoConfigs[page as keyof typeof seoConfigs] || seoConfigs.home;
}