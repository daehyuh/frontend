"use client";

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import HourlyStats from "@/components/hourly-stats"
import LeakSourceStats from "@/components/leak-source-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Shield, Search, Calendar, Eye, History, ChevronLeft, ChevronRight, CheckCircle, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { apiClient, type ValidationRecord2, type UserStatistics2, type ValidationList, type ValidationSummaryResponse2 } from "@/lib/api"

interface UserData {
  id: number;
  name: string;
  email: string;
  time_created: string;
}

// 기존 ValidationRecord는 ValidationRecord2로 대체

interface DashboardStats {
  totalValidations: number;
  protectedImages: number;
  detectedTampering: number;
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [allValidations, setAllValidations] = useState<ValidationRecord2[]>([])
  const [filteredValidations, setFilteredValidations] = useState<ValidationRecord2[]>([])
  const [validationLists, setValidationLists] = useState<any>(null) // 새로운 API 구조 저장
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [validationsLoading, setValidationsLoading] = useState(false)
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [totalValidations, setTotalValidations] = useState(0)
  const itemsPerPage = 10
  
  // 필터링 상태
  const [selectedRelationType, setSelectedRelationType] = useState<'all' | 'my_validations' | 'my_image_validations' | 'self_validations'>('all')
  const [relationTypes, setRelationTypes] = useState<{[key: string]: string}>({})
  
  // 검증 내역은 항상 표시됨 (아코디언 기능 제거)

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
        router.push("/login?redirect=/dashboard")
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
        setCurrentUserId(user.id) // 현재 사용자 ID 저장
        await loadDashboardData()
      } catch (error) {
        console.error('User data fetch error:', error)
        toast({
          title: "사용자 정보 조회 실패",
          description: "사용자 정보를 가져올 수 없습니다.",
          variant: "destructive",
        })
        apiClient.logout()
        router.push("/login?redirect=/dashboard")
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
      
      // 새로운 API 시도, 실패 시 기존 API로 fallback
      try {
        const summaryResponse = await apiClient.getMyValidationSummary2(50, 0)

        // 새로운 API 응답 구조 처리
        if (summaryResponse.success && summaryResponse.data && summaryResponse.data[0]) {
          const summaryData = summaryResponse.data[0] as ValidationSummaryResponse2
          const userStats = summaryData.user_statistics
          const validationLists = summaryData.validation_lists
          
          // relation_types 설정
          setRelationTypes(summaryData.relation_types)
          
          // validation_lists 저장
          setValidationLists(validationLists)
          
          // 전체 검증 기록 설정 (all 리스트 사용)
          const allRecords = validationLists.all.records || []
          setAllValidations(allRecords)
          setFilteredValidations(allRecords) // 초기에는 모든 데이터 표시
          setTotalValidations(allRecords.length)
          
          // 통계 데이터 설정
          const stats: DashboardStats = {
            totalValidations: userStats.total_records_count,
            protectedImages: userStats.my_validations_count, // 내가 검증한 수
            detectedTampering: allRecords.filter((v: ValidationRecord2) => v.modification_rate && v.modification_rate > 0).length,
          }
          
          setDashboardStats(stats)
          
          console.log('새로운 API 응답 처리 완료:', {
            totalRecords: allRecords.length,
            myValidations: validationLists.my_validations.count,
            myImageValidations: validationLists.my_image_validations.count,
            selfValidations: validationLists.self_validations.count
          })
          
          return // 성공 시 여기서 함수 종료
        }
      } catch (newApiError) {
        console.warn('새로운 API 실패, 기존 API로 fallback:', newApiError)
        console.error('API Error Details:', newApiError)
      }

      // Fallback: 기존 API 사용
      console.log('기존 API로 fallback 중...')
      const fallbackResponse = await apiClient.getMyValidationSummary(50, 0)

      if (fallbackResponse.success && fallbackResponse.data && fallbackResponse.data[0]) {
        const summaryData = fallbackResponse.data[0] as any
        const userStats = summaryData.user_statistics
        const validationHistory = summaryData.validation_history || []
        
        // 기존 데이터를 새로운 형식으로 변환
        const convertedRecords: ValidationRecord2[] = validationHistory.map((v: any) => ({
          ...v,
          relation_type: 1 as 1, // 기존 데이터는 모두 "내가 검증한 데이터"로 처리
          original_image_owner_id: 0,
          original_image_filename: '',
          original_image_copyright: ''
        }))
        
        // 기본 relation_types 설정
        setRelationTypes({
          "1": "내가 검증한 내역",
          "2": "내 이미지가 검증된 내역", 
          "3": "내가 검증했고 대상도 내 이미지인 내역"
        })
        
        // 전체 검증 기록 설정
        setAllValidations(convertedRecords)
        setFilteredValidations(convertedRecords)
        setTotalValidations(convertedRecords.length)
        
        // 통계 데이터 설정 (기존 필드 사용)
        const stats: DashboardStats = {
          totalValidations: userStats.total_validations || 0,
          protectedImages: userStats.total_uploaded_images || 0,
          detectedTampering: convertedRecords.filter((v: ValidationRecord2) => v.modification_rate && v.modification_rate > 0).length,
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

  // relation_type 필터링 함수 (새로운 API 구조 사용)
  const filterValidationsByRelationType = (relationType: 'all' | 'my_validations' | 'my_image_validations' | 'self_validations') => {
    if (!validationLists) {
      // fallback 모드에서는 기존 로직 사용
      if (relationType === 'all') {
        setFilteredValidations(allValidations)
        setTotalValidations(allValidations.length)
      } else {
        // fallback 모드에서는 모든 데이터가 relation_type 1이므로 my_validations만 지원
        setFilteredValidations(allValidations)
        setTotalValidations(allValidations.length)
      }
    } else {
      // 새로운 API 구조 사용
      const selectedList = validationLists[relationType]
      if (selectedList) {
        setFilteredValidations(selectedList.records || [])
        setTotalValidations(selectedList.count || 0)
      }
    }
    setCurrentPage(1) // 필터링 시 첫 페이지로 이동
  }

  // relation_type 변경 핸들러
  const handleRelationTypeChange = (value: 'all' | 'my_validations' | 'my_image_validations' | 'self_validations') => {
    // fallback 모드에서는 my_image_validations, self_validations 없음
    if (!validationLists && (value === 'my_image_validations' || value === 'self_validations')) {
      return // 해당 타입이 없으면 변경하지 않음
    }
    
    setSelectedRelationType(value)
    filterValidationsByRelationType(value)
  }

  if (isCheckingAuth) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  // 이미지 소유자 판단 함수
  const getImageOwnerTag = (validation: ValidationRecord2) => {
    if (!currentUserId) return null

    // relation_type 2, 3은 내 이미지가 관련된 경우
    if (validation.relation_type === 2 || validation.relation_type === 3) {
      return { text: "내 이미지", color: "bg-green-100 text-green-800" }
    }
    
    // relation_type 1은 내가 다른 사람의 이미지를 검증한 경우
    if (validation.relation_type === 1) {
      return { text: "타인 이미지", color: "bg-gray-100 text-gray-800" }
    }

    return null
  }



  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 현재 페이지의 검증 데이터 (필터링된 데이터에서)
  const getCurrentPageValidations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredValidations.slice(startIndex, endIndex)
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <CardTitle className="text-sm font-medium">내가 검증한 수</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.protectedImages.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">직접 검증한 이미지</p>
                </CardContent>
              </Card>

              {/* 내 이미지 검증 수 (새로운 API에서만 표시) */}
              {validationLists?.my_image_validations && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">내 이미지 검증</CardTitle>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((validationLists.my_image_validations?.count || 0) + (validationLists.self_validations?.count || 0)).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      타인 검증: {validationLists.my_image_validations?.count || 0}건 | 
                      자가 검증: {validationLists.self_validations?.count || 0}건
                    </p>
                  </CardContent>
                </Card>
              )}

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

          {/* Statistics Section: Two Columns */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Left Column: Leak Source Statistics */}
              <LeakSourceStats className="h-full" />
              
              {/* Right Column: Hourly Statistics */}
              <HourlyStats className="h-full" />
            </div>
          )}

          {/* Validation History Section */}
          {!loading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    전체 검증 내역
                  </div>
                  <div className="text-sm text-gray-500">
                    총 {totalValidations}건
                  </div>
                </CardTitle>
                
                {/* 필터링 Select */}
                <div className="flex items-center gap-2 mt-4">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select
                    value={selectedRelationType}
                    onValueChange={handleRelationTypeChange}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="필터 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        전체 보기 
                        {validationLists?.all && ` (${validationLists.all.count})`}
                      </SelectItem>
                      <SelectItem value="my_validations">
                        {validationLists?.my_validations?.name || "내가 검증한 데이터"}
                        {validationLists?.my_validations && ` (${validationLists.my_validations.count})`}
                      </SelectItem>
                      {/* 새로운 API가 작동할 때만 표시 */}
                      {validationLists?.my_image_validations && (
                        <SelectItem value="my_image_validations">
                          {validationLists.my_image_validations.name}
                          {` (${validationLists.my_image_validations.count})`}
                        </SelectItem>
                      )}
                      {validationLists?.self_validations && (
                        <SelectItem value="self_validations">
                          {validationLists.self_validations.name}
                          {` (${validationLists.self_validations.count})`}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Fallback 모드 알림 */}
                  {!validationLists && allValidations.length > 0 && (
                    <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      기본 모드 (내가 검증한 데이터만 표시)
                    </div>
                  )}
                </div>
              </CardHeader>
              
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
                        <Card key={validation.record_id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center space-x-4">
                                {/* Upload Image Placeholder */}
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {validation.s3_validation_image_url ? (
                                    <img
                                      src={validation.s3_validation_image_url}
                                      alt={validation.input_filename}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Search className="w-8 h-8 text-gray-400" />
                                  )}
                                </div>
                                
                                <div className="flex-1 space-y-2 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                                      {validation.input_filename || '파일명 없음'}
                                    </h3>
                                    <Badge variant={(validation.modification_rate && validation.modification_rate > 0) ? "destructive" : "default"}>
                                      {(validation.modification_rate && validation.modification_rate > 0) ? '변조 탐지' : '원본 확인'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {validation.relation_type === 1 && "내 검증"}
                                      {validation.relation_type === 2 && "타인 검증"}
                                      {validation.relation_type === 3 && "자가 검증"}
                                    </Badge>
                                    
                                    {/* 이미지 소유자 태그 */}
                                    {getImageOwnerTag(validation) && (
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImageOwnerTag(validation)?.color}`}
                                      >
                                        {getImageOwnerTag(validation)?.text}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {formatDate(validation.validation_time)}
                                    </div>
                                    <div className="flex items-center">
                                      <span className="mr-1">변조률:</span>
                                      <span className="font-medium text-blue-600">
                                        {validation.modification_rate
                                          ? `${validation.modification_rate.toFixed(2)}%`
                                          : '0%'}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="mr-1">알고리즘:</span>
                                      <span className="font-medium text-blue-600">
                                        {validation.validation_algorithm}
                                      </span>
                                    </div>
                                  </div>

                                  {/* 원본 이미지 정보 (relation_type 2, 3인 경우) */}
                                  {(validation.relation_type === 2 || validation.relation_type === 3) && (
                                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                      <div className="font-medium">원본 이미지 정보</div>
                                      <div>파일명: {validation.original_image_filename}</div>
                                      <div>저작권: {validation.original_image_copyright}</div>
                                      {validation.relation_type === 2 && validation.user_id !== currentUserId && (
                                        <div className="text-purple-600 mt-1">
                                          🔍 타인이 내 이미지를 검증했습니다
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="text-xs text-gray-400">
                                    UUID: {validation.validation_id}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/result/${validation.validation_id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  결과 보기
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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
                </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
