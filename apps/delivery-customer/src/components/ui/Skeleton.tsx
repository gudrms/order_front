import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn('animate-pulse rounded-md bg-gray-200', className)} />
    );
}

export function MenuListSkeleton() {
    return (
        <div className="p-4 space-y-6 pb-24">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-5 w-1/4 mt-2" />
                    </div>
                    <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
                </div>
            ))}
        </div>
    );
}

export function OrderCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-16" />
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
            </div>
        </div>
    );
}

export function OrdersPageSkeleton() {
    return (
        <div className="max-w-[568px] mx-auto p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function OrderDetailSkeleton() {
    return (
        <div className="max-w-[568px] mx-auto p-4 space-y-4">
            {/* 상태 트래커 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <Skeleton className="h-3 w-10" />
                        </div>
                    ))}
                </div>
            </div>
            {/* 주문 내역 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                <Skeleton className="h-5 w-24" />
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-1/3 ml-auto" />
                </div>
            </div>
            {/* 배달 정보 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
                <Skeleton className="h-5 w-24" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AddressListSkeleton() {
    return (
        <div className="max-w-[568px] mx-auto p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between mb-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-5 rounded" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            ))}
        </div>
    );
}

export function FavoritesListSkeleton() {
    return (
        <div className="max-w-[568px] mx-auto p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4">
                    <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between pt-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-8 w-20 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MypageSkeleton() {
    return (
        <div className="max-w-[568px] mx-auto px-4 pb-24">
            {/* 프로필 헤더 */}
            <div className="bg-white rounded-2xl p-5 mb-4 space-y-3">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-4 w-36" />
                    </div>
                </div>
            </div>
            {/* 메뉴 항목들 */}
            <div className="bg-white rounded-2xl divide-y divide-gray-100">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-5 h-5 rounded" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="w-4 h-4 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
