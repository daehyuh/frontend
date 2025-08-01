"use client";

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Shield, Search, Calendar, Eye, History, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api"

interface UserData {
  id: number;
  name: string;
  email: string;
  time_created: string;
}

interface ValidationRecord {
  validation_id: string;
  record_id: number;
  input_filename: string;
  has_watermark: boolean;
  detected_watermark_image_id: number | null;
  modification_rate: number | null;
  validation_time: string;
  s3_validation_image_url: string;
}


interface UserStatistics {
  total_uploaded_images: number;
  total_validations: number;
  validation_history_count: number;
}

interface ValidationSummaryResponse {
  user_statistics: UserStatistics;
  validation_history: ValidationRecord[];
}

interface DashboardStats {
  totalValidations: number;
  protectedImages: number;
  detectedTampering: number;
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [allValidations, setAllValidations] = useState<ValidationRecord[]>([])
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [validationsLoading, setValidationsLoading] = useState(false)
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [totalValidations, setTotalValidations] = useState(0)
  const itemsPerPage = 10
  
  // 아코디언 상태
  const [isValidationsExpanded, setIsValidationsExpanded] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 1차: 로컬 토큰 체크 (빠른 체크)
      if (!apiClient.isAuthenticated()) {
        toast({
          title: "로그인 필요",
          description: "대시보드에 접근하려면 로그인이 필요합니다.",
          variant: "destructive",
        })
        router.push("/login")
        setIsCheckingAuth(false)
        return
      }

      // 2차: 서버 토큰 검증 (보안 체크) - 개발 중에는 선택적으로 실행
      try {
        const isValidToken = await apiClient.verifyToken()
        if (!isValidToken) {
          console.warn('서버 토큰 검증 실패 - 하지만 계속 진행합니다 (개발 모드)')
          // toast({
          //   title: "세션 만료",
          //   description: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
          //   variant: "destructive",
          // })
          // router.push("/login")
          // setIsCheckingAuth(false)
          // return
        }
      } catch (error) {
        console.error('토큰 검증 중 오류 발생:', error)
        console.warn('서버 토큰 검증 실패 - 하지만 계속 진행합니다 (개발 모드)')
      }
      try {
        const user = await apiClient.getMe()
        console.log('User data:', user)
        setUserData(user)
        await loadDashboardData()
      } catch (error) {
        console.error('User data fetch error:', error)
        toast({
          title: "사용자 정보 조회 실패",
          description: "사용자 정보를 가져올 수 없습니다.",
          variant: "destructive",
        })
        apiClient.logout()
        router.push("/login")
      } finally {
        setIsCheckingAuth(false)
        setLoading(false)
      }
    }
    fetchUserData()
  }, [router, toast])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // API 호출
      const summaryResponse = await apiClient.getMyValidationSummary(50, 0)

      // 새로운 API 응답 구조 처리
      if (summaryResponse.success && summaryResponse.data && summaryResponse.data[0]) {
        const summaryData = summaryResponse.data[0] as ValidationSummaryResponse
        const userStats = summaryData.user_statistics
        const validationHistory = summaryData.validation_history || []
        
        // 전체 검증 기록 설정
        setAllValidations(validationHistory)
        setTotalValidations(validationHistory.length)
        
        
        // 통계 데이터 설정
        const stats: DashboardStats = {
          totalValidations: userStats.total_validations,
          protectedImages: userStats.total_uploaded_images,
          detectedTampering: validationHistory.filter((v: ValidationRecord) => v.has_watermark).length,
        }
        
        setDashboardStats(stats)
      }
    } catch (error) {
      console.error('Dashboard data load error:', error)
      toast({
        title: "데이터 로드 실패",
        description: "대시보드 데이터를 불러올 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 페이징된 검증 데이터 로드
  const loadPagedValidations = async (page: number) => {
    try {
      setValidationsLoading(true)
      const offset = (page - 1) * itemsPerPage
      const response = await apiClient.getMyValidationSummary(itemsPerPage, offset)
      
      if (response.success && response.data && response.data[0]) {
        const summaryData = response.data[0] as ValidationSummaryResponse
        const pagedValidations = summaryData.validation_history || []
        
        // 현재 페이지의 데이터 업데이트
        const startIndex = (page - 1) * itemsPerPage
        const newAllValidations = [...allValidations]
        pagedValidations.forEach((validation, index) => {
          newAllValidations[startIndex + index] = validation
        })
        setAllValidations(newAllValidations)
      }
    } catch (error) {
      console.error('Paged validations load error:', error)
      toast({
        title: "데이터 로드 실패",
        description: "검증 기록을 불러올 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setValidationsLoading(false)
    }
  }

  if (isCheckingAuth) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }


  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadPagedValidations(page)
  }

  // 현재 페이지의 검증 데이터
  const getCurrentPageValidations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return allValidations.slice(startIndex, endIndex)
  }

  // 총 페이지 수
  const totalPages = Math.ceil(totalValidations / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">대시보드</h1>
            <p className="text-xl text-gray-600">
              {userData && userData.name ? `${userData.name}님의 ` : ''}AEGIS 서비스 이용 현황과 검증 기록을 확인하세요
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">대시보드 데이터를 불러오는 중...</p>
            </div>
          )}

          {/* Stats Cards */}
          {!loading && dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 검증 횟수</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalValidations.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">누적 검증 수</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">보호된 이미지</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.protectedImages.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">워터마크 삽입</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">탐지된 위변조</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.detectedTampering.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">변조 이미지 발견</p>
                </CardContent>
              </Card>

            </div>
          )}

          {/* All Validations with Pagination - Accordion Style */}
          {!loading && (
            <Card>
              <CardHeader>
                <CardTitle 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => setIsValidationsExpanded(!isValidationsExpanded)}
                >
                  <div className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    전체 검증 내역
                    {isValidationsExpanded ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    총 {totalValidations}건
                  </div>
                </CardTitle>
              </CardHeader>
              
              {isValidationsExpanded && (
                <CardContent>
                {validationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">검증 기록을 불러오는 중...</p>
                  </div>
                ) : getCurrentPageValidations().length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {getCurrentPageValidations().map((validation) => (
                        <div key={validation.record_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{validation.input_filename || '파일명 없음'}</p>
                              <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-1">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{formatDate(validation.validation_time)}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="flex-shrink-0 hidden sm:inline-flex">검증</Badge>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end space-x-3 sm:space-x-0 sm:space-y-2">
                            <div className="flex items-center space-x-2 sm:flex-col sm:items-end sm:space-x-0 sm:space-y-1">
                              <Badge variant={validation.has_watermark ? "destructive" : "default"} className="text-xs">
                                {validation.has_watermark ? "변조 탐지" : "원본"}
                              </Badge>
                              <p className="text-xs sm:text-sm text-gray-600">
                                변조률: {validation.modification_rate ? `${(validation.modification_rate * 100).toFixed(1)}%` : 'N/A'}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/result/${validation.validation_id}`)}
                              className="flex-shrink-0"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline">상세</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 space-y-3 sm:space-y-0">
                        <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                          {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalValidations)} / {totalValidations}
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || validationsLoading}
                            className="px-2 sm:px-3"
                          >
                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline ml-1">이전</span>
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  disabled={validationsLoading}
                                  className="w-8 h-8 p-0 text-xs sm:text-sm"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                            {totalPages > 3 && (
                              <>
                                <span className="px-1 text-gray-400 text-xs">...</span>
                                <Button
                                  variant={currentPage === totalPages ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(totalPages)}
                                  disabled={validationsLoading}
                                  className="w-8 h-8 p-0 text-xs sm:text-sm"
                                >
                                  {totalPages}
                                </Button>
                              </>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || validationsLoading}
                            className="px-2 sm:px-3"
                          >
                            <span className="hidden sm:inline mr-1">다음</span>
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-500 mb-2">아직 검증 기록이 없습니다</p>
                    <p className="text-sm text-gray-400">이미지를 검증해보세요</p>
                  </div>
                )}
              </CardContent>
              )}
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
