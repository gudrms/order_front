'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold">문제가 발생했습니다.</h2>
            <p className="text-gray-600">
                일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
            </p>
            <Button onClick={() => reset()} variant="primary">
                다시 시도
            </Button>
        </div>
    );
}
