import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">AEGIS</h3>
            <p className="text-gray-300">AI 기반 위변조 탐지 및 검증 서비스</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/protect" className="hover:text-white transition-colors">
                  원본 보호
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white transition-colors">
                  위변조 검증
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  대시보드
                </Link>
              </li>
              <li>
                <Link href="/my-images" className="hover:text-white transition-colors">
                  내 이미지
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">법적 고지</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  서비스 이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2025 AEGIS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
