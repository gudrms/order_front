import { expect, test as base, type Page, type Route } from '@playwright/test';

export const API_URL = 'http://localhost:4000/api/v1';

type AdminUser = {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  role?: 'ADMIN' | 'OWNER';
};

type AdminStore = {
  id: string;
  name: string;
  branchName: string;
  isActive?: boolean;
  [key: string]: unknown;
};

type AdminMocks = {
  user: AdminUser;
  stores: AdminStore[];
};

const defaultAdmin: AdminUser = {
  id: 'admin-e2e-user',
  email: 'admin-e2e@example.com',
  name: 'E2E Admin',
  phoneNumber: '010-0000-0000',
  role: 'ADMIN',
};

const defaultStore: AdminStore = {
  id: 'store-e2e-1',
  name: 'E2E Store',
  branchName: 'Main',
  isActive: true,
};

export const test = base.extend<{
  adminPage: Page;
  adminMocks: AdminMocks;
}>({
  adminMocks: async ({}, use) => {
    await use({ user: defaultAdmin, stores: [defaultStore] });
  },

  adminPage: async ({ page, adminMocks }, use) => {
    await installAdminSession(page, adminMocks.user);
    await installAdminBaseRoutes(page, adminMocks);
    await use(page);
  },
});

export { expect };

export async function installAdminSession(page: Page, user: AdminUser) {
  await page.addInitScript((sessionUser) => {
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
    const session = {
      access_token: 'e2e-access-token',
      refresh_token: 'e2e-refresh-token',
      expires_at: expiresAt,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: sessionUser.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: sessionUser.email,
      },
    };

    window.localStorage.setItem('sb-placeholder-auth-token', JSON.stringify(session));
  }, user);
}

export async function installAdminBaseRoutes(page: Page, mocks: AdminMocks) {
  await page.route(`${API_URL}/auth/me`, async (route) => {
    await fulfillJson(route, {
      data: {
        id: mocks.user.id,
        name: mocks.user.name ?? 'E2E Admin',
        phoneNumber: mocks.user.phoneNumber ?? '010-0000-0000',
        role: mocks.user.role ?? 'ADMIN',
      },
    });
  });

  await page.route(`${API_URL}/stores/me`, async (route) => {
    await fulfillJson(route, { data: mocks.stores });
  });

  for (const store of mocks.stores) {
    await page.route(`${API_URL}/stores/${store.id}/calls`, async (route) => {
      await fulfillJson(route, { data: [] });
    });

    await page.route(`${API_URL}/stores/${store.id}/stats/daily`, async (route) => {
      await fulfillJson(route, {
        data: {
          todayOrderCount: 0,
          todaySales: 0,
          activeOrderCount: 0,
          soldOutMenuCount: 0,
        },
      });
    });
  }
}

export async function gotoAdminPage(page: Page, path: string, readyTestId?: string) {
  const separator = path.includes('?') ? '&' : '?';
  const urlPattern = new RegExp(`${escapeRegExp(path)}(?:[?#].*)?$`);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt === 0) {
      await page.goto(`${path}${separator}e2e=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    } else {
      await page.reload({ waitUntil: 'domcontentloaded' });
    }

    await expect(page).toHaveURL(urlPattern, { timeout: 15_000 });

    if (!readyTestId) return;

    try {
      await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: 15_000 });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

export async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
