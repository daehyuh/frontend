"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Shield } from "lucide-react"

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')

  // 이용약관 내용
  const termsContent = `
제1조 (목적)

본 약관은 AEGIS 프로젝트(이하 “회사”)가 제공하는 서비스(이하 “서비스”)의 이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)

“회원”이란 본 약관에 따라 서비스에 가입하여 서비스를 이용하는 자를 말합니다.

“서비스”란 회사가 운영하는 플랫폼에서 제공하는 회원가입, 사진 업로드 및 관리 등의 기능을 의미합니다.

“콘텐츠”란 회원이 서비스 이용 과정에서 업로드하거나 저장하는 사진 및 관련 정보를 의미합니다.

제3조 (약관의 효력 및 변경)

본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다.

회사는 필요 시 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 변경된 약관은 적용일자 및 사유를 명시하여 공지합니다.

제4조 (회원가입)

회원가입은 이용자가 약관 및 개인정보 처리방침에 동의하고, 회사가 정한 절차에 따라 가입 신청을 완료한 때 성립됩니다.

회사는 다음 각 호의 경우 회원가입을 거절할 수 있습니다.

타인의 명의 또는 허위 정보를 사용한 경우

사회질서 또는 법령을 위반하는 목적으로 신청한 경우

제5조 (회원의 의무)

회원은 서비스 이용 시 관계 법령, 약관, 회사의 공지사항을 준수해야 합니다.

회원은 타인의 권리를 침해하거나 불법적인 콘텐츠를 업로드해서는 안 됩니다.

제6조 (서비스 제공 및 중단)

회사는 회원이 등록한 사진을 AWS 클라우드 서버에 저장·관리합니다.

회사는 천재지변, 시스템 점검, 기타 불가항력적 사유가 발생할 경우 서비스 제공을 일시적으로 중단할 수 있습니다.

제7조 (저작권)

회원이 업로드한 사진의 저작권은 해당 회원에게 있으며, 회사는 서비스 운영·저장·백업을 위한 범위 내에서 이를 사용할 수 있습니다.

제8조 (책임 제한)

회사는 다음과 같은 경우에 책임을 지지 않습니다.

회원의 고의 또는 과실로 발생한 손해

천재지변, 네트워크 장애 등 불가항력으로 발생한 손해

제9조 (준거법 및 관할)

본 약관은 대한민국 법률을 준거법으로 하며, 서비스 이용과 관련하여 발생한 분쟁은 민사소송법에 따른 관할 법원에 따릅니다.
  `;

  // 개인정보처리방침 내용
  const privacyContent = `
AEGIS 프로젝트(이하 “회사”)는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 관리하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제1조 (수집하는 개인정보 항목)

회원가입 시: 이름, 이메일, 비밀번호, 휴대전화 번호

서비스 이용 시: 회원이 업로드하는 사진(파일명, 메타데이터 포함)

자동 수집: 접속 로그, 쿠키, IP 주소

제2조 (개인정보의 수집 및 이용 목적)

회원가입 및 서비스 제공을 위한 본인 확인

회원이 업로드한 사진 저장·관리(AWS 클라우드 서버 이용)

서비스 품질 개선 및 보안 강화

제3조 (개인정보 보유 및 이용기간)

회원 탈퇴 시 즉시 파기합니다.

단, 관련 법령에 따라 보존이 필요한 경우 해당 법령이 정한 기간 동안 보관합니다.

제4조 (개인정보의 제3자 제공)

회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다.
단, 법령에 근거가 있거나 수사기관의 요청이 있는 경우 예외적으로 제공할 수 있습니다.

제5조 (개인정보의 처리 위탁)

회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.

위탁 대상: Amazon Web Services (AWS)

위탁 내용: 회원이 업로드한 사진의 저장 및 관리

제6조 (개인정보의 파기 절차 및 방법)

회원 탈퇴 또는 개인정보 보유기간 경과 시, 전자적 파일 형태는 복구 불가능한 방법으로 삭제합니다.

제7조 (정보주체의 권리)

회원은 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리정지 요구를 할 수 있습니다.

제8조 (개인정보 보호책임자)

책임자: 강대현

연락처: 010-3822-2413

제9조 (개인정보 처리방침 변경)

본 방침은 시행일로부터 적용되며, 변경 시 서비스 내 공지사항을 통해 고지합니다.
  `;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">약관 및 정책</h1>
            <p className="text-xl text-gray-600 text-center">AEGIS 서비스 이용약관 및 개인정보처리방침</p>
          </div>

          {/* 탭 버튼 */}
          <div className="flex justify-center mb-6">
            <div className="flex rounded-lg p-1 gap-1 bg-gray-100">
              <Button
                variant={activeTab === 'terms' ? 'default' : 'ghost'}
                className={`px-6 py-2 flex items-center space-x-2 transition-colors font-medium ${
                  activeTab === 'terms' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-gray-500 hover:text-primary'
                }`}
                onClick={() => setActiveTab('terms')}
              >
                <FileText className="h-4 w-4" />
                <span>이용약관</span>
              </Button>
              <Button
                variant={activeTab === 'privacy' ? 'default' : 'ghost'}
                className={`px-6 py-2 flex items-center space-x-2 transition-colors font-medium ${
                  activeTab === 'privacy' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-gray-500 hover:text-primary'
                }`}
                onClick={() => setActiveTab('privacy')}
              >
                <Shield className="h-4 w-4" />
                <span>개인정보처리방침</span>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                {activeTab === 'terms' ? '서비스 이용약관' : '개인정보처리방침'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <textarea
                  value={activeTab === 'terms' ? termsContent : privacyContent}
                  readOnly
                  className="w-full h-[600px] p-6 border border-gray-200 rounded-lg resize-none font-mono text-sm leading-relaxed bg-gray-50 focus:outline-none"
                  style={{ 
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* 마지막 업데이트 정보 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>마지막 업데이트: 2025년 8월 21일</p>
            <p className="mt-2">
              문의사항이 있으시면 <a href="mailto:kisiaaegis@aegis.com" className="text-blue-600 hover:underline">kisiaaegis@aegis.com</a>으로 연락주세요.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}