"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Printer, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import MaskOverlaySlider from "@/components/mask-overlay-slider"
import { apiClient, type ValidationRecordDetail } from "@/lib/api"

interface ResultPageProps {
  params: {
    id: string
  }
}

export default function ResultPage({ params }: ResultPageProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [validationRecord, setValidationRecord] = useState<ValidationRecordDetail | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchValidationRecord = async () => {
      try {
        // 인증 상태 확인
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!apiClient.isAuthenticated()) {
          toast({
            title: "로그인 필요",
            description: "검증 결과를 보려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        setLoading(true)
        const record = await apiClient.getValidationRecordByUuid(params.id)
        setValidationRecord(record)
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
  }, [params.id, router, toast])

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
            <p className="text-gray-600">분석 ID: {params.id}</p>
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
                <Button onClick={() => router.push('/history')}>
                  검증 기록으로 돌아가기
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
                    {(validationRecord.modification_rate && validationRecord.modification_rate > 1.0) ? (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">변조률</p>
                      <p className="text-2xl font-bold">
                        {validationRecord.modification_rate ? `${validationRecord.modification_rate.toFixed(2)}%` : '0%'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">분석 상태</p>
                      <Badge variant={(validationRecord.modification_rate && validationRecord.modification_rate > 1.0) ? "destructive" : "default"}>
                        {(validationRecord.modification_rate && validationRecord.modification_rate > 1.0) ? "변조 탐지" : "원본 확인"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      {(validationRecord.modification_rate && validationRecord.modification_rate > 1.0) ? "변조 분석 결과" : "이미지 분석 결과"}
                    </h4>
                    {(validationRecord.modification_rate && validationRecord.modification_rate > 1.0) ? (
                      <div className="text-sm text-blue-700">
                        <p><strong>변조율:</strong> {validationRecord.modification_rate.toFixed(2)}%</p>
                        <p><strong>상태:</strong> 이미지에서 변조가 탐지되었습니다.</p>
                        {validationRecord.detected_watermark_info && (
                          <>
                            <p><strong>원본 파일:</strong> {validationRecord.detected_watermark_info.filename}</p>
                            <p><strong>저작권:</strong> {validationRecord.detected_watermark_info.copyright}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-blue-700">
                        <p><strong>변조율:</strong> {validationRecord.modification_rate ? `${validationRecord.modification_rate.toFixed(2)}%` : '0.0%'}</p>
                        <p><strong>상태:</strong> 원본 이미지로 확인되었습니다.</p>
                        <p className="no-print">변조율이 1.0% 이하로 변조가 아닌 것으로 판단됩니다.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mask Overlay Visualization */}
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

              {/* Fallback Image Display */}
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
            </div>
          )}
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  )
}
