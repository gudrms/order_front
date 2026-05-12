import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '타코몰리 배달앱 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
        <p className="text-gray-500 text-sm mb-10">시행일: 2026년 5월 12일</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. 수집하는 개인정보 항목</h2>
          <p className="text-gray-700 leading-relaxed">
            타코몰리(이하 &quot;회사&quot;)는 배달앱 서비스 제공을 위해 아래와 같은 정보를 수집합니다.
          </p>
          <ul className="list-disc list-inside mt-3 text-gray-700 space-y-1">
            <li>위치 정보: 배달 주소 확인 및 근처 매장 안내</li>
            <li>기기 정보: 기기 식별자(FCM 토큰), OS 버전</li>
            <li>주문 정보: 주문 내역, 결제 정보(카드사 처리, 회사는 카드번호 미보관)</li>
            <li>연락처: 배달 관련 알림 발송용 전화번호</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>주문 접수 및 배달 서비스 제공</li>
            <li>주문 현황 및 배달 상태 푸시 알림 발송</li>
            <li>고객 문의 처리 및 서비스 개선</li>
            <li>법령 의무 이행</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. 개인정보의 보유 및 이용 기간</h2>
          <p className="text-gray-700 leading-relaxed">
            회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 따라 아래 정보는 일정 기간 보관합니다.
          </p>
          <ul className="list-disc list-inside mt-3 text-gray-700 space-y-1">
            <li>계약 또는 청약 철회 기록: 5년 (전자상거래법)</li>
            <li>결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
          <p className="text-gray-700 leading-relaxed">
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            단, 배달 서비스 수행을 위해 배달 기사에게 배달 주소 및 연락처가 제공될 수 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. 개인정보 처리 위탁</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>토스페이먼츠: 결제 처리</li>
            <li>Google Firebase: 푸시 알림 발송</li>
            <li>Supabase: 데이터베이스 및 인증</li>
          </ul>
        </section>

        <section className="mb-8" id="delete">
          <h2 className="text-xl font-semibold mb-3">6. 이용자의 권리 및 계정 삭제</h2>
          <p className="text-gray-700 leading-relaxed">
            이용자는 언제든지 자신의 개인정보 조회, 수정, 삭제, 처리 정지를 요청할 수 있습니다.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            계정 및 관련 데이터 삭제를 요청하시려면 아래 이메일로 문의해 주세요.
            요청 접수 후 7영업일 이내에 처리됩니다.
          </p>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 font-medium">계정 삭제 요청</p>
            <p className="text-gray-600 text-sm mt-1">이메일: tacomole26@gmail.com</p>
            <p className="text-gray-600 text-sm">제목: [계정 삭제 요청] 가입 이메일 주소</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. 개인정보 보호책임자</h2>
          <div className="text-gray-700 space-y-1">
            <p>담당자: 타코몰리 운영팀</p>
            <p>이메일: tacomole26@gmail.com</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. 개인정보처리방침 변경</h2>
          <p className="text-gray-700 leading-relaxed">
            본 방침은 법령 또는 서비스 변경에 따라 업데이트될 수 있으며,
            변경 시 앱 공지 또는 본 페이지를 통해 안내합니다.
          </p>
        </section>
      </div>
    </main>
  );
}
