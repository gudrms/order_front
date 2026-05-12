export * from './stores/cartStore';

export type OrderFlow = 'DELIVERY' | 'TABLE';

export type OrderValidationCode =
  | 'EMPTY_ITEMS'
  | 'INVALID_MENU_ID'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRICE'
  | 'INVALID_OPTION'
  | 'MENU_UNAVAILABLE'
  | 'MENU_SOLD_OUT'
  | 'INSUFFICIENT_STOCK'
  | 'STORE_INACTIVE'
  | 'DELIVERY_UNAVAILABLE'
  | 'BELOW_MINIMUM_ORDER'
  | 'INVALID_DISCOUNT';

export interface OrderValidationIssue {
  code: OrderValidationCode;
  message: string;
  menuId?: string;
  requiredAmount?: number;
  actualAmount?: number;
}

export interface OrderOptionInput {
  id?: string;
  name?: string;
  price: number;
  quantity?: number;
}

export interface OrderItemInput {
  menuId: string;
  name?: string;
  unitPrice: number;
  quantity: number;
  options?: OrderOptionInput[];
  isAvailable?: boolean;
  soldOut?: boolean;
  stockQuantity?: number | null;
}

export interface StoreOrderPolicy {
  isActive?: boolean;
  isDeliveryEnabled?: boolean;
  minimumOrderAmount?: number | null;
  deliveryFee?: number | null;
  freeDeliveryThreshold?: number | null;
}

export interface OrderTotalsInput {
  items: OrderItemInput[];
  storePolicy?: StoreOrderPolicy;
  deliveryFee?: number;
  discountAmount?: number;
}

export interface OrderTotals {
  itemsSubtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
}

export interface ValidateOrderInput extends OrderTotalsInput {
  flow: OrderFlow;
}

export interface OrderValidationResult {
  valid: boolean;
  issues: OrderValidationIssue[];
  totals: OrderTotals;
}

export function calculateOptionSubtotal(option: OrderOptionInput): number {
  return option.price * (option.quantity ?? 1);
}

export function calculateItemSubtotal(item: OrderItemInput): number {
  const optionSubtotal = (item.options ?? []).reduce(
    (sum, option) => sum + calculateOptionSubtotal(option),
    0,
  );

  return (item.unitPrice + optionSubtotal) * item.quantity;
}

export function calculateItemsSubtotal(items: OrderItemInput[]): number {
  return items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
}

export function calculateDeliveryFee(
  itemsSubtotal: number,
  policy?: StoreOrderPolicy,
  overrideFee?: number,
): number {
  const baseFee = overrideFee ?? policy?.deliveryFee ?? 0;
  const freeThreshold = policy?.freeDeliveryThreshold;

  if (freeThreshold != null && freeThreshold > 0 && itemsSubtotal >= freeThreshold) {
    return 0;
  }

  return Math.max(0, baseFee);
}

export function calculateOrderTotals(input: OrderTotalsInput): OrderTotals {
  const itemsSubtotal = calculateItemsSubtotal(input.items);
  const deliveryFee = calculateDeliveryFee(itemsSubtotal, input.storePolicy, input.deliveryFee);
  const discountAmount = Math.max(0, input.discountAmount ?? 0);
  const totalAmount = Math.max(0, itemsSubtotal + deliveryFee - discountAmount);

  return {
    itemsSubtotal,
    deliveryFee,
    discountAmount,
    totalAmount,
  };
}

export function validateOrderItems(items: OrderItemInput[]): OrderValidationIssue[] {
  const issues: OrderValidationIssue[] = [];

  if (items.length === 0) {
    issues.push({ code: 'EMPTY_ITEMS', message: 'Order must include at least one item.' });
    return issues;
  }

  for (const item of items) {
    if (!item.menuId) {
      issues.push({ code: 'INVALID_MENU_ID', message: 'Menu id is required.' });
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      issues.push({
        code: 'INVALID_QUANTITY',
        message: 'Item quantity must be a positive integer.',
        menuId: item.menuId,
      });
    }

    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      issues.push({
        code: 'INVALID_PRICE',
        message: 'Item price must be a non-negative number.',
        menuId: item.menuId,
      });
    }

    if (item.isAvailable === false) {
      issues.push({
        code: 'MENU_UNAVAILABLE',
        message: 'Menu is not available.',
        menuId: item.menuId,
      });
    }

    if (item.soldOut === true) {
      issues.push({
        code: 'MENU_SOLD_OUT',
        message: 'Menu is sold out.',
        menuId: item.menuId,
      });
    }

    if (item.stockQuantity != null && item.stockQuantity < item.quantity) {
      issues.push({
        code: 'INSUFFICIENT_STOCK',
        message: 'Requested quantity exceeds available stock.',
        menuId: item.menuId,
        requiredAmount: item.quantity,
        actualAmount: item.stockQuantity,
      });
    }

    for (const option of item.options ?? []) {
      if (
        !Number.isFinite(option.price) ||
        option.price < 0 ||
        (option.quantity != null && (!Number.isInteger(option.quantity) || option.quantity < 1))
      ) {
        issues.push({
          code: 'INVALID_OPTION',
          message: 'Option price and quantity must be valid non-negative values.',
          menuId: item.menuId,
        });
      }
    }
  }

  return issues;
}

export function validateStorePolicy(
  flow: OrderFlow,
  itemsSubtotal: number,
  policy?: StoreOrderPolicy,
): OrderValidationIssue[] {
  const issues: OrderValidationIssue[] = [];

  if (policy?.isActive === false) {
    issues.push({ code: 'STORE_INACTIVE', message: 'Store is not active.' });
  }

  if (flow === 'DELIVERY' && policy?.isDeliveryEnabled === false) {
    issues.push({ code: 'DELIVERY_UNAVAILABLE', message: 'Store does not accept delivery orders.' });
  }

  const minimumOrderAmount = policy?.minimumOrderAmount;
  if (flow === 'DELIVERY' && minimumOrderAmount != null && itemsSubtotal < minimumOrderAmount) {
    issues.push({
      code: 'BELOW_MINIMUM_ORDER',
      message: 'Order subtotal is below the minimum delivery order amount.',
      requiredAmount: minimumOrderAmount,
      actualAmount: itemsSubtotal,
    });
  }

  return issues;
}

export function validateDiscount(discountAmount: number | undefined, itemsSubtotal: number): OrderValidationIssue[] {
  if (discountAmount == null) return [];

  if (!Number.isFinite(discountAmount) || discountAmount < 0 || discountAmount > itemsSubtotal) {
    return [
      {
        code: 'INVALID_DISCOUNT',
        message: 'Discount amount must be between zero and the item subtotal.',
        requiredAmount: itemsSubtotal,
        actualAmount: discountAmount,
      },
    ];
  }

  return [];
}

export function validateOrder(input: ValidateOrderInput): OrderValidationResult {
  const totals = calculateOrderTotals(input);
  const issues = [
    ...validateOrderItems(input.items),
    ...validateStorePolicy(input.flow, totals.itemsSubtotal, input.storePolicy),
    ...validateDiscount(input.discountAmount, totals.itemsSubtotal),
  ];

  return {
    valid: issues.length === 0,
    issues,
    totals,
  };
}
