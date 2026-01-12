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
        address: '경기 김포시 김포한강11로140번길 15-2 1층 101호',
        phone: '031-987-6543',
        hours: '11:00 - 22:00',
        status: 'open',
        lat: 37.6446,
        lng: 126.6670,
    },
    {
        id: 2,
        name: '타코몰리 부천점',
        address: '경기 부천시 소사구 양지로176번길 8-8 1층',
        phone: '032-123-4567',
        hours: '11:00 - 22:00',
        status: 'open',
        lat: 37.4760,
        lng: 126.8020,
    },
    {
        id: 3,
        name: '타코몰리 부평점',
        address: '인천 부평구 장제로249번길 9 1층',
        phone: '032-555-7777',
        hours: '11:00 - 22:00',
        status: 'open',
        lat: 37.5070,
        lng: 126.7220,
    },
    {
        id: 4,
        name: '타코몰리 검단풍무점',
        address: '경기 김포시 풍무로 25 센트럴메디프라자 가동 119호',
        phone: '031-111-2222',
        hours: '11:00 - 22:00',
        status: 'open',
        lat: 37.6020,
        lng: 126.7250,
    },
    {
        id: 5,
        name: '타코몰리 만수구월점',
        address: '인천 남동구 하촌로60번길 3 덕원빌딩 1층',
        phone: '032-888-9999',
        hours: '11:00 - 22:00',
        status: 'open',
        lat: 37.4480,
        lng: 126.7350,
    },
    {
        id: 6,
        name: '타코몰리 루원시티점',
        address: '인천 서구 서곶로 45 린스트라우스 상가동 B056호',
        phone: '032-777-8888',
        hours: '11:00 - 22:00',
        status: 'open',
        lat: 37.5250,
        lng: 126.6750,
    },
    {
        id: 7,
        name: '타코몰리 검단마전점',
        address: '인천 서구 완정로 46 1층 1호',
        phone: '032-444-5555',
        hours: '11:00 - 22:00',
        status: 'open',
        lat: 37.5950,
        lng: 126.6700,
    },
];
