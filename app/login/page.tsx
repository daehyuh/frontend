"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { apiClient } from "@/lib/api"
import { isAuthenticated } from "@/lib/auth-utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // 로그인된 상태 확인 및 로그인 유지 설정 복원
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 약간의 지연을 두어 쿠키가 완전히 로드되도록 함
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 로그인 유지 설정 복원
        const rememberMeSetting = localStorage.getItem('remember_me') === 'true';
        setRememberMe(rememberMeSetting);
        
        if (isAuthenticated()) {
          console.log('User is already authenticated, redirecting to main page...')
          router.push("/")
          return
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt with:', { email, password });
    setIsLoading(true)

    try {
      console.log('Calling apiClient.login...');
      await apiClient.login(email, password, rememberMe)
      console.log('Login successful');
        
      toast({
        title: "로그인 성공",
        description: rememberMe ? "로그인 상태가 유지됩니다." : "AEGIS 서비스에 오신 것을 환영합니다.",
      })
      
      // 원래 방문하려던 페이지가 있으면 그곳으로, 없으면 대시보드로 이동
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      console.log('Redirecting to:', redirectTo);
      router.push(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      
      let errorTitle = "로그인 실패";
      let errorDescription = "로그인 중 오류가 발생했습니다.";
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // 백엔드에서 오는 구체적인 에러 메시지 처리
        if (message.includes('email') && message.includes('not found')) {
          errorTitle = "계정을 찾을 수 없음";
          errorDescription = "입력하신 이메일 주소로 등록된 계정이 없습니다.";
        } else if (message.includes('password') && message.includes('incorrect')) {
          errorTitle = "비밀번호 오류";
          errorDescription = "비밀번호가 올바르지 않습니다.";
        } else if (message.includes('invalid credentials') || message.includes('unauthorized')) {
          errorTitle = "인증 실패";
          errorDescription = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (message.includes('email format') || message.includes('invalid email')) {
          errorTitle = "이메일 형식 오류";
          errorDescription = "올바른 이메일 형식으로 입력해주세요.";
        } else if (message.includes('server') || message.includes('internal')) {
          errorTitle = "서버 오류";
          errorDescription = "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (message.includes('network') || message.includes('fetch')) {
          errorTitle = "네트워크 오류";
          errorDescription = "인터넷 연결을 확인하고 다시 시도해주세요.";
        } else {
          // 백엔드에서 온 원본 메시지 사용
          errorDescription = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 인증 상태 확인 중이면 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">AEGIS 로그인</CardTitle>
              <p className="text-gray-600">계정에 로그인하여 서비스를 이용하세요</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="이메일을 입력하세요"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      className="rounded" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <Label htmlFor="remember" className="text-sm">
                      로그인 상태 유지
                    </Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    비밀번호 찾기
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "로그인 중..." : "로그인"}
                </Button>
              </form>
            
              <Separator className="my-6" />

              <div className="text-center mt-6">
                <p className="text-gray-600">
                  계정이 없으신가요?{" "}
                  <Link href="/signup" className="text-primary hover:underline font-medium">
                    회원가입
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
