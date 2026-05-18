export interface BrandStore {
    id: number;
    name: string;
    address: string;
    phone: string;
    hours: string;
    status: 'open' | 'closed' | 'preparing';
    lat: number;
    lng: number;
}

export const STORES: BrandStore[] = [
    {
        id: 1,
        name: '타코몰리 본점',
        address: '경기 김포시 김포한강11로140번길 15-2 1층',
        phone: '0507-1410-8774',
        hours: '평일 16:00 - 24:00 / 주말 12:00 - 24:00',
        status: 'open',
        lat: 37.64690,
        lng: 126.68138,
    },
    {
        id: 2,
        name: '타코몰리 부천점',
        address: '경기 부천시 소사구 양지로176번길 8-8',
        phone: '032-341-0201',
        hours: '월~목 16:00 - 24:00 / 금~일 12:00 - 24:00',
        status: 'open',
        lat: 37.46887,
        lng: 126.82083,
    },
    {
        id: 3,
        name: '타코몰리 부평점',
        address: '인천 부평구 장제로249번길 9 1층',
        phone: '0507-1444-7333',
        hours: '평일 16:00 - 24:00 / 주말 12:00 - 24:00',
        status: 'open',
        lat: 37.50777,
        lng: 126.73080,
    },
    {
        id: 4,
        name: '타코몰리 검단풍무점',
        address: '경기 김포시 풍무로 25 가동 119호',
        phone: '0507-1464-0653',
        hours: '12:00 - 22:00 (월 휴무)',
        status: 'open',
        lat: 37.59804,
        lng: 126.72020,
    },
    {
        id: 5,
        name: '타코몰리 만수구월점',
        address: '인천 남동구 하촌로60번길 3',
        phone: '0507-1396-1731',
        hours: '화~금 16:00 - 24:00 / 주말 14:00 - 24:00 (월 휴무)',
        status: 'open',
        lat: 37.45321,
        lng: 126.73365,
    },
    {
        id: 6,
        name: '타코몰리 루원시티점',
        address: '인천 서구 서곶로 45 근린생활시설동 B056호',
        phone: '0507-1397-8727',
        hours: '월~금 16:00 - 24:00 / 토 14:00 - 24:00 / 일 16:00 - 24:00',
        status: 'open',
        lat: 37.52172,
        lng: 126.67831,
    },
    {
        id: 7,
        name: '타코몰리 검단마전점',
        address: '인천 서구 완정로 46',
        phone: '0507-1465-3554',
        hours: '평일 16:00 - 24:00 / 주말 12:00 - 24:00',
        status: 'open',
        lat: 37.59646,
        lng: 126.66975,
    },
];
