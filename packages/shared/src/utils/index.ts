/**
 * 유틸리티 함수 통합 export
 */

export * from './format';
export * from './validation';
export * from './daum-postcode';
export * from './id';
// toss-payments 는 @tosspayments/payment-sdk 를 임포트 시점에 로드해 SSR에서
// "ReferenceError: location is not defined" 가 발생하므로 배럴에서 제외.
// 직접 import 해서 사용: import { ... } from '@order/shared/utils/toss-payments'
