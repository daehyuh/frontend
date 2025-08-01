'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { History, Search, AlertTriangle, CheckCircle, Calendar, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { apiClient } from "@/lib/api"

interface ValidationRecord {
  validation_id: string
  record_id: number
  input_filename: string
  has_watermark: boolean
  detected_watermark_image_id: number | null
  modification_rate: number | null
  validation_time: string
  s3_validation_image_url: string
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<ValidationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // 인증 상태 확인 및 검증 기록 로드
  useEffect(() => {
    const checkAuthAndLoadRecords = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!apiClient.isAuthenticated()) {
          toast({
            title: "로그인 필요",
            description: "검증 기록을 보려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        await loadValidationRecords()
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuthAndLoadRecords()
  }, [router, toast])

  const loadValidationRecords = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getValidationHistory()
      if (response.success && response.data) {
        setRecords(response.data)
      }
    } catch (error: any) {
      console.error('검증 기록 로드 실패:', error)
      toast({
        title: "로드 실패",
        description: "검증 기록을 불러올 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isCheckingAuth) return null

  const filteredRecords = records.filter((record) => {
    return record.input_filename?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  })

  const getResultBadge = (hasWatermark: boolean, modificationRate: number | null) => {
    if (hasWatermark) {
      return (
        <Badge variant="destructive" className="flex items-center">
          <AlertTriangle className="w-3 h-3 mr-1" />
          워터마크 탐지
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" />
          원본 이미지
        </Badge>
      )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">검증 기록</h1>
            <p className="text-xl text-gray-600">위변조 검증 내역을 확인하세요</p>
          </div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="파일명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">검증 기록을 불러오는 중...</p>
            </div>
          )}

          {/* Records List */}
          {!loading && (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card key={record.record_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg text-gray-900">{record.input_filename || '파일명 없음'}</h3>
                          {getResultBadge(record.has_watermark, record.modification_rate)}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(record.validation_time)}
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">수정률:</span>
                            <span className={`font-medium ${getScoreColor(record.modification_rate ? record.modification_rate * 100 : 0)}`}>
                              {record.modification_rate ? `${(record.modification_rate * 100).toFixed(1)}%` : 'N/A'}
                            </span>
                          </div>
                          {record.detected_watermark_image_id && (
                            <div className="flex items-center">
                              <span className="mr-1">탐지된 이미지 ID:</span>
                              <span className="font-medium text-blue-600">
                                #{record.detected_watermark_image_id}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-400">
                          UUID: {record.validation_id}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/result/${record.validation_id}`)}
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
          )}

          {/* Empty State */}
          {!loading && filteredRecords.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500 mb-4">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">검증 기록이 없습니다</p>
                  <p className="text-sm">이미지를 검증해보세요</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="mt-12 text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">새로운 이미지 검증</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/verify">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Search className="mr-2 h-4 w-4" />
                    위변조 검증하기
                  </Button>
                </Link>
                <Link href="/protect">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    원본 보호하기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}