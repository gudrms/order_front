/**
 * Daum 우편번호 서비스 연동
 * https://postcode.map.daum.net/guide
 */

export interface DaumAddress {
    address: string; // 기본 주소
    addressEnglish: string; // 영문 주소
    addressType: 'R' | 'J'; // R: 도로명, J: 지번
    apartment: 'Y' | 'N'; // 아파트 여부
    autoJibunAddress: string; // 지번 주소
    autoJibunAddressEnglish: string;
    autoRoadAddress: string; // 도로명 주소
    autoRoadAddressEnglish: string;
    bcode: string; // 법정동/법정리 코드
    bname: string; // 법정동/법정리 이름
    bname1: string; // 법정리 이름
    bname2: string; // 법정동 이름
    buildingCode: string; // 건물 관리 번호
    buildingName: string; // 건물명
    hname: string; // 행정동 이름
    jibunAddress: string; // 지번 주소
    jibunAddressEnglish: string;
    noSelected: 'Y' | 'N';
    postcode: string; // 우편번호
    postcode1: string;
    postcode2: string;
    postcodeSeq: string;
    roadAddress: string; // 도로명 주소
    roadAddressEnglish: string;
    roadname: string; // 도로명
    roadnameCode: string; // 도로명 코드
    sido: string; // 시도
    sigungu: string; // 시군구
    sigunguCode: string; // 시군구 코드
    userLanguageType: 'K' | 'E'; // 검색 언어 (K: 한글, E: 영문)
    userSelectedType: 'R' | 'J'; // 사용자가 선택한 주소 타입
    zonecode: string; // 우편번호 (5자리)
}


/**
 * Daum 우편번호 스크립트 로드
 */
export function loadDaumPostcodeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).daum && (window as any).daum.Postcode) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Daum Postcode script load failed'));
        document.head.appendChild(script);
    });
}

/**
 * 주소 검색 팝업 열기
 */
export async function openDaumPostcode(
    onComplete: (data: DaumAddress) => void,
    onClose?: () => void
): Promise<void> {
    await loadDaumPostcodeScript();

    new (window as any).daum.Postcode({
        oncomplete: function (data: DaumAddress) {
            onComplete(data);
        },
        onclose: function () {
            if (onClose) onClose();
        },
        theme: {
            bgColor: '#FFFFFF',
            searchBgColor: '#FFD700',
            contentBgColor: '#FFFFFF',
            pageBgColor: '#FFFFFF',
            textColor: '#000000',
            queryTextColor: '#000000',
            emphTextColor: '#000000',
        },
        animation: true,
        hideMapBtn: false,
        hideEngBtn: true,
    }).open();
}
