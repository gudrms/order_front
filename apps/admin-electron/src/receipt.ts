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
  request?: string;
  items: { name: string; quantity: number; totalPrice: number; options: string[] }[];
  deliveryFee?: number | null;
  total: number;
};

/** 80mm 용지 한 줄 글자 수 (영문 기준, 한글은 2칸). 대부분의 80mm 프린터 기본 글꼴에 맞는 값 */
const COLUMNS = 42;

const ESC = 0x1b;
const GS = 0x1d;
const FS = 0x1c;

const cmd = {
  init: [ESC, 0x40],
  // 한글(2바이트) 모드 켜기 — 한국형 프린터는 CP949 한글을 이 모드에서 찍는다
  koreanOn: [FS, 0x26],
  alignLeft: [ESC, 0x61, 0],
  alignCenter: [ESC, 0x61, 1],
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

/** 왼쪽 글과 오른쪽 글을 한 줄 양 끝에 둔다 */
function twoColumns(left: string, right: string, width = COLUMNS) {
  const space = width - displayWidth(left) - displayWidth(right);
  if (space >= 1) return [left + ' '.repeat(space) + right];
  // 왼쪽이 길면 왼쪽을 먼저 줄바꿈하고 오른쪽 글은 마지막 줄 끝에
  const leftLines = wrap(left, width - displayWidth(right) - 1);
  const last = leftLines.pop() ?? '';
  return [...leftLines, last + ' '.repeat(width - displayWidth(last) - displayWidth(right)) + right];
}

const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;
const divider = (char = '-') => char.repeat(COLUMNS);

/** 주문서 → ESC/POS 바이트 (한글은 CP949) */
export function buildEscPosReceipt(receipt: ReceiptData): Buffer {
  const parts: Buffer[] = [];
  const raw = (bytes: number[]) => parts.push(Buffer.from(bytes));
  const text = (value: string) => parts.push(iconv.encode(value, 'cp949'));
  const line = (value = '') => text(`${value}\n`);

  raw(cmd.init);
  raw(cmd.koreanOn);

  // 머리말
  raw(cmd.alignCenter);
  raw(cmd.sizeDouble);
  raw(cmd.boldOn);
  line(receipt.isDelivery ? '배달 주문서' : '주문서');
  line(`#${receipt.orderNumber}`);
  raw(cmd.sizeNormal);
  raw(cmd.boldOff);
  line(new Date(receipt.createdAt).toLocaleString('ko-KR'));
  if (receipt.tableNumber != null) {
    raw(cmd.sizeDouble);
    line(`테이블 ${receipt.tableNumber}번`);
    raw(cmd.sizeNormal);
  }
  if (receipt.estimatedMinutes) {
    raw(cmd.sizeTall);
    raw(cmd.boldOn);
    line(`예상 소요 ${receipt.estimatedMinutes}분`);
    raw(cmd.boldOff);
    raw(cmd.sizeNormal);
  }

  // 배달 정보
  raw(cmd.alignLeft);
  line(divider());
  if (receipt.isDelivery) {
    raw(cmd.boldOn);
    if (receipt.address) wrap(receipt.address).forEach((value) => line(value));
    raw(cmd.boldOff);
    if (receipt.phone) line(receipt.phone);
  }
  if (receipt.request) {
    raw(cmd.boldOn);
    wrap(`요청: ${receipt.request}`).forEach((value) => line(value));
    raw(cmd.boldOff);
  }
  if (receipt.isDelivery || receipt.request) line(divider());

  // 메뉴
  for (const item of receipt.items) {
    raw(cmd.boldOn);
    twoColumns(`${item.name} x${item.quantity}`, won(item.totalPrice)).forEach((value) => line(value));
    raw(cmd.boldOff);
    for (const option of item.options) {
      wrap(`  ㄴ ${option}`).forEach((value) => line(value));
    }
  }
  line(divider());

  // 합계
  if (receipt.deliveryFee != null && receipt.isDelivery) {
    twoColumns('배달비', won(receipt.deliveryFee)).forEach((value) => line(value));
  }
  raw(cmd.sizeTall);
  raw(cmd.boldOn);
  twoColumns('합계', won(receipt.total)).forEach((value) => line(value));
  raw(cmd.boldOff);
  raw(cmd.sizeNormal);

  raw(cmd.feed(4));
  raw(cmd.cut);
  return Buffer.concat(parts);
}

/** [테스트 인쇄]용 견본 주문서 */
export function sampleReceipt(): ReceiptData {
  return {
    orderNumber: 'TEST',
    createdAt: new Date().toISOString(),
    isDelivery: true,
    estimatedMinutes: 40,
    address: '테스트 인쇄입니다 - 이 종이가 나오면 주문서도 이 포트로 출력됩니다',
    phone: '010-0000-0000',
    request: '한글·금액·줄맞춤 확인',
    items: [
      { name: '오리지널 쇠고기 타코(2pcs)', quantity: 1, totalPrice: 12000, options: [] },
      { name: 'Jarritos 하리토스', quantity: 2, totalPrice: 8000, options: ['맛 선택: 망고'] },
    ],
    deliveryFee: 3000,
    total: 23000,
  };
}
