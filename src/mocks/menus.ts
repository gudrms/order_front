import type { Menu, MenuDetail, MenuOption } from '@/types';

/**
 * Mock 메뉴 옵션
 */
const chickenSizeOption: MenuOption = {
  id: 1,
  name: '사이즈',
  type: 'SINGLE',
  required: true,
  items: [
    { id: 1, name: '1인분', price: 0 },
    { id: 2, name: '2인분', price: 5000 },
    { id: 3, name: '3인분', price: 10000 },
  ],
};

const pizzaSizeOption: MenuOption = {
  id: 2,
  name: '사이즈',
  type: 'SINGLE',
  required: true,
  items: [
    { id: 4, name: 'R (Regular)', price: 0 },
    { id: 5, name: 'L (Large)', price: 5000 },
  ],
};

const toppingOption: MenuOption = {
  id: 3,
  name: '추가 토핑',
  type: 'MULTIPLE',
  required: false,
  items: [
    { id: 6, name: '치즈 추가', price: 2000 },
    { id: 7, name: '페퍼로니 추가', price: 3000 },
    { id: 8, name: '올리브 추가', price: 1500 },
  ],
};

const pastaSideOption: MenuOption = {
  id: 4,
  name: '사이드',
  type: 'SINGLE',
  required: false,
  items: [
    { id: 9, name: '없음', price: 0 },
    { id: 10, name: '마늘빵', price: 3000 },
    { id: 11, name: '샐러드', price: 4000 },
  ],
};

/**
 * Mock 메뉴 데이터
 */
export const mockMenus: Menu[] = [
  // 치킨 (카테고리 1)
  {
    id: 1,
    name: '후라이드 치킨',
    price: 18000,
    description: '바삭바삭한 클래식 후라이드 치킨',
    imageUrl: null,
    categoryId: 1,
    categoryName: '치킨',
    soldOut: false,
    displayOrder: 1,
  },
  {
    id: 2,
    name: '양념 치킨',
    price: 19000,
    description: '달콤매콤한 양념 치킨',
    imageUrl: null,
    categoryId: 1,
    categoryName: '치킨',
    soldOut: false,
    displayOrder: 2,
  },
  {
    id: 3,
    name: '간장 치킨',
    price: 19000,
    description: '고소한 간장 소스 치킨',
    imageUrl: null,
    categoryId: 1,
    categoryName: '치킨',
    soldOut: false,
    displayOrder: 3,
  },
  {
    id: 4,
    name: '반반 치킨',
    price: 20000,
    description: '후라이드와 양념을 반씩',
    imageUrl: null,
    categoryId: 1,
    categoryName: '치킨',
    soldOut: false,
    displayOrder: 4,
  },
  {
    id: 5,
    name: '허니 치킨',
    price: 20000,
    description: '달콤한 허니 소스 치킨',
    imageUrl: null,
    categoryId: 1,
    categoryName: '치킨',
    soldOut: true,
    displayOrder: 5,
  },

  // 피자 (카테고리 2)
  {
    id: 6,
    name: '마르게리타',
    price: 15000,
    description: '클래식 토마토 & 모짜렐라',
    imageUrl: null,
    categoryId: 2,
    categoryName: '피자',
    soldOut: false,
    displayOrder: 1,
  },
  {
    id: 7,
    name: '페퍼로니 피자',
    price: 17000,
    description: '페퍼로니가 가득한 피자',
    imageUrl: null,
    categoryId: 2,
    categoryName: '피자',
    soldOut: false,
    displayOrder: 2,
  },
  {
    id: 8,
    name: '불고기 피자',
    price: 18000,
    description: '한국식 불고기 토핑',
    imageUrl: null,
    categoryId: 2,
    categoryName: '피자',
    soldOut: false,
    displayOrder: 3,
  },
  {
    id: 9,
    name: '콤비네이션 피자',
    price: 19000,
    description: '다양한 토핑이 어우러진 피자',
    imageUrl: null,
    categoryId: 2,
    categoryName: '피자',
    soldOut: false,
    displayOrder: 4,
  },
  {
    id: 10,
    name: '포테이토 피자',
    price: 17000,
    description: '감자와 베이컨 토핑',
    imageUrl: null,
    categoryId: 2,
    categoryName: '피자',
    soldOut: false,
    displayOrder: 5,
  },

  // 파스타 (카테고리 3)
  {
    id: 11,
    name: '까르보나라',
    price: 12000,
    description: '크림 베이스 베이컨 파스타',
    imageUrl: null,
    categoryId: 3,
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 1,
  },
  {
    id: 12,
    name: '알리오 올리오',
    price: 11000,
    description: '마늘과 올리브유 파스타',
    imageUrl: null,
    categoryId: 3,
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 2,
  },
  {
    id: 13,
    name: '토마토 파스타',
    price: 11000,
    description: '신선한 토마토 소스',
    imageUrl: null,
    categoryId: 3,
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 3,
  },
  {
    id: 14,
    name: '로제 파스타',
    price: 13000,
    description: '크림과 토마토의 조화',
    imageUrl: null,
    categoryId: 3,
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 4,
  },
  {
    id: 15,
    name: '해산물 파스타',
    price: 15000,
    description: '신선한 해산물 토핑',
    imageUrl: null,
    categoryId: 3,
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 5,
  },

  // 음료 (카테고리 4)
  {
    id: 16,
    name: '콜라',
    price: 2000,
    description: '시원한 코카콜라',
    imageUrl: null,
    categoryId: 4,
    categoryName: '음료',
    soldOut: false,
    displayOrder: 1,
  },
  {
    id: 17,
    name: '사이다',
    price: 2000,
    description: '청량한 사이다',
    imageUrl: null,
    categoryId: 4,
    categoryName: '음료',
    soldOut: false,
    displayOrder: 2,
  },
  {
    id: 18,
    name: '오렌지 주스',
    price: 3000,
    description: '100% 오렌지 주스',
    imageUrl: null,
    categoryId: 4,
    categoryName: '음료',
    soldOut: false,
    displayOrder: 3,
  },
  {
    id: 19,
    name: '아메리카노',
    price: 3500,
    description: '진한 아메리카노',
    imageUrl: null,
    categoryId: 4,
    categoryName: '음료',
    soldOut: false,
    displayOrder: 4,
  },
  {
    id: 20,
    name: '생맥주',
    price: 4500,
    description: '시원한 생맥주',
    imageUrl: null,
    categoryId: 4,
    categoryName: '음료',
    soldOut: false,
    displayOrder: 5,
  },

  // 디저트 (카테고리 5)
  {
    id: 21,
    name: '티라미수',
    price: 6000,
    description: '이탈리안 정통 티라미수',
    imageUrl: null,
    categoryId: 5,
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 1,
  },
  {
    id: 22,
    name: '치즈케이크',
    price: 6500,
    description: '부드러운 뉴욕 치즈케이크',
    imageUrl: null,
    categoryId: 5,
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 2,
  },
  {
    id: 23,
    name: '초코 브라우니',
    price: 5000,
    description: '진한 초콜릿 브라우니',
    imageUrl: null,
    categoryId: 5,
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 3,
  },
  {
    id: 24,
    name: '아이스크림',
    price: 4000,
    description: '바닐라 & 초콜릿',
    imageUrl: null,
    categoryId: 5,
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 4,
  },
  {
    id: 25,
    name: '과일 샐러드',
    price: 5500,
    description: '신선한 계절 과일',
    imageUrl: null,
    categoryId: 5,
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 5,
  },
];

/**
 * Mock 메뉴 상세 데이터 (옵션 포함)
 */
export const mockMenuDetails: Record<number, MenuDetail> = {
  // 치킨 - 옵션 있음
  1: {
    ...mockMenus[0],
    options: [chickenSizeOption],
  },
  2: {
    ...mockMenus[1],
    options: [chickenSizeOption],
  },
  3: {
    ...mockMenus[2],
    options: [chickenSizeOption],
  },
  4: {
    ...mockMenus[3],
    options: [chickenSizeOption],
  },
  5: {
    ...mockMenus[4],
    options: [chickenSizeOption],
  },

  // 피자 - 옵션 있음
  6: {
    ...mockMenus[5],
    options: [pizzaSizeOption, toppingOption],
  },
  7: {
    ...mockMenus[6],
    options: [pizzaSizeOption, toppingOption],
  },
  8: {
    ...mockMenus[7],
    options: [pizzaSizeOption, toppingOption],
  },
  9: {
    ...mockMenus[8],
    options: [pizzaSizeOption, toppingOption],
  },
  10: {
    ...mockMenus[9],
    options: [pizzaSizeOption, toppingOption],
  },

  // 파스타 - 옵션 있음
  11: {
    ...mockMenus[10],
    options: [pastaSideOption],
  },
  12: {
    ...mockMenus[11],
    options: [pastaSideOption],
  },
  13: {
    ...mockMenus[12],
    options: [pastaSideOption],
  },
  14: {
    ...mockMenus[13],
    options: [pastaSideOption],
  },
  15: {
    ...mockMenus[14],
    options: [pastaSideOption],
  },

  // 음료 - 옵션 없음
  16: {
    ...mockMenus[15],
    options: [],
  },
  17: {
    ...mockMenus[16],
    options: [],
  },
  18: {
    ...mockMenus[17],
    options: [],
  },
  19: {
    ...mockMenus[18],
    options: [],
  },
  20: {
    ...mockMenus[19],
    options: [],
  },

  // 디저트 - 옵션 없음
  21: {
    ...mockMenus[20],
    options: [],
  },
  22: {
    ...mockMenus[21],
    options: [],
  },
  23: {
    ...mockMenus[22],
    options: [],
  },
  24: {
    ...mockMenus[23],
    options: [],
  },
  25: {
    ...mockMenus[24],
    options: [],
  },
};
