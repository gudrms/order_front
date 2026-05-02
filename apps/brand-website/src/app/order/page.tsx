import { Suspense } from 'react';
import OrderContent from './OrderContent';

export default function OrderPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
            <OrderContent />
        </Suspense>
    );
}
