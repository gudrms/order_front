import { Minus, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CartItemCardProps {
    name: string;
    price: number;
    quantity: number;
    options?: {
        groupName: string;
        itemName: string;
        price: number;
    }[];
    imageUrl?: string | null;
    onIncrease: () => void;
    onDecrease: () => void;
    onRemove: () => void;
    className?: string;
}

export function CartItemCard({
    name,
    price,
    quantity,
    options,
    imageUrl,
    onIncrease,
    onDecrease,
    onRemove,
    className,
}: CartItemCardProps) {
    return (
        <div className={cn("flex gap-4 py-4 border-b border-gray-100 last:border-0", className)}>
            {/* Image */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl || 'https://via.placeholder.com/150'}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-brand-black text-sm mb-1">{name}</h4>
                        {options && options.length > 0 && (
                            <div className="text-xs text-gray-500 space-y-0.5">
                                {options.map((opt, idx) => (
                                    <p key={idx}>
                                        {opt.groupName}: {opt.itemName} (+{opt.price.toLocaleString()}원)
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onRemove}
                        className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                        <button
                            onClick={onDecrease}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-black disabled:opacity-30"
                            disabled={quantity <= 1}
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{quantity}</span>
                        <button
                            onClick={onIncrease}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-black"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <span className="font-bold text-brand-black">
                        {price.toLocaleString()}원
                    </span>
                </div>
            </div>
        </div>
    );
}
