"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Printer, Copy, Flag } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import MaskOverlaySlider from "@/components/mask-overlay-slider"
import ReportModal from "@/components/ReportModal"
import { apiClient } from "@/lib/api"
import type { ValidationRecordDetail } from "@/lib/api"

interface ResultContentProps {
  validationId: string
  autoOpenReport?: boolean
}

export default function ResultContent({ validationId, autoOpenReport = false }: ResultContentProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [validationRecord, setValidationRecord] = useState<ValidationRecordDetail | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    console.log('ResultContent 컴포넌트 마운트됨')
    console.log('현재 URL:', window.location.href)
    console.log('searchParams:', searchParams.toString())
    console.log('openReport 파라미터:', searchParams.get('openReport'))
    
    // 인증 상태 확인
    const checkAuth = () => {
      const authenticated = apiClient.isAuthenticated()
      setIsAuthenticated(authenticated)
      console.log('인증 상태:', authenticated)
    }

    checkAuth()

    // 인증 상태 변경 이벤트 리스너
    const handleAuthStateChange = () => {
      checkAuth()
    }

    window.addEventListener('authStateChanged', handleAuthStateChange)

    const fetchValidationRecord = async () => {
      try {
        // 약간의 지연 후 바로 데이터 로드 (인증 확인 제거)
        await new Promise(resolve => setTimeout(resolve, 100))

        setLoading(true)
        
        // 직접 fetch로 public API 호출 (인증 없이)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/validation-record/uuid/${validationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch validation record')
        }

        const data = await response.json()
        const record = data.data && data.data[0] ? data.data[0] : null

        if (!record) {
          throw new Error('No validation record found')
        }

        setValidationRecord(record)
        
        // 데이터 로드 완료 후 자동 제보 모달 열기 체크
        if (autoOpenReport && record) {
          // 위변조가 감지된 경우에만 모달 열기 (변조가 조금이라도 탐지되면)
          const isTampered = (record.modification_rate && record.modification_rate > 0) || record.has_watermark === true
          if (isTampered) {
            setTimeout(() => {
              setIsReportModalOpen(true)
            }, 1000) // 1초 후 모달 열기 (UI 안정화 후)
          }
        }
      } catch (error: any) {
        console.error('검증 기록 조회 실패:', error)
        toast({
          title: "조회 실패",
          description: "검증 기록을 불러올 수 없습니다.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setIsCheckingAuth(false)
      }
    }

    fetchValidationRecord()

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange)
    }
  }, [validationId, toast, autoOpenReport])

  // 별도 useEffect로 모달 자동 오픈 처리
  useEffect(() => {
    // sessionStorage에서 자동 모달 열기 플래그 확인
    const shouldOpenReport = sessionStorage.getItem(`shouldOpenReport_${validationId}`) === 'true'
    console.log('sessionStorage shouldOpenReport:', shouldOpenReport)
    
    if (shouldOpenReport && validationRecord && !loading && !isCheckingAuth) {
      console.log('sessionStorage에서 모달 열기 시도')
      console.log('validationRecord:', validationRecord)
      console.log('modification_rate:', validationRecord.modification_rate)
      console.log('isAuthenticated:', isAuthenticated)
      
      const isDetected = validationRecord.modification_rate && validationRecord.modification_rate > 0
      // 로그인된 사용자이면서 변조가 감지된 경우에만 제보 가능
      const canReport = isAuthenticated && isDetected
      
      console.log('isDetected:', isDetected)
      console.log('canReport:', canReport)
      
      if (canReport) {
        console.log('모달 열기 조건 충족 - 모달을 열겠습니다')
        // sessionStorage 플래그 제거
        sessionStorage.removeItem(`shouldOpenReport_${validationId}`)
        
        // 페이지 로드가 완전히 완료된 후 모달 열기
        setTimeout(() => {
          console.log('모달 열기 실행')
          setIsReportModalOpen(true)
        }, 500)
      } else {
        console.log('모달 열기 조건 불충족:', {
          isAuthenticated,
          isDetected,
          canReport
        })
        // 조건이 충족되지 않으면 플래그도 제거
        sessionStorage.removeItem(`shouldOpenReport_${validationId}`)
      }
    }
  }, [validationRecord, loading, isAuthenticated, validationId, isCheckingAuth])

  if (isCheckingAuth) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleReportSubmitted = () => {
    // 제보 완료 후 데이터 다시 로드하여 제보 정보 반영
    const refetchValidationRecord = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/validation-record/uuid/${validationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const record = data.data && data.data[0] ? data.data[0] : null
          if (record) {
            setValidationRecord(record)
          }
        }
      } catch (error) {
        console.error('데이터 다시 로드 실패:', error)
      }
    }

    refetchValidationRecord()
  }

  // 변조가 감지되었는지 확인
  const isDetected = validationRecord?.modification_rate && validationRecord.modification_rate > 0

  // 로그인한 사용자이면서 변조가 감지된 경우에만 제보 가능
  const canReport = isAuthenticated && isDetected

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          main {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>
      <div className="no-print">
        <Header />
      </div>

      <main className="pt-24 pb-16 print:pt-0 print:pb-0">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">위변조 검증 보고서</h1>
            <p className="text-gray-600">분석 ID: {validationId}</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">검증 결과를 불러오는 중...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && !validationRecord && (
            <Card className="text-center py-12">
              <CardContent>
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold mb-2">검증 기록을 찾을 수 없습니다</h3>
                <p className="text-gray-600 mb-4">요청하신 검증 기록이 존재하지 않거나 접근 권한이 없습니다.</p>
                <Button onClick={() => router.push('/dashboard')}>
                  대시보드로 돌아가기
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Result Content */}
          {!loading && validationRecord && (
            <>

              {/* Result Summary */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {(validationRecord.modification_rate && validationRecord.modification_rate > 0) ? (
                      <>
                        <AlertTriangle className="mr-2 h-6 w-6 text-red-500" />
                        <span className="text-red-600">경고: 변조가 탐지되었습니다</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
                        <span className="text-green-600">안전: 원본 이미지로 확인되었습니다</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">변조률</p>
                      <p className="text-2xl font-bold">
                        {validationRecord.modification_rate
                          ? `${validationRecord.modification_rate.toFixed(2)}%`
                          : '0%'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">분석 상태</p>
                      <Badge variant={(validationRecord.modification_rate && validationRecord.modification_rate > 0) ? "destructive" : "default"}>
                        {(validationRecord.modification_rate && validationRecord.modification_rate > 0) ? '변조 탐지' : '원본 확인'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">검증 알고리즘</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {validationRecord.validation_algorithm}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      {(validationRecord.modification_rate && validationRecord.modification_rate > 0) ? '변조 분석 결과' : '이미지 분석 결과'}
                    </h4>
                    <div className="text-sm text-blue-700">
                      <p><strong>변조율:</strong> {validationRecord.modification_rate
                        ? `${validationRecord.modification_rate.toFixed(2)}%`
                        : '0.0%'}
                      </p>
                      <p><strong>검증 알고리즘:</strong> {validationRecord.validation_algorithm}</p>
                      <p><strong>상태:</strong> {(validationRecord.modification_rate && validationRecord.modification_rate > 0) 
                        ? '이미지에서 변조가 탐지되었습니다.' 
                        : '원본 이미지로 확인되었습니다.'
                      }</p>
                      {validationRecord.detected_watermark_info && (
                        <>
                          <p><strong>원본 파일:</strong> {validationRecord.detected_watermark_info.filename}</p>
                          <p><strong>저작권:</strong> {validationRecord.detected_watermark_info.copyright}</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Original Copyright Information */}
              {validationRecord.original_copyright && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-blue-500" />
                      원본 저작권 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">원본 파일명</p>
                          <p className="font-semibold text-gray-900">{validationRecord.original_copyright.filename}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">업로드 시간</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(validationRecord.original_copyright.upload_time).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">저작권 정보</p>
                          <p className="font-semibold text-gray-900">{validationRecord.original_copyright.copyright}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">보호 알고리즘</p>
                          <p className="font-semibold text-blue-600">{validationRecord.original_copyright.protection_algorithm}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">원본 소유자</p>
                          <p className="font-semibold text-gray-900">{validationRecord.original_copyright.owner_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">소유자 이메일</p>
                          <p className="font-semibold text-gray-900">{validationRecord.original_copyright.owner_email}</p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-white border border-blue-300 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>확인:</strong> 이 이미지는 위 저작권 정보에 따라 보호된 원본 이미지에서 생성된 것으로 확인되었습니다.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* User Report Information - Only show for detected tampering */}
              {isDetected && true ?    <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Flag className="mr-2 h-5 w-5 text-orange-500" />
                      사용자 제보 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">발견 경로</h4>
                        {validationRecord.user_report_link && validationRecord.user_report_link.trim() ? (
                          <a 
                            href={validationRecord.user_report_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {validationRecord.user_report_link}
                          </a>
                        ) : (
                          <span className="text-gray-500 italic">(제보 없음)</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">제보 내용</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          {validationRecord.user_report_text && validationRecord.user_report_text.trim() ? (
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {validationRecord.user_report_text}
                            </p>
                          ) : (
                            <p className="text-gray-500 italic">(제보 없음)</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card> : <></>
                }
              
              {validationRecord.s3_mask_url && (
                <div className="mb-8">
                  <MaskOverlaySlider
                    originalImageUrl={validationRecord.s3_path}
                    maskImageUrl={validationRecord.s3_mask_url}
                    modificationRate={validationRecord.modification_rate || 0}
                    filename={validationRecord.input_filename}
                  />
                </div>
              )}

              {!validationRecord.s3_mask_url && validationRecord.s3_path && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>입력 이미지</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      {!imageError ? (
                        <>
                          <img
                            src={validationRecord.s3_path}
                            alt={validationRecord.input_filename}
                            className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                            style={{ maxHeight: '600px' }}
                            onError={handleImageError}
                          />
                          <p className="text-sm text-gray-600 mt-2">검증에 사용된 입력 이미지</p>
                        </>
                      ) : (
                        <div className="py-12">
                          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">이미지를 불러올 수 없습니다</h3>
                          <p className="text-gray-600 mb-4">
                            파일명: {validationRecord.input_filename}
                          </p>
                          <p className="text-sm text-gray-500">
                            이미지 파일이 삭제되었거나 접근할 수 없는 상태입니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Action Buttons */}
          {!loading && validationRecord && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center no-print">
              <Button onClick={handlePrintReport} size="lg">
                <Printer className="mr-2 h-4 w-4" />
                보고서 인쇄
              </Button>
              <Button variant="outline" onClick={handleCopyLink} size="lg">
                {copySuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    링크 복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    결과 링크 복사
                  </>
                )}
              </Button>
              {canReport && true ? (
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    console.log('제보 버튼 클릭됨')
                    setIsReportModalOpen(true)
                  }} 
                  size="lg"
                  className="bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300"
                >
                  <Flag className="mr-2 h-4 w-4" />
                  위변조 제보하기
                </Button>
              ) : <></>}
            </div>
          )}
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>

      {/* Report Modal */}
      {validationRecord && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          validationUuid={validationRecord.validation_id}
          onReportSubmitted={handleReportSubmitted}
        />
      )}
    </div>
  )
}
