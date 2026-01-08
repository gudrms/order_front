import { cn } from '../../lib/utils';

export interface OptionGroup {
    id: string;
    name: string;
    options: {
        id: string;
        name: string;
        price: number;
    }[];
}

export interface MenuOptionListProps {
    optionGroups: OptionGroup[];
    selectedOptions: { itemId: string }[];
    onOptionToggle: (groupName: string, optionId: string, optionName: string, optionPrice: number) => void;
    className?: string;
}

export function MenuOptionList({
    optionGroups,
    selectedOptions,
    onOptionToggle,
    className,
}: MenuOptionListProps) {
    if (!optionGroups || optionGroups.length === 0) return null;

    return (
        <div className={cn("space-y-6", className)}>
            {optionGroups.map((group) => (
                <div key={group.id}>
                    <h4 className="mb-3 font-semibold text-gray-900">{group.name}</h4>
                    <div className="space-y-2">
                        {group.options.map((option) => {
                            const isSelected = selectedOptions.some(
                                (opt) => opt.itemId === option.id
                            );
                            return (
                                <button
                                    key={option.id}
                                    onClick={() =>
                                        onOptionToggle(group.name, option.id, option.name, option.price)
                                    }
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                                        isSelected
                                            ? "border-brand-green bg-brand-green/5"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <span className="font-medium text-gray-900">{option.name}</span>
                                    <span className="text-gray-900">
                                        +{option.price.toLocaleString()}원
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
