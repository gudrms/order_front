# @order/order-core

Framework-free order business logic shared by order-facing apps.

## Current Exports

- `calculateOptionSubtotal`
- `calculateItemSubtotal`
- `calculateItemsSubtotal`
- `calculateDeliveryFee`
- `calculateOrderTotals`
- `validateOrderItems`
- `validateStorePolicy`
- `validateDiscount`
- `validateOrder`

## Scope

This package should contain pure order-domain logic that can be reused by delivery, table-order, admin, and future order surfaces before calling app-specific APIs.

Backend persistence and side effects still live in `apps/backend`.
