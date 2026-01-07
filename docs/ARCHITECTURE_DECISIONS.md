# Architecture Decisions

## 1. Project Structure
**Decision**: Monorepo with separated apps and shared packages.

### Structure
```bash
apps/
  ├── table-order/    # (formerly frontend) Customer Tablet App
  ├── admin/          # Manager/Kitchen Admin App
  ├── delivery/       # [Planned] Delivery App
  └── backend/        # Unified NestJS Backend

packages/
  ├── shared/         # Shared Types, Utils, Constants
  ├── ui/             # Shared UI Components
  └── config/         # Shared Config (ESLint, TSConfig)
```

## 2. Backend Strategy
**Decision**: Single Modular Monolith (NestJS)

### Rationale
1.  **Data Consistency**: Table Order and Delivery apps share the same `Menu`, `Stock`, and `Store` data. A single backend ensures atomic updates and eliminates synchronization issues.
2.  **Operational Efficiency**:
    -   **Vercel Serverless**: Reduces Cold Start issues by keeping a single instance warm (or fewer instances).
    -   **DB Connections**: Minimizes connection overhead compared to microservices.
3.  **Code Reuse**: Shared modules (`OrdersModule`, `AuthModule`) can be easily reused across different contexts (Table vs Delivery) without network overhead.

### Implementation
-   Use **NestJS Modules** to separate concerns (`DeliveryModule`, `TableOrderModule`).
-   Use **Guards** and **Decorators** to handle different auth scopes (e.g., `@Roles('RIDER')`, `@Roles('CUSTOMER')`).

### Risks & Mitigations (SPOF)
**Concern**: If the single backend fails, both Table Order and Delivery services go down.

**Mitigation Strategy**:
1.  **Serverless Isolation**: In Vercel, each API request runs in an isolated environment. A runtime error in the "Table Order" logic does **not** crash the "Delivery" service. They are logically monolithic but physically isolated during execution.
2.  **Database Dependency**: Even with microservices, if they share the same Database (essential for inventory sync), the DB remains the Single Point of Failure.
    -   *Solution*: Use Supabase High Availability (HA) and Read Replicas if scale demands.
3.  **Code Separation**: By keeping modules distinct (`DeliveryModule` vs `OrderModule`), we can easily split them into separate microservices in the future if physical separation becomes necessary.

## 3. Client Strategy (Web vs Native)
**Decision**: **PWA (Progressive Web App)** for Table Order & Customer Delivery, **React Native** (Optional) for Rider App.

### Rationale
1.  **Table Order (Tablet)**:
    -   **Why Web?**: Tablets in stores are "dedicated devices". A Full-screen Web App (PWA) behaves exactly like a native app but is much easier to update (no App Store review needed).
    -   **Hardware**: If printer/card reader integration is needed, a simple "Native Shell" (WebView wrapper) is sufficient.

2.  **Delivery (Customer)**:
    -   **Strategy**: **Hybrid App (Next.js + Capacitor)**.
    -   **Why?**:
        -   **Web**: Accessible via link/QR without install (low barrier).
        -   **App**: Wrapped with Capacitor to publish to **Google Play & App Store**.
        -   **Native Features**: Use Capacitor Plugins for **Push Notifications**, **Camera**, etc.
        -   **Process**: Web Code -> `npx cap sync` -> Android/iOS Project -> App Store Submission.

3.  **Delivery (Rider)**:
    -   **Status**: **Out of Scope** (Using external delivery service providers).
    -   **Future**: If needed, build as separate React Native app.

## 4. Brand Website Strategy
**Decision**: **Simple Landing Page** hosted in the same Monorepo.

### Rationale
-   **Purpose**: Brand identity, menu introduction, store locator (SEO).
-   **Implementation**: A simple Next.js app (`apps/website`) or even a route inside `apps/delivery`.
-   **Cost**: Minimal development effort. Offered as a "Service" to the franchise to justify the commission fee.
-   **Maintenance**: Zero extra cost if hosted on Vercel alongside other apps.
