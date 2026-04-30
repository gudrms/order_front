import { OrderDetailClient } from './OrderDetailClient';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <OrderDetailClient orderId={id} />;
}
