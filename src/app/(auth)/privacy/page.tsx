/**
 * Privacy Policy Page
 * GDPR / 개인정보보호법 준수
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보 처리방침 - PetWatch',
  description: 'PetWatch 서비스의 개인정보 처리방침',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보 처리방침</h1>

        <p className="text-gray-600 mb-8">
          시행일: 2024년 1월 1일 | 최종 수정: 2024년 12월 1일
        </p>

        <div className="space-y-8 text-gray-700">
          {/* 1. 개인정보의 처리 목적 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 개인정보의 처리 목적</h2>
            <p className="mb-4">
              PetWatch(이하 &quot;회사&quot;)는 다음의 목적을 위하여 개인정보를 처리합니다.
              처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
              이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>회원 가입 및 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원 관리</li>
              <li><strong>서비스 제공:</strong> 반려동물 건강 관리 서비스, AI 분석, 건강 리포트 제공</li>
              <li><strong>결제 처리:</strong> 유료 서비스 이용 시 결제 및 환불 처리</li>
              <li><strong>고객 지원:</strong> 문의사항 처리, 서비스 관련 안내</li>
              <li><strong>서비스 개선:</strong> 서비스 이용 통계, 사용자 경험 개선</li>
            </ul>
          </section>

          {/* 2. 수집하는 개인정보 항목 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 수집하는 개인정보 항목</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">필수 수집 항목</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>이메일 주소</li>
                <li>비밀번호 (암호화 저장)</li>
                <li>이름</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">선택 수집 항목</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>프로필 이미지</li>
                <li>휴대폰 번호</li>
                <li>반려동물 정보 (이름, 품종, 생년월일, 건강 기록 등)</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">자동 수집 항목</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>IP 주소, 쿠키, 방문 기록</li>
                <li>기기 정보, 브라우저 종류</li>
                <li>서비스 이용 기록</li>
              </ul>
            </div>
          </section>

          {/* 3. 개인정보의 보유 기간 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 개인정보의 보유 및 이용 기간</h2>
            <p className="mb-4">
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시 동의 받은
              개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (탈퇴 후 즉시 파기)</li>
              <li><strong>결제 정보:</strong> 5년 (전자상거래법)</li>
              <li><strong>서비스 이용 기록:</strong> 3개월 (통신비밀보호법)</li>
            </ul>
          </section>

          {/* 4. 정보주체의 권리 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 정보주체의 권리·의무 및 행사방법</h2>
            <p className="mb-4">
              정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>열람권:</strong> 개인정보 처리 현황 열람 요구</li>
              <li><strong>정정권:</strong> 오류 등이 있을 경우 정정 요구</li>
              <li><strong>삭제권:</strong> 개인정보 삭제 요구 (Right to be Forgotten)</li>
              <li><strong>처리정지권:</strong> 개인정보 처리 정지 요구</li>
              <li><strong>이동권:</strong> 개인정보 다운로드 및 이동 요구</li>
            </ul>
            <div className="bg-primary/10 rounded-lg p-4 mt-4">
              <p className="font-medium text-primary">
                권리 행사 방법: 설정 &gt; 개인정보 관리에서 직접 처리하거나 support@petwatch.kr로 요청
              </p>
            </div>
          </section>

          {/* 5. 개인정보 보호책임자 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 개인정보 보호책임자</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2">
                <li><strong>성명:</strong> 개인정보 보호책임자</li>
                <li><strong>이메일:</strong> privacy@petwatch.kr</li>
                <li><strong>전화:</strong> 02-1234-5678</li>
              </ul>
            </div>
          </section>

          {/* 6. 개인정보의 안전성 확보 조치 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 개인정보의 안전성 확보 조치</h2>
            <p className="mb-4">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>관리적 조치:</strong> 개인정보 취급자 지정 및 교육</li>
              <li><strong>기술적 조치:</strong> 암호화, 접근 통제, 보안 프로그램 설치</li>
              <li><strong>물리적 조치:</strong> 전산실 접근 통제</li>
            </ul>
          </section>

          {/* 7. 쿠키 정책 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. 쿠키의 사용</h2>
            <p className="mb-4">
              회사는 서비스 제공을 위해 쿠키를 사용합니다. 쿠키는 웹사이트가 사용자의 컴퓨터에 저장하는
              작은 텍스트 파일입니다.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>필수 쿠키:</strong> 로그인 상태 유지, 보안</li>
              <li><strong>분석 쿠키:</strong> 서비스 이용 통계 (거부 가능)</li>
            </ul>
            <p className="mt-4 text-sm">
              쿠키 설정은 브라우저 설정에서 변경할 수 있습니다.
            </p>
          </section>

          {/* 8. 개정 이력 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. 개인정보 처리방침 변경</h2>
            <p className="mb-4">
              이 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다.
              법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
              시행일 7일 전부터 공지사항을 통해 고지할 것입니다.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>© 2024 PetWatch. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
