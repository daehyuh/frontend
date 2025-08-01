"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Download, Copy, Share } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
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

  const handleDownloadReport = async () => {
    try {
      // 실제 백엔드 API에서 PDF 보고서 다운로드
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/report/${params.id}/pdf`, {
        headers: {
          'access-token': localStorage.getItem('access_token') || ''
        }
      })
      
      if (!response.ok) {
        // 백엔드 API가 없을 경우 샘플 PDF로 fallback
        console.warn('백엔드 API 연결 실패, 샘플 보고서를 다운로드합니다.')
        const link = document.createElement("a")
        link.href = "/sample-report.pdf"
        link.download = `aegis-report-${params.id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "샘플 다운로드",
          description: "샘플 보고서가 다운로드되었습니다. (실제 데이터는 백엔드 연결 후 사용 가능)",
        })
        return
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `aegis-report-${params.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(downloadUrl)
      
      toast({
        title: "성공",
        description: "보고서가 다운로드되었습니다.",
      })
    } catch (error) {
      console.error('보고서 다운로드 실패:', error)
      toast({
        title: "다운로드 실패",
        description: "보고서를 다운로드할 수 없습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return date.toLocaleString('ko-KR')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
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
                    {validationRecord.has_watermark ? (
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
                        {validationRecord.modification_rate ? `${(validationRecord.modification_rate * 100).toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">분석 상태</p>
                      <Badge variant={validationRecord.has_watermark ? "destructive" : "default"}>
                        {validationRecord.has_watermark ? "워터마크 탐지" : "원본 확인"}
                      </Badge>
                    </div>
                  </div>
                  
                  {validationRecord.detected_watermark_info && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">탐지된 워터마크 정보</h4>
                      <div className="text-sm text-yellow-700">
                        <p><strong>파일명:</strong> {validationRecord.detected_watermark_info.filename}</p>
                        <p><strong>저작권:</strong> {validationRecord.detected_watermark_info.copyright}</p>
                        {formatDate(validationRecord.detected_watermark_info.upload_time) && (
                          <p><strong>업로드 시간:</strong> {formatDate(validationRecord.detected_watermark_info.upload_time)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Display */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>검증된 이미지</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <img
                      src={validationRecord.s3_path}
                      alt={validationRecord.input_filename}
                      className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '600px' }}
                    />
                    <p className="text-sm text-gray-600 mt-2">검증에 사용된 이미지</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          {!loading && validationRecord && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleDownloadReport} size="lg">
                <Download className="mr-2 h-4 w-4" />
                보고서 다운로드 (PDF)
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
              <Button variant="outline" size="lg">
                <Share className="mr-2 h-4 w-4" />
                결과 공유
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
