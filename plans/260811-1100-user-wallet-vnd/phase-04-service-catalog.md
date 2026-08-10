# Phase 04 — Service Catalog

- Priority: P2 | Status: Pending | Effort: 2h
- Depends: Phase 01 (schema)
- Blocks: Phase 06 (FE — cần API để list gói dịch vụ)

## Overview

Admin CRUD cho service catalog (3 bảng: service_types, service_packages, service_pricing). Thay thế hardcode giá 39,000 VND (G5).

## Hiện trạng

- `service_packages` table đã tồn tại — dùng cho `AdminPackagesSettings.tsx` (FE admin).
- Chưa có `service_types` và `service_pricing` — giá cứng 39k nằm trong code.
- Case reference `package_id` — giữ nguyên, chỉ thêm `locked_price` snapshot khi case được tạo.

## API Design

```
GET    /api/admin/service-types           # List all service types
POST   /api/admin/service-types           # Create new type
PATCH  /api/admin/service-types/:id       # Update type

GET    /api/admin/packages                # List packages (có thể filter by service_type_id)
POST   /api/admin/packages                # Create package
PATCH  /api/admin/packages/:id            # Update package (name, features, is_active)

GET    /api/admin/packages/:id/pricing    # Pricing history
POST   /api/admin/packages/:id/pricing    # Set new price (auto: old is_current=false, new is_current=true)
```

## Implementation

### service-type.usecase.ts

```typescript
// apps/api/src/modules/packages/application/service-type.usecase.ts

import { prisma } from '../../../db';

export async function listServiceTypesUseCase() {
  return prisma.serviceType.findMany({
    where: { isActive: true },
    include: {
      packages: {
        where: { isActive: true },
        include: {
          pricingTiers: {
            where: { isCurrent: true },
            take: 1,
          },
        },
      },
    },
  });
}

export async function createServiceTypeUseCase(data: {
  code: string;
  name: string;
  description?: string;
}) {
  return prisma.serviceType.create({ data });
}

export async function updateServiceTypeUseCase(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean }
) {
  return prisma.serviceType.update({ where: { id }, data });
}
```

### service-pricing.usecase.ts

```typescript
// apps/api/src/modules/packages/application/service-pricing.usecase.ts

import { prisma } from '../../../db';

export async function setCurrentPricingUseCase(
  packageId: string,
  price: number,
  changedBy: string
) {
  return prisma.$transaction(async (tx) => {
    // Get current pricing
    const current = await tx.servicePricing.findFirst({
      where: { packageId, isCurrent: true },
    });

    // Set old pricing to not current
    if (current) {
      await tx.servicePricing.update({
        where: { id: current.id },
        data: { isCurrent: false },
      });
    }

    // Create new pricing
    return tx.servicePricing.create({
      data: {
        packageId,
        price,
        isCurrent: true,
        previousPrice: current?.price ?? null,
        changedBy,
        changedAt: new Date(),
      },
    });
  });
}

export async function getPricingHistoryUseCase(packageId: string) {
  return prisma.servicePricing.findMany({
    where: { packageId },
    orderBy: { changedAt: 'desc' },
  });
}
```

### Package routes (mở rộng)

```typescript
// Thêm vào file routes hiện tại của packages module

packagesRoutes.get('/service-types', async (c) => {
  const types = await listServiceTypesUseCase();
  return c.json({ types });
});

packagesRoutes.post('/service-types', async (c) => {
  const data = await c.req.json();
  const type = await createServiceTypeUseCase(data);
  return c.json(type, 201);
});

packagesRoutes.get('/:id/pricing', async (c) => {
  const history = await getPricingHistoryUseCase(c.req.param('id'));
  return c.json({ history });
});

packagesRoutes.post('/:id/pricing', async (c) => {
  const { price } = await c.req.json();
  const changedBy = c.get('user').id;
  const pricing = await setCurrentPricingUseCase(c.req.param('id'), price, changedBy);
  return c.json(pricing, 201);
});
```

## Price Resolution

Khi tạo case, cần resolve giá từ service catalog. Không hardcode 39,000 VND:

```typescript
// Hàm resolve giá (gọi từ submit-intake / tạo case)
export async function resolvePackagePrice(packageId: string): Promise<number> {
  const pricing = await prisma.servicePricing.findFirst({
    where: { packageId, isCurrent: true },
    select: { price: true },
  });
  return pricing?.price ?? 0;
}
```

## Gotcha Fix

| Gotcha | Fix |
|---|---|
| G5: 39,000 hardcode 3 chỗ | Dùng `resolvePackagePrice(packageId)` hoặc `service_pricing.price` — single source of truth |

**3 vị trí hardcode cần sửa (phase 05 hoặc phase riêng):**
1. `CreditQuantityModal.tsx:10` — `const CREDIT_PRICE = 39000` → gọi API lấy giá package
2. `upgrade-package.usecase.ts:10` — hardcode giá → dùng service_pricing
3. `payment.repository.ts:195` — `Math.round(amount / 39000)` → dùng service_pricing

## Deliverables

- [ ] `service-type.usecase.ts` — list, create, update
- [ ] `service-pricing.usecase.ts` — setCurrentPricing, getPricingHistory
- [ ] Package routes mở rộng (service-types CRUD, pricing)
- [ ] `resolvePackagePrice()` helper
- [ ] Update `AdminPackagesSettings.tsx` để dùng API mới (nếu cần)
- [ ] Seed data chạy đúng (xác nhận 4 service types + 4 pricing rows)
- [ ] `check-types` PASS
