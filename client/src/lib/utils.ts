import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number | null | undefined): string {
  if (price === null || price === undefined) return '₹0';
  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[₹,]/g, '')) : price;
  if (isNaN(numericPrice)) return '₹0';
  return `₹${numericPrice.toLocaleString('en-IN')}`;
}

export function formatBenchmarks(benchmarksString: string): Record<string, string> {
  try {
    return JSON.parse(benchmarksString);
  } catch {
    return {};
  }
}

export function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    'budget': 'Budget',
    'mid-range': 'Mid-Range',
    'high-end': 'High-End',
    'premium': 'Premium'
  };
  return categoryMap[category] || category;
}

export function getUseCaseDisplayName(useCase: string): string {
  const useCaseMap: Record<string, string> = {
    'gaming': 'Gaming',
    'content-creation': 'Content Creation',
    'workstation': 'Professional Workstation',
    'office': 'Office/General Use',
    'ai-ml': 'AI/Machine Learning'
  };
  return useCaseMap[useCase] || useCase;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function calculatePerformanceScore(components: any): number {
  // Simple performance scoring based on component specifications
  let score = 0;
  
  // CPU scoring
  if (components.cpu?.includes('i9') || components.cpu?.includes('Ryzen 9')) score += 30;
  else if (components.cpu?.includes('i7') || components.cpu?.includes('Ryzen 7')) score += 25;
  else if (components.cpu?.includes('i5') || components.cpu?.includes('Ryzen 5')) score += 20;
  else score += 10;
  
  // GPU scoring
  if (components.gpu?.includes('RTX 4090') || components.gpu?.includes('RTX 4080')) score += 40;
  else if (components.gpu?.includes('RTX 4070') || components.gpu?.includes('RTX 3080')) score += 35;
  else if (components.gpu?.includes('RTX 4060') || components.gpu?.includes('RTX 3070')) score += 30;
  else if (components.gpu?.includes('GTX') || components.gpu?.includes('RTX')) score += 20;
  else score += 10;
  
  // RAM scoring
  const ramSize = parseInt(components.ram?.match(/\d+/)?.[0] || '0');
  if (ramSize >= 32) score += 20;
  else if (ramSize >= 16) score += 15;
  else if (ramSize >= 8) score += 10;
  else score += 5;
  
  // Storage scoring
  if (components.storage?.includes('NVMe') || components.storage?.includes('SSD')) score += 10;
  else score += 5;
  
  return Math.min(score, 100);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}