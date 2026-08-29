/**
 * 사업자 정보 (전자상거래법 제10조 · PG 카드사 심사 필수 표기 항목)
 *
 * 사업자등록증 / 통신판매업신고증과 100% 일치해야 한다.
 * 값이 빈 문자열인 항목은 화면 표기에서 자동 제외된다(COMPANY_INFO_ROWS).
 */
export const COMPANY = {
    /** 법인 정식 상호 */
    name: '주식회사 에스와이월드',
    /** 축약 상호 (토스 신청서 표기) */
    nameShort: '에스와이월드',
    ceo: '이윤수',
    /** 사업자등록번호 (세무서 발급, 10자리) */
    bizRegNo: '179-88-02490',
    /** 통신판매업신고번호 (관할 지자체 발급). 확보 후 입력, 빈 값이면 숨김. */
    mailOrderNo: '',
    /** 사업장 주소 (사업자등록증 기재, 층·호수 포함) */
    address: '인천광역시 서구 보듬로 158, 2층 202호 (오류동, 블루빌)',
    /** 유선번호 (070 / 0505 / 전국대표번호 / 080 / 휴대폰 가능). 빈 값이면 숨김. */
    tel: '010-4593-0731',
    /** 고객센터 (가맹·주문 문의) */
    csTel: '010-4593-0731',
    email: 'tacomole26@gmail.com',
} as const;

/** 홈페이지 하단 표기용 [라벨, 값] 목록. 값이 빈 항목은 제외된다. */
export const COMPANY_INFO_ROWS: readonly (readonly [string, string])[] = (
    [
        ['상호', COMPANY.name],
        ['대표자', COMPANY.ceo],
        ['사업자등록번호', COMPANY.bizRegNo],
        ['통신판매업신고번호', COMPANY.mailOrderNo],
        ['주소', COMPANY.address],
        ['유선번호', COMPANY.tel],
        ['이메일', COMPANY.email],
    ] as const
).filter(([, value]) => value !== '');

/**
 * 배달 소요기간 / 최대 서비스제공기간 안내 문구.
 * 전자상거래법상 구매자가 결제 전 배송기간을 인지할 수 있도록 상품·결제 페이지에 노출한다.
 * 매장별 예상 시간은 store.estimatedDeliveryMinutes 를 우선 사용한다.
 */
export const DELIVERY_TIME_NOTICE =
    '결제 완료 후 매장에서 즉시 조리를 시작하며, 조리 완료 후 순차 배달됩니다. 상품은 모두 주문 당일 수령하며, 매장 상황·주문량·배달 거리에 따라 소요 시간이 달라질 수 있습니다.';
