"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, User } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  // 메인 페이지에서만 투명 헤더 사용
  const isHomePage = pathname === "/"
  const shouldUseTransparentHeader = isHomePage && !isScrolled

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // 초기 인증 상태 확인 (컴포넌트 마운트 시에만)
    const checkAuthStatus = async () => {
      try {
        // 약간의 지연을 두어 쿠키가 완전히 로드되도록 함
        await new Promise(resolve => setTimeout(resolve, 50))
        const authStatus = apiClient.isAuthenticated()
        setIsAuthenticated(authStatus)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsAuthLoading(false)
      }
    }

    // 인증 상태 변경 이벤트 리스너
    const handleAuthChange = () => {
      setIsAuthenticated(apiClient.isAuthenticated())
    }

    checkAuthStatus()
    
    // 로그인/로그아웃 시 헤더 상태 즉시 업데이트
    window.addEventListener('authStateChanged', handleAuthChange)
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, []) // pathname dependency 제거

  const handleLogout = () => {
    apiClient.logout()
    setIsAuthenticated(false)
    toast({
      title: "로그아웃 완료",
      description: "성공적으로 로그아웃되었습니다.",
    })
    router.push("/")
  }

  // 인증 상태를 즉시 업데이트하는 함수 (로그인 성공 시 사용)
  const updateAuthStatus = () => {
    setIsAuthenticated(apiClient.isAuthenticated())
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        shouldUseTransparentHeader ? "bg-transparent" : "bg-white shadow-md"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/AEGIS.png"
              alt="AEGIS"
              width={78}
              height={20}
              className={`object-contain transition-all duration-300 ${
                shouldUseTransparentHeader ? "brightness-100" : "brightness-0"
              }`}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`transition-colors px-2 py-1 rounded-md ${
                pathname === "/"
                  ? shouldUseTransparentHeader
                    ? "text-white font-bold underline underline-offset-4 decoration-white"
                    : "text-primary font-bold underline underline-offset-4"
                  : shouldUseTransparentHeader
                  ? "text-white hover:text-gray-200"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              홈
            </Link>
            <Link
              href="/protect"
              className={`transition-colors px-2 py-1 rounded-md ${
                pathname === "/protect"
                  ? shouldUseTransparentHeader
                    ? "text-white font-bold underline underline-offset-4 decoration-white"
                    : "text-primary font-bold underline underline-offset-4"
                  : shouldUseTransparentHeader
                  ? "text-white hover:text-gray-200"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              원본 보호
            </Link>
            <Link
              href="/verify"
              className={`transition-colors px-2 py-1 rounded-md ${
                pathname === "/verify"
                  ? shouldUseTransparentHeader
                    ? "text-white font-bold underline underline-offset-4 decoration-white"
                    : "text-primary font-bold underline underline-offset-4"
                  : shouldUseTransparentHeader
                  ? "text-white hover:text-gray-200"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              위변조 검증
            </Link>
            <Link
              href="/dashboard"
              className={`transition-colors px-2 py-1 rounded-md ${
                pathname === "/dashboard"
                  ? shouldUseTransparentHeader
                    ? "text-white font-bold underline underline-offset-4 decoration-white"
                    : "text-primary font-bold underline underline-offset-4"
                  : shouldUseTransparentHeader
                  ? "text-white hover:text-gray-200"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              대시보드
            </Link>
            <Link
              href="/my-images"
              className={`transition-colors px-2 py-1 rounded-md ${
                pathname === "/my-images"
                  ? shouldUseTransparentHeader
                    ? "text-white font-bold underline underline-offset-4 decoration-white"
                    : "text-primary font-bold underline underline-offset-4"
                  : shouldUseTransparentHeader
                  ? "text-white hover:text-gray-200"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              내 이미지
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthLoading ? (
              // 로딩 중일 때는 빈 공간 유지 (깜빡임 방지)
              <div className="w-32 h-10"></div>
            ) : isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  className={shouldUseTransparentHeader ? "text-white border-white hover:bg-white hover:text-primary bg-transparent" : ""}
                  onClick={handleLogout}
                >
                  로그아웃
                </Button>
              </>
            ) : shouldUseTransparentHeader ? (
              <>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="text-white border-white hover:bg-white hover:text-primary bg-transparent"
                  >
                    로그인
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-white text-primary hover:bg-gray-100">회원가입</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-primary">
                    로그인
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary text-white hover:bg-primary/90">회원가입</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden transition-colors ${shouldUseTransparentHeader ? "text-white" : "text-gray-700"}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <nav className="flex flex-col space-y-4 p-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                홈
              </Link>
              <Link
                href="/protect"
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                원본 보호
              </Link>
              <Link
                href="/verify"
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                위변조 검증
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                대시보드
              </Link>
              <Link
                href="/my-images"
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                내 이미지
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t">
                {isAuthLoading ? (
                  // 모바일에서도 로딩 중일 때 빈 공간 유지
                  <div className="h-10"></div>
                ) : isAuthenticated ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      로그아웃
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="text-gray-700 hover:text-primary w-full">
                        로그인
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="bg-primary text-white hover:bg-primary/90 w-full">회원가입</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
