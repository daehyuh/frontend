"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api"

interface UseAuthOptions {
  redirectTo?: string
  requireAuth?: boolean
  showToast?: boolean
}

interface UseAuthReturn {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<boolean>
}

export function useAuth({
  redirectTo = "/login",
  requireAuth = true,
  showToast = true
}: UseAuthOptions = {}): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // 약간의 지연을 두어 쿠키가 완전히 로드되도록 함
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const authenticated = apiClient.isAuthenticated()
      
      if (authenticated) {
        try {
          const userData = await apiClient.getMe()
          setUser(userData)
          setIsAuthenticated(true)
          return true
        } catch (error) {
          // 토큰이 있지만 유효하지 않은 경우
          console.error('Token validation failed:', error)
          apiClient.logout()
          setIsAuthenticated(false)
          setUser(null)
          
          if (requireAuth && showToast) {
            toast({
              title: "세션 만료",
              description: "다시 로그인해주세요.",
              variant: "destructive",
            })
          }
          
          if (requireAuth) {
            router.push(redirectTo)
          }
          return false
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
        
        if (requireAuth) {
          if (showToast) {
            toast({
              title: "로그인 필요",
              description: "이 페이지에 접근하려면 로그인이 필요합니다.",
              variant: "destructive",
            })
          }
          router.push(redirectTo)
        }
        return false
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      setUser(null)
      
      if (requireAuth) {
        if (showToast) {
          toast({
            title: "인증 오류",
            description: "인증 상태를 확인할 수 없습니다.",
            variant: "destructive",
          })
        }
        router.push(redirectTo)
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password)
      
      if (response.access_token) {
        setIsAuthenticated(true)
        // 사용자 정보 다시 로드
        await checkAuth()
        return true
      }
      return false
    } catch (error: any) {
      console.error('Login error:', error)
      if (showToast) {
        toast({
          title: "로그인 실패",
          description: error.message || "로그인 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
      return false
    }
  }

  const logout = () => {
    apiClient.logout()
    setIsAuthenticated(false)
    setUser(null)
    
    if (showToast) {
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
      })
    }
    
    router.push("/")
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuth
  }
}