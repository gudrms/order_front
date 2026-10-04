import iconv from 'iconv-lite';

/**
 * 관리자 웹이 출력할 때 넘겨주는 주문서 내용 (apps/admin/src/lib/receiptData.ts와 같은 모양).
 * COM 포트로 직접 출력할 때 이걸 영수증 프린터 명령(ESC/POS)으로 바꾼다.
 */
export type ReceiptData = {
  orderNumber: string;
  createdAt: string;
  /** 배달 주문이면 true */
  isDelivery: boolean;
  tableNumber?: number | null;
  estimatedMinutes?: number | null;
  address?: string;
  phone?: string;
  /**
   * 요청사항. 관리자 웹은 가게·배달 요청을 `가게) … / 배달) …` 한 줄로 이어서 보낸다.
   * storeRequest·deliveryRequest가 오면 그걸 우선 쓴다.
   */
  request?: string;
  storeRequest?: string;
  deliveryRequest?: string;
  /** 옵션은 `그룹: 이름 (+1,000원)` 형식 문자열 */
  items: { name: string; quantity: number; totalPrice: number; options: string[] }[];
  deliveryFee?: number | null;
  total: number;
};

/** 매장용(주방) / 고객용(배달기사가 들고 감) */
export type ReceiptCopy = 'store' | 'customer';

/** 80mm 용지 한 줄 글자 수 (영문 기준, 한글은 2칸). 대부분의 80mm 프린터 기본 글꼴에 맞는 값 */
const COLUMNS = 42;
/** 메뉴 줄의 수량·금액 칸 폭 */
const QTY_WIDTH = 4;
const PRICE_WIDTH = 9;

const ESC = 0x1b;
const GS = 0x1d;
const FS = 0x1c;

const cmd = {
  init: [ESC, 0x40],
  // 한글(2바이트) 모드 켜기 — 한국형 프린터는 CP949 한글을 이 모드에서 찍는다
  koreanOn: [FS, 0x26],
  alignLeft: [ESC, 0x61, 0],
  alignCenter: [ESC, 0x61, 1],
  alignRight: [ESC, 0x61, 2],
  boldOn: [ESC, 0x45, 1],
  boldOff: [ESC, 0x45, 0],
  sizeNormal: [GS, 0x21, 0x00],
  sizeDouble: [GS, 0x21, 0x11],
  sizeTall: [GS, 0x21, 0x01],
  feed: (lines: number) => [ESC, 0x64, lines],
  // 종이를 조금 밀고 부분 절단
  cut: [GS, 0x56, 66, 0],
};

/** 한글·전각 문자는 2칸, 나머지는 1칸으로 센다 */
function displayWidth(text: string) {
  let width = 0;
  for (const char of text) {
    width += /[ᄀ-ᇿ　-〿㄰-㆏가-힣＀-￯一-鿿]/.test(char) ? 2 : 1;
  }
  return width;
}

/** 한 줄 폭에 맞게 자른다 (주소·요청사항처럼 긴 글은 여러 줄로) */
function wrap(text: string, width = COLUMNS): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of text.replace(/\r?\n/g, ' ')) {
    if (displayWidth(current + char) > width) {
      lines.push(current);
      current = '';
    }
    current += char;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

const padLeft = (text: string, width: number) => ' '.repeat(Math.max(0, width - displayWidth(text))) + text;
const padRight = (text: string, width: number) => text + ' '.repeat(Math.max(0, width - displayWidth(text)));

/** 왼쪽 글과 오른쪽 글을 한 줄 양 끝에 둔다 (`width`는 이 줄을 찍는 글자 크기 기준 칸 수) */
function twoColumns(left: string, right: string, width = COLUMNS) {
  const space = width - displayWidth(left) - displayWidth(right);
  if (space >= 1) return [left + ' '.repeat(space) + right];
  // 왼쪽이 길면 왼쪽을 먼저 줄바꿈하고 오른쪽 글은 마지막 줄 끝에
  const leftLines = wrap(left, width - displayWidth(right) - 1);
  const last = leftLines.pop() ?? '';
  return [...leftLines, last + ' '.repeat(width - displayWidth(last) - displayWidth(right)) + right];
}

/** 메뉴 한 줄: 이름 | 수량 | 금액 (이름이 길면 이름만 줄바꿈) */
function menuRow(name: string, quantity: string, price: string) {
  const nameWidth = COLUMNS - QTY_WIDTH - PRICE_WIDTH;
  const nameLines = wrap(name, nameWidth - 1);
  const last = nameLines.pop() ?? '';
  return [...nameLines, padRight(last, nameWidth) + padLeft(quantity, QTY_WIDTH) + padLeft(price, PRICE_WIDTH)];
}

const money = (amount: number) => amount.toLocaleString('ko-KR');
const divider = (char = '-') => char.repeat(COLUMNS);

/** `가게) 수저 부탁 / 배달) 문 앞에` → 가게·배달 요청으로 나눈다 */
function splitRequests(receipt: ReceiptData) {
  if (receipt.storeRequest || receipt.deliveryRequest) {
    return { store: receipt.storeRequest, delivery: receipt.deliveryRequest, other: undefined };
  }
  let store: string | undefined;
  let delivery: string | undefined;
  const other: string[] = [];
  for (const part of (receipt.request ?? '').split(' / ').map((value) => value.trim()).filter(Boolean)) {
    if (part.startsWith('가게)')) store = part.slice(3).trim();
    else if (part.startsWith('배달)')) delivery = part.slice(3).trim();
    else other.push(part);
  }
  return { store, delivery, other: other.join(' / ') || undefined };
}

/** `맛 선택: 망고 (+1,000원)` → 이름과 추가 금액으로 나눈다 */
function splitOption(option: string) {
  const match = option.match(/^(.*?)\s*\(\+([\d,]+)원\)$/);
  return match ? { name: match[1], price: match[2] } : { name: option, price: '' };
}

/** 주문서 한 장 → ESC/POS 바이트 (한글은 CP949) */
function buildCopy(receipt: ReceiptData, copy: ReceiptCopy): Buffer {
  const parts: Buffer[] = [];
  const raw = (bytes: number[]) => parts.push(Buffer.from(bytes));
  const text = (value: string) => parts.push(iconv.encode(value, 'cp949'));
  const line = (value = '') => text(`${value}\n`);
  const requests = splitRequests(receipt);
  const itemsTotal = receipt.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

  raw(cmd.init);
  raw(cmd.koreanOn);

  // 머리말 — 배민 주문서처럼 [매장용]/[고객용]을 맨 위 오른쪽에
  raw(cmd.alignRight);
  line(copy === 'store' ? '[매장용]' : '[고객용]');
  raw(cmd.alignCenter);
  raw(cmd.boldOn);
  raw(cmd.sizeTall);
  line(receipt.isDelivery ? (copy === 'store' ? '배달 주문서' : '배달 주문전표') : '주문서');
  raw(cmd.sizeDouble);
  line(`주문번호 ${receipt.orderNumber}`);
  raw(cmd.sizeNormal);
  raw(cmd.boldOff);

  raw(cmd.alignLeft);
  raw(cmd.sizeTall);
  raw(cmd.boldOn);
  line('결제방식 결제완료');
  if (receipt.tableNumber != null) line(`테이블 ${receipt.tableNumber}번`);
  if (receipt.estimatedMinutes) line(`예상 소요 ${receipt.estimatedMinutes}분`);
  raw(cmd.boldOff);
  raw(cmd.sizeNormal);
  line(divider());

  // 배달주소·연락처 — 매장용(주방)·고객용(배달기사) 모두
  if (receipt.isDelivery) {
    line('배달주소:');
    raw(cmd.sizeTall);
    raw(cmd.boldOn);
    if (receipt.address) wrap(receipt.address).forEach((value) => line(value));
    raw(cmd.boldOff);
    raw(cmd.sizeNormal);
    if (receipt.phone) {
      line('연락처:');
      raw(cmd.sizeTall);
      raw(cmd.boldOn);
      line(receipt.phone);
      raw(cmd.boldOff);
      raw(cmd.sizeNormal);
    }
    line(divider());
  }

  // 요청사항 — 가게·배달 구분
  if (requests.store || requests.delivery || requests.other) {
    line('요청사항:');
    raw(cmd.sizeTall);
    raw(cmd.boldOn);
    if (requests.store) wrap(`가게 : ${requests.store}`).forEach((value) => line(value));
    if (requests.delivery) wrap(`배달 : ${requests.delivery}`).forEach((value) => line(value));
    if (requests.other) wrap(requests.other).forEach((value) => line(value));
    raw(cmd.boldOff);
    raw(cmd.sizeNormal);
    line(divider());
  }

  // 메뉴
  menuRow('메뉴', '수량', '금액').forEach((value) => line(value));
  line(divider());
  for (const item of receipt.items) {
    raw(cmd.sizeTall);
    raw(cmd.boldOn);
    menuRow(item.name, String(item.quantity), money(item.totalPrice)).forEach((value) => line(value));
    raw(cmd.boldOff);
    raw(cmd.sizeNormal);
    for (const option of item.options) {
      const { name, price } = splitOption(option);
      twoColumns(` ㄴ ${name}`, price).forEach((value) => line(value));
    }
  }
  line(divider());

  // 금액
  raw(cmd.sizeTall);
  raw(cmd.boldOn);
  menuRow('주문금액', String(itemCount), money(itemsTotal)).forEach((value) => line(value));
  if (receipt.isDelivery) twoColumns('배달팁', money(receipt.deliveryFee ?? 0)).forEach((value) => line(value));
  line(divider());
  twoColumns('총 결제금액', money(receipt.total)).forEach((value) => line(value));
  raw(cmd.boldOff);
  raw(cmd.sizeNormal);
  line(divider());

  // 꼬리말
  line(`주문번호: ${receipt.orderNumber}`);
  line(new Date(receipt.createdAt).toLocaleString('ko-KR'));

  raw(cmd.feed(4));
  raw(cmd.cut);
  return Buffer.concat(parts);
}

/**
 * 주문서 → ESC/POS 바이트.
 * 배달 주문은 매장용(주방) + 고객용(배달기사가 들고 감) 2장, 매장 주문은 매장용 1장.
 */
export function buildEscPosReceipt(receipt: ReceiptData, copies: ReceiptCopy[] = receipt.isDelivery ? ['store', 'customer'] : ['store']): Buffer {
  return Buffer.concat(copies.map((copy) => buildCopy(receipt, copy)));
}

/** [테스트 인쇄]용 견본 주문서 */
export function sampleReceipt(): ReceiptData {
  return {
    orderNumber: 'TEST',
    createdAt: new Date().toISOString(),
    isDelivery: true,
    estimatedMinutes: 40,
    address: '테스트 인쇄입니다 - 인천 서구 이음1로 349 (원당동) 301호',
    phone: '010-0000-0000',
    request: '가게) 수저 부탁드려요 / 배달) 문 앞에 두고 벨 눌러주세요',
    items: [
      { name: '바르바코아 포크 부리또', quantity: 1, totalPrice: 12000, options: ['볼 변경: bowl(고기,야채,밥 따로 제공) (+1,000원)'] },
      { name: 'Jarritos 하리토스', quantity: 2, totalPrice: 8000, options: ['맛 선택: 망고'] },
    ],
    deliveryFee: 3000,
    total: 24000,
  };
}
