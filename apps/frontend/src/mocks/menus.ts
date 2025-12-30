import type { Menu, MenuDetail, MenuOption } from '@/types';

/**
 * Mock 메뉴 옵션
 * UUID 형식: opt-{number}-{name}
 */
const chickenSizeOption: MenuOption = {
  id: 'opt-1-chicken-size',
  name: '사이즈',
  type: 'SINGLE',
  required: true,
  options: [
    { id: 'opt-item-1-1p', name: '1인분', price: 0 },
    { id: 'opt-item-2-2p', name: '2인분', price: 5000 },
    { id: 'opt-item-3-3p', name: '3인분', price: 10000 },
  ],
};

const pizzaSizeOption: MenuOption = {
  id: 'opt-2-pizza-size',
  name: '사이즈',
  type: 'SINGLE',
  required: true,
  options: [
    { id: 'opt-item-4-regular', name: 'R (Regular)', price: 0 },
    { id: 'opt-item-5-large', name: 'L (Large)', price: 5000 },
  ],
};

const toppingOption: MenuOption = {
  id: 'opt-3-topping',
  name: '추가 토핑',
  type: 'MULTIPLE',
  required: false,
  options: [
    { id: 'opt-item-6-cheese', name: '치즈 추가', price: 2000 },
    { id: 'opt-item-7-pepperoni', name: '페퍼로니 추가', price: 3000 },
    { id: 'opt-item-8-olive', name: '올리브 추가', price: 1500 },
  ],
};

const pastaSideOption: MenuOption = {
  id: 'opt-4-pasta-side',
  name: '사이드',
  type: 'SINGLE',
  required: false,
  options: [
    { id: 'opt-item-9-none', name: '없음', price: 0 },
    { id: 'opt-item-10-garlic', name: '마늘빵', price: 3000 },
    { id: 'opt-item-11-salad', name: '샐러드', price: 4000 },
  ],
};

const staffCallOption: MenuOption = {
  id: 'opt-5-staff-call',
  name: '직원 호출 사유',
  type: 'MULTIPLE',
  required: false,
  options: [
    { id: 'opt-item-12-water', name: '물 주세요', price: 0 },
    { id: 'opt-item-13-tissue', name: '휴지 주세요', price: 0 },
    { id: 'opt-item-14-cutlery', name: '수저/포크 주세요', price: 0 },
    { id: 'opt-item-15-sauce', name: '소스 주세요', price: 0 },
    { id: 'opt-item-16-other', name: '기타 요청사항', price: 0 },
  ],
};

/**
 * Mock 메뉴 데이터
 * UUID 형식: menu-{category}-{number}-{name}
 */
export const mockMenus: Menu[] = [
  // 치킨 (카테고리 cat-1-chicken) - 옵션 있음
  {
    id: 'menu-chicken-1-fried',
    name: '후라이드 치킨',
    price: 18000,
    description: '바삭바삭한 클래식 후라이드 치킨',
    imageUrl: null,
    categoryId: 'cat-1-chicken',
    categoryName: '치킨',
    soldOut: false,
    displayOrder: 1,
    optionGroups: [chickenSizeOption],
  },
  {
    id: 'menu-chicken-2-sauce',
    name: '양념 치킨',
    price: 19000,
    description: '달콤매콤한 양념 치킨',
    imageUrl: null,
    categoryId: 'cat-1-chicken',
    categoryName: '치킨',
    soldOut: false,
    displayOrder: 2,
    optionGroups: [chickenSizeOption],
  },
  {
    id: 'menu-chicken-3-soy',
    name: '간장 치킨',
    price: 19000,
    description: '고소한 간장 소스 치킨',
    imageUrl: null,
    categoryId: 'cat-1-chicken',
    categoryName: '치킨',
    soldOut: false,
    displayOrder: 3,
    optionGroups: [chickenSizeOption],
  },
  {
    id: 'menu-chicken-4-half',
    name: '반반 치킨',
    price: 20000,
    description: '후라이드와 양념을 반씩',
    imageUrl: null,
    categoryId: 'cat-1-chicken',
    categoryName: '치킨',
    soldOut: false,
    displayOrder: 4,
    optionGroups: [chickenSizeOption],
  },
  {
    id: 'menu-chicken-5-honey',
    name: '허니 치킨',
    price: 20000,
    description: '달콤한 허니 소스 치킨',
    imageUrl: null,
    categoryId: 'cat-1-chicken',
    categoryName: '치킨',
    soldOut: true,
    displayOrder: 5,
    optionGroups: [chickenSizeOption],
  },

  // 피자 (카테고리 cat-2-pizza) - 옵션 있음
  {
    id: 'menu-pizza-1-margherita',
    name: '마르게리타',
    price: 15000,
    description: '클래식 토마토 & 모짜렐라',
    imageUrl: null,
    categoryId: 'cat-2-pizza',
    categoryName: '피자',
    soldOut: false,
    displayOrder: 1,
    optionGroups: [pizzaSizeOption, toppingOption],
  },
  {
    id: 'menu-pizza-2-pepperoni',
    name: '페퍼로니 피자',
    price: 17000,
    description: '페퍼로니가 가득한 피자',
    imageUrl: null,
    categoryId: 'cat-2-pizza',
    categoryName: '피자',
    soldOut: false,
    displayOrder: 2,
    optionGroups: [pizzaSizeOption, toppingOption],
  },
  {
    id: 'menu-pizza-3-bulgogi',
    name: '불고기 피자',
    price: 18000,
    description: '한국식 불고기 토핑',
    imageUrl: null,
    categoryId: 'cat-2-pizza',
    categoryName: '피자',
    soldOut: false,
    displayOrder: 3,
    optionGroups: [pizzaSizeOption, toppingOption],
  },
  {
    id: 'menu-pizza-4-combination',
    name: '콤비네이션 피자',
    price: 19000,
    description: '다양한 토핑이 어우러진 피자',
    imageUrl: null,
    categoryId: 'cat-2-pizza',
    categoryName: '피자',
    soldOut: false,
    displayOrder: 4,
    optionGroups: [pizzaSizeOption, toppingOption],
  },
  {
    id: 'menu-pizza-5-potato',
    name: '포테이토 피자',
    price: 17000,
    description: '감자와 베이컨 토핑',
    imageUrl: null,
    categoryId: 'cat-2-pizza',
    categoryName: '피자',
    soldOut: false,
    displayOrder: 5,
    optionGroups: [pizzaSizeOption, toppingOption],
  },

  // 파스타 (카테고리 cat-3-pasta) - 옵션 있음
  {
    id: 'menu-pasta-1-carbonara',
    name: '까르보나라',
    price: 12000,
    description: '크림 베이스 베이컨 파스타',
    imageUrl: null,
    categoryId: 'cat-3-pasta',
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 1,
    optionGroups: [pastaSideOption],
  },
  {
    id: 'menu-pasta-2-aglio',
    name: '알리오 올리오',
    price: 11000,
    description: '마늘과 올리브유 파스타',
    imageUrl: null,
    categoryId: 'cat-3-pasta',
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 2,
    optionGroups: [pastaSideOption],
  },
  {
    id: 'menu-pasta-3-tomato',
    name: '토마토 파스타',
    price: 11000,
    description: '신선한 토마토 소스',
    imageUrl: null,
    categoryId: 'cat-3-pasta',
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 3,
    optionGroups: [pastaSideOption],
  },
  {
    id: 'menu-pasta-4-rose',
    name: '로제 파스타',
    price: 13000,
    description: '크림과 토마토의 조화',
    imageUrl: null,
    categoryId: 'cat-3-pasta',
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 4,
    optionGroups: [pastaSideOption],
  },
  {
    id: 'menu-pasta-5-seafood',
    name: '해산물 파스타',
    price: 15000,
    description: '신선한 해산물 토핑',
    imageUrl: null,
    categoryId: 'cat-3-pasta',
    categoryName: '파스타',
    soldOut: false,
    displayOrder: 5,
    optionGroups: [pastaSideOption],
  },

  // 음료 (카테고리 cat-4-drink) - 옵션 없음
  {
    id: 'menu-drink-1-cola',
    name: '콜라',
    price: 2000,
    description: '시원한 코카콜라',
    imageUrl: null,
    categoryId: 'cat-4-drink',
    categoryName: '음료',
    soldOut: false,
    displayOrder: 1,
    optionGroups: [], // 옵션 없음
  },
  {
    id: 'menu-drink-2-sprite',
    name: '사이다',
    price: 2000,
    description: '톡 쏘는 사이다',
    imageUrl: null,
    categoryId: 'cat-4-drink',
    categoryName: '음료',
    soldOut: false,
    displayOrder: 2,
    optionGroups: [], // 옵션 없음
  },
  {
    id: 'menu-drink-3-orange',
    name: '오렌지 주스',
    price: 3000,
    description: '100% 오렌지 주스',
    imageUrl: null,
    categoryId: 'cat-4-drink',
    categoryName: '음료',
    soldOut: false,
    displayOrder: 3,
    optionGroups: [], // 옵션 없음
  },
  {
    id: 'menu-drink-4-americano',
    name: '아메리카노',
    price: 3500,
    description: '진한 아메리카노',
    imageUrl: null,
    categoryId: 'cat-4-drink',
    categoryName: '음료',
    soldOut: false,
    displayOrder: 4,
    optionGroups: [], // 옵션 없음
  },
  {
    id: 'menu-drink-5-beer',
    name: '생맥주',
    price: 4500,
    description: '시원한 생맥주',
    imageUrl: null,
    categoryId: 'cat-4-drink',
    categoryName: '음료',
    soldOut: false,
    displayOrder: 5,
    optionGroups: [], // 옵션 없음
  },

  // 직원 호출 (특수 카테고리) - 옵션 있음
  {
    id: 'menu-staff-call',
    name: '직원 호출',
    price: 0,
    description: '필요한 항목을 선택하시면 직원이 가져다 드립니다',
    imageUrl: null,
    categoryId: 'cat-special-staff',
    categoryName: '직원 호출',
    soldOut: false,
    displayOrder: 0,
    optionGroups: [staffCallOption],
  },

  // 디저트(카테고리 cat-5-dessert) - 옵션 없음
  {
    id: 'menu-dessert-1-tiramisu',
    name: '티라미수',
    price: 6000,
    description: '이탈리안 전통 티라미수',
    imageUrl: null,
    categoryId: 'cat-5-dessert',
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 1,
    optionGroups: [], // 옵션 없음
  },
  {
    id: 'menu-dessert-2-cheesecake',
    name: '치즈케이크',
    price: 6500,
    description: '부드러운 뉴욕 치즈케이크',
    imageUrl: null,
    categoryId: 'cat-5-dessert',
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 2,
    optionGroups: [], // 옵션 없음
  },
  {
    id: 'menu-dessert-3-brownie',
    name: '초코 브라우니',
    price: 5000,
    description: '진한 초콜릿 브라우니',
    imageUrl: null,
    categoryId: 'cat-5-dessert',
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 3,
    optionGroups: [], // 옵션 없음
  },
  {
    id: 'menu-dessert-4-icecream',
    name: '아이스크림',
    price: 4000,
    description: '바닐라 & 초콜릿',
    imageUrl: null,
    categoryId: 'cat-5-dessert',
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 4,
    optionGroups: [], // 옵션 없음
  },
  {
    id: 'menu-dessert-5-fruit',
    name: '과일 샐러드',
    price: 5500,
    description: '신선한 계절 과일',
    imageUrl: null,
    categoryId: 'cat-5-dessert',
    categoryName: '디저트',
    soldOut: false,
    displayOrder: 5,
    optionGroups: [], // 옵션 없음
  },
];

/**
 * Mock 메뉴 상세 데이터(옵션 포함)
 * UUID로 색인 사용
 */
export const mockMenuDetails: Record<string, MenuDetail> = {
  // 치킨 - 옵션 있음
  'menu-chicken-1-fried': {
    ...mockMenus[0],
    optionGroups: [chickenSizeOption],
  },
  'menu-chicken-2-sauce': {
    ...mockMenus[1],
    optionGroups: [chickenSizeOption],
  },
  'menu-chicken-3-soy': {
    ...mockMenus[2],
    optionGroups: [chickenSizeOption],
  },
  'menu-chicken-4-half': {
    ...mockMenus[3],
    optionGroups: [chickenSizeOption],
  },
  'menu-chicken-5-honey': {
    ...mockMenus[4],
    optionGroups: [chickenSizeOption],
  },

  // 피자 - 옵션 있음
  'menu-pizza-1-margherita': {
    ...mockMenus[5],
    optionGroups: [pizzaSizeOption, toppingOption],
  },
  'menu-pizza-2-pepperoni': {
    ...mockMenus[6],
    optionGroups: [pizzaSizeOption, toppingOption],
  },
  'menu-pizza-3-bulgogi': {
    ...mockMenus[7],
    optionGroups: [pizzaSizeOption, toppingOption],
  },
  'menu-pizza-4-combination': {
    ...mockMenus[8],
    optionGroups: [pizzaSizeOption, toppingOption],
  },
  'menu-pizza-5-potato': {
    ...mockMenus[9],
    optionGroups: [pizzaSizeOption, toppingOption],
  },

  // 파스타 - 옵션 있음
  'menu-pasta-1-carbonara': {
    ...mockMenus[10],
    optionGroups: [pastaSideOption],
  },
  'menu-pasta-2-aglio': {
    ...mockMenus[11],
    optionGroups: [pastaSideOption],
  },
  'menu-pasta-3-tomato': {
    ...mockMenus[12],
    optionGroups: [pastaSideOption],
  },
  'menu-pasta-4-rose': {
    ...mockMenus[13],
    optionGroups: [pastaSideOption],
  },
  'menu-pasta-5-seafood': {
    ...mockMenus[14],
    optionGroups: [pastaSideOption],
  },

  // 음료 - 옵션 없음
  'menu-drink-1-cola': {
    ...mockMenus[15],
    optionGroups: [],
  },
  'menu-drink-2-sprite': {
    ...mockMenus[16],
    optionGroups: [],
  },
  'menu-drink-3-orange': {
    ...mockMenus[17],
    optionGroups: [],
  },
  'menu-drink-4-americano': {
    ...mockMenus[18],
    optionGroups: [],
  },
  'menu-drink-5-beer': {
    ...mockMenus[19],
    optionGroups: [],
  },

  // 직원 호출 - 옵션 있음
  'menu-staff-call': {
    ...mockMenus[20],
    optionGroups: [staffCallOption],
  },

  // 디저트 - 옵션 없음
  'menu-dessert-1-tiramisu': {
    ...mockMenus[21],
    optionGroups: [],
  },
  'menu-dessert-2-cheesecake': {
    ...mockMenus[22],
    optionGroups: [],
  },
  'menu-dessert-3-brownie': {
    ...mockMenus[23],
    optionGroups: [],
  },
  'menu-dessert-4-icecream': {
    ...mockMenus[24],
    optionGroups: [],
  },
  'menu-dessert-5-fruit': {
    ...mockMenus[25],
    optionGroups: [],
  },
};
