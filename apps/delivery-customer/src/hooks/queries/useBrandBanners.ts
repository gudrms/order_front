import { useQuery } from '@tanstack/react-query';

export type BrandBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  bgType: string;
  bgStartColor?: string | null;
  bgEndColor?: string | null;
  imageUrl?: string | null;
  linkType: string;
  linkUrl?: string | null;
  storeId?: string | null;
  displayOrder: number;
  isActive: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tacomole.kr/api/v1';

export function useBrandBanners() {
  return useQuery<BrandBanner[]>({
    queryKey: ['brand-banners'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/brand-banners`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
