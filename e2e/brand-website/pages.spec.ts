import { expect, test } from './fixtures';

/**
 * 브랜드 홈페이지(brand-website) E2E
 *
 * 실제 API 없이도 동작:
 *  - 각 페이지 렌더링 확인
 *  - 네비게이션 링크 동작
 *  - 가맹 문의 폼 필드 존재 확인
 *  - 개인정보처리방침 페이지 접근
 */

test.describe('홈 페이지 (랜딩)', () => {
    test('메인 페이지가 로드된다', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('main')).toBeVisible();
    });

    test('히어로 브랜드명 텍스트가 표시된다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('타코몰리입니다.')).toBeVisible({ timeout: 8_000 });
    });

    test('"메뉴 보기" 클릭 시 /menu로 이동한다', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: '메뉴 보기' }).first().click();
        await expect(page).toHaveURL('/menu', { timeout: 8_000 });
    });

    test('"가맹 상담 신청하기" 클릭 시 /franchise로 이동한다', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: '가맹 상담 신청하기' }).click();
        await expect(page).toHaveURL('/franchise', { timeout: 8_000 });
    });

    test('대표 메뉴 섹션이 표시된다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('전체 메뉴 보기')).toBeVisible({ timeout: 8_000 });
    });

    test('운영 신뢰 지표와 API 기반 대표 메뉴가 표시된다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('인천 중심', { exact: true })).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('7개 매장', { exact: true })).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('시그니처 타코')).toBeVisible({ timeout: 8_000 });
    });

    test('매장 찾기와 주문 CTA 섹션이 표시된다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('STORE & ORDER')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('타코몰리 부평점')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByRole('link', { name: /전체 매장 보기/ })).toBeVisible();
        await expect(page.getByRole('link', { name: /지금 주문하기/ }).first()).toBeVisible();
    });

    test('가맹 섹션에서 미확정 수익률 대신 상담 안내를 보여준다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('상담 후')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('개설 비용 안내')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('30%')).toHaveCount(0);
    });
});

test.describe('네비게이션 바', () => {
    test('브랜드 소개 링크가 있다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: '브랜드 소개' }).first()).toBeVisible();
    });

    test('메뉴 소개 링크가 있다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: '메뉴 소개' }).first()).toBeVisible();
    });

    test('매장 찾기 링크가 있다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: '매장 찾기' }).first()).toBeVisible();
    });

    test('가맹 문의 링크가 있다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: '가맹 문의' }).first()).toBeVisible();
    });

    test('"브랜드 소개" 클릭 시 /brand로 이동한다', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: '브랜드 소개' }).first().click();
        await expect(page).toHaveURL('/brand', { timeout: 8_000 });
    });

    test('"매장 찾기" 클릭 시 /store로 이동한다', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: '매장 찾기' }).first().click();
        await expect(page).toHaveURL('/store', { timeout: 8_000 });
    });
});

test.describe('메뉴 페이지 (/menu)', () => {
    test('메뉴 페이지가 접근 가능하다', async ({ page }) => {
        await page.goto('/menu');
        await expect(page.locator('main')).toBeVisible({ timeout: 8_000 });
    });

    test('MENU 제목이 표시된다', async ({ page }) => {
        await page.goto('/menu');
        await expect(page.getByRole('heading', { name: 'MENU', level: 1 })).toBeVisible({ timeout: 8_000 });
    });
});

test.describe('브랜드 소개 페이지 (/brand)', () => {
    test('브랜드 소개 페이지가 접근 가능하다', async ({ page }) => {
        await page.goto('/brand');
        await expect(page.locator('main')).toBeVisible();
    });

    test('OUR STORY 제목이 표시된다', async ({ page }) => {
        await page.goto('/brand');
        await expect(page.getByRole('heading', { name: 'OUR STORY' })).toBeVisible({ timeout: 8_000 });
    });

    test('브랜드 가치(CORE VALUES) 섹션이 표시된다', async ({ page }) => {
        await page.goto('/brand');
        await expect(page.getByText('CORE VALUES')).toBeVisible({ timeout: 8_000 });
    });
});

test.describe('가맹 문의 페이지 (/franchise)', () => {
    test('가맹 문의 페이지가 접근 가능하다', async ({ page }) => {
        await page.goto('/franchise');
        await expect(page.locator('main')).toBeVisible();
    });

    test('FRANCHISE 제목이 표시된다', async ({ page }) => {
        await page.goto('/franchise');
        await expect(page.getByRole('heading', { name: 'FRANCHISE' })).toBeVisible({ timeout: 8_000 });
    });

    test('가맹 상담 신청 폼의 필수 입력 필드가 모두 있다', async ({ page }) => {
        await page.goto('/franchise');
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('input[name="phone"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="area"]')).toBeVisible();
        await expect(page.locator('textarea[name="message"]')).toBeVisible();
    });

    test('"상담 신청하기" 버튼이 있다', async ({ page }) => {
        await page.goto('/franchise');
        await expect(page.getByRole('button', { name: '상담 신청하기' })).toBeVisible({ timeout: 8_000 });
    });

    test('가맹 개설 비용 정보가 표시된다', async ({ page }) => {
        await page.goto('/franchise');
        await expect(page.getByText('가맹 개설 비용')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('5,000 만원')).toBeVisible({ timeout: 8_000 });
    });
});

test.describe('매장 찾기 페이지 (/store)', () => {
    test('매장 찾기 페이지가 접근 가능하다', async ({ page }) => {
        await page.goto('/store');
        await expect(page.getByRole('main')).toBeVisible({ timeout: 8_000 });
    });

    test('FIND A STORE 제목이 표시된다', async ({ page }) => {
        await page.goto('/store');
        await expect(page.getByRole('heading', { name: 'FIND A STORE' })).toBeVisible({ timeout: 10_000 });
    });

    test('매장 검색 입력창이 있다', async ({ page }) => {
        await page.goto('/store');
        await expect(page.locator('input[placeholder*="지역 또는 매장명"]')).toBeVisible({ timeout: 10_000 });
    });

    test('전체 매장 리스트가 기본으로 모두 표시된다', async ({ page }) => {
        await page.goto('/store');
        await expect(page.getByText('총')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('타코몰리 부평점')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('타코몰리 루원시티점')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('인천 부평구 장제로249번길 9 1층')).toBeVisible();
        await expect(page.getByText('인천 서구 서곶로 45')).toBeVisible();
    });

    test('검색어 입력 시 리스트가 필터링된다', async ({ page }) => {
        await page.goto('/store');
        await page.locator('input[placeholder*="지역 또는 매장명"]').fill('루원');
        await expect(page.getByText('타코몰리 루원시티점')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('타코몰리 부평점')).toHaveCount(0);
    });
});

test.describe('개인정보처리방침 페이지 (/privacy)', () => {
    test('개인정보처리방침 페이지가 접근 가능하다', async ({ page }) => {
        await page.goto('/privacy');
        await expect(page.locator('main')).toBeVisible();
    });

    test('개인정보처리방침 제목이 표시된다', async ({ page }) => {
        await page.goto('/privacy');
        await expect(
            page.getByRole('heading', { name: '개인정보처리방침', exact: true })
        ).toBeVisible({ timeout: 8_000 });
    });

    test('계정 삭제 안내 섹션이 있다', async ({ page }) => {
        await page.goto('/privacy');
        await expect(page.getByText('계정 삭제 요청', { exact: true })).toBeVisible({ timeout: 8_000 });
    });
});
