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
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { apiClient } from "@/lib/api"
import { isAuthenticated } from "@/lib/auth-utils"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // 로그인된 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 약간의 지연을 두어 쿠키가 완전히 로드되도록 함
        await new Promise(resolve => setTimeout(resolve, 100))
        
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    if (!agreeTerms || !agreePrivacy) {
      toast({
        title: "약관 동의 필요",
        description: "이용약관과 개인정보처리방침에 동의해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      
      await apiClient.signup(formData.name, formData.email, formData.password)
      
      toast({
        title: "회원가입 성공",
        description: "회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.",
      })
      
      // 로그인 페이지로 이동
      router.push("/login")
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorTitle = "회원가입 실패";
      let errorDescription = "회원가입 중 오류가 발생했습니다.";
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // 백엔드에서 오는 구체적인 에러 메시지 처리
        if (message.includes('email') && (message.includes('already exists') || message.includes('duplicate') || message.includes('이미 존재'))) {
          errorTitle = "이메일 중복";
          errorDescription = "이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.";
        } else if (message.includes('email format') || message.includes('invalid email') || message.includes('이메일 형식')) {
          errorTitle = "이메일 형식 오류";
          errorDescription = "올바른 이메일 형식으로 입력해주세요. (예: user@example.com)";
        } else if (message.includes('password') && (message.includes('too short') || message.includes('weak') || message.includes('짧습니다'))) {
          errorTitle = "비밀번호 형식 오류";
          errorDescription = "비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.";
        } else if (message.includes('name') && (message.includes('required') || message.includes('필수'))) {
          errorTitle = "이름 입력 필요";
          errorDescription = "이름을 입력해주세요.";
        } else if (message.includes('validation') || message.includes('422')) {
          errorTitle = "입력 정보 오류";
          errorDescription = "입력하신 정보를 다시 확인해주세요.";
        } else if (message.includes('server') || message.includes('internal') || message.includes('500')) {
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
              <CardTitle className="text-2xl font-bold text-primary">AEGIS 회원가입</CardTitle>
              <p className="text-gray-600">새 계정을 만들어 서비스를 시작하세요</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="이름을 입력하세요"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="이메일을 입력하세요"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
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
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
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
                  <p className="text-xs text-gray-500">8자 이상, 영문, 숫자, 특수문자 포함</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호를 다시 입력하세요"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={agreeTerms} 
                      onCheckedChange={(checked) => setAgreeTerms(checked === true)} 
                    />
                    <Label htmlFor="terms" className="text-sm">
                      <Link href="#" className="text-primary hover:underline">
                        이용약관
                      </Link>
                      에 동의합니다 (필수)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="privacy" 
                      checked={agreePrivacy} 
                      onCheckedChange={(checked) => setAgreePrivacy(checked === true)} 
                    />
                    <Label htmlFor="privacy" className="text-sm">
                      <Link href="#" className="text-primary hover:underline">
                        개인정보처리방침
                      </Link>
                      에 동의합니다 (필수)
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "가입 중..." : "회원가입"}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="text-center mt-6">
                <p className="text-gray-600">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    로그인
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
