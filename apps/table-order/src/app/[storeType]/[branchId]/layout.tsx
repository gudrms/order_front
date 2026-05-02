import { notFound } from 'next/navigation';
import { StoreProvider } from '@/contexts/StoreContext';
import { DOMAINS } from '@/lib/constants/domains';

interface StoreLayoutProps {
  params: Promise<{
    storeType: string;
    branchId: string;
  }>;
  children: React.ReactNode;
}

async function getStore(storeType: string, branchId: string) {
  try {
    const res = await fetch(
      `${DOMAINS.API}/stores/identifier/${storeType}/${branchId}`,
      { cache: 'no-store' }
    );

    if (!res.ok) return null;

    const json = await res.json();
    return json.data || json;
  } catch (error) {
    console.error('Failed to fetch store:', error);
    return null;
  }
}

export default async function StoreLayout({ params, children }: StoreLayoutProps) {
  const { storeType, branchId } = await params;
  const store = await getStore(storeType, branchId);

  if (!store) {
    notFound();
  }

  return <StoreProvider store={store}>{children}</StoreProvider>;
}
