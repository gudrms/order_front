/**
 * CartItemCard Presenter 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartItemCard } from './CartItemCard';
import type { CartSelectedOption } from '@order/shared';

describe('CartItemCard Presenter', () => {
  const mockHandlers = {
    onIncrease: vi.fn(),
    onDecrease: vi.fn(),
    onRemove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('메뉴 이름을 렌더링한다', () => {
    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={1}
        totalPrice={18000}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('후라이드 치킨')).toBeInTheDocument();
  });

  it('수량을 렌더링한다', () => {
    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={3}
        totalPrice={54000}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('가격을 포맷팅하여 렌더링한다', () => {
    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={2}
        totalPrice={36000}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('36,000원')).toBeInTheDocument();
  });

  it('옵션이 없을 때는 옵션을 렌더링하지 않는다', () => {
    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={1}
        totalPrice={18000}
        {...mockHandlers}
      />
    );

    // "+" 문자가 옵션 표시에 사용되므로 없어야 함
    expect(screen.queryByText(/^\+ /)).not.toBeInTheDocument();
  });

  it('옵션이 있을 때 옵션을 렌더링한다', () => {
    const options: CartSelectedOption[] = [
      {
        id: 'opt-1',
        groupName: '사이즈',
        itemId: 'opt-item-2',
        itemName: '2인분',
        price: 5000,
      },
    ];

    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={1}
        totalPrice={23000}
        options={options}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/사이즈: 2인분/)).toBeInTheDocument();
    expect(screen.getByText(/\(5,000원\)/)).toBeInTheDocument();
  });

  it('여러 옵션을 렌더링한다', () => {
    const options: CartSelectedOption[] = [
      {
        id: 'opt-1',
        groupName: '사이즈',
        itemId: 'opt-item-2',
        itemName: 'L (Large)',
        price: 5000,
      },
      {
        id: 'opt-2',
        groupName: '추가 토핑',
        itemId: 'opt-item-3',
        itemName: '치즈 추가',
        price: 2000,
      },
    ];

    render(
      <CartItemCard
        menuName="페퍼로니 피자"
        quantity={1}
        totalPrice={27000}
        options={options}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/사이즈: L \(Large\)/)).toBeInTheDocument();
    expect(screen.getByText(/추가 토핑: 치즈 추가/)).toBeInTheDocument();
  });

  it('가격이 0인 옵션은 가격을 표시하지 않는다', () => {
    const options: CartSelectedOption[] = [
      {
        id: 'opt-1',
        groupName: '사이즈',
        itemId: 'opt-item-1',
        itemName: '1인분',
        price: 0,
      },
    ];

    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={1}
        totalPrice={18000}
        options={options}
        {...mockHandlers}
      />
    );

    const optionText = screen.getByText(/사이즈: 1인분/);
    expect(optionText.textContent).not.toContain('원');
  });

  it('수량 증가 버튼을 클릭하면 onIncrease가 호출된다', async () => {
    const user = userEvent.setup();

    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={1}
        totalPrice={18000}
        {...mockHandlers}
      />
    );

    const increaseButton = screen.getByLabelText('수량 증가');
    await user.click(increaseButton);

    expect(mockHandlers.onIncrease).toHaveBeenCalledTimes(1);
  });

  it('수량 감소 버튼을 클릭하면 onDecrease가 호출된다', async () => {
    const user = userEvent.setup();

    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={2}
        totalPrice={36000}
        {...mockHandlers}
      />
    );

    const decreaseButton = screen.getByLabelText('수량 감소');
    await user.click(decreaseButton);

    expect(mockHandlers.onDecrease).toHaveBeenCalledTimes(1);
  });

  it('삭제 버튼을 클릭하면 onRemove가 호출된다', async () => {
    const user = userEvent.setup();

    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={1}
        totalPrice={18000}
        {...mockHandlers}
      />
    );

    const removeButton = screen.getByLabelText('삭제');
    await user.click(removeButton);

    expect(mockHandlers.onRemove).toHaveBeenCalledTimes(1);
  });

  it('모든 버튼이 독립적으로 동작한다', async () => {
    const user = userEvent.setup();

    render(
      <CartItemCard
        menuName="후라이드 치킨"
        quantity={2}
        totalPrice={36000}
        {...mockHandlers}
      />
    );

    await user.click(screen.getByLabelText('수량 증가'));
    expect(mockHandlers.onIncrease).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onDecrease).not.toHaveBeenCalled();
    expect(mockHandlers.onRemove).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText('수량 감소'));
    expect(mockHandlers.onDecrease).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onRemove).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText('삭제'));
    expect(mockHandlers.onRemove).toHaveBeenCalledTimes(1);
  });
});
