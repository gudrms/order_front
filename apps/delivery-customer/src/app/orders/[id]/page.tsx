import { OrderDetailClient } from './OrderDetailClient';

// Static export: order IDs are runtime-only, so no paths pre-generated at build time.
// Client-side navigation via router.push works; hard reload on this URL in Capacitor does not.
export function generateStaticParams() {
    return [];
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <OrderDetailClient orderId={id} />;
}
