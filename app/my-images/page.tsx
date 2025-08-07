"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, Search, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { usePagination } from "@/hooks/usePagination"
import { apiClient } from "@/lib/api"
import { getImageUrl, downloadImage } from "@/lib/image-utils"

interface ImageRecord {
  image_id: number
  filename: string
  copyright: string
  upload_time: string
  s3_paths: {
    gt: string
    lr: string
    sr: string
    sr_h: string
  }
}

export default function MyImagesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [images, setImages] = useState<ImageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // 페이징 훅
  const pagination = usePagination({
    initialPage: 1,
    pageSize: 12
  })

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!apiClient.isAuthenticated()) {
          toast({
            title: "로그인 필요",
            description: "내 이미지에 접근하려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }
        
        setIsCheckingAuth(false)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router, toast])

  // 이미지 목록 로드
  const loadImages = async () => {
    if (isCheckingAuth) return

    try {
      setLoading(true)
      const response = await apiClient.getUserImages(pagination.pageSize, pagination.offset)
      
      if (response.success && response.data) {
        setImages(response.data)
        
        // 백엔드에서 total 정보를 제공하는 경우
        if (response.pagination?.total) {
          pagination.setTotalItems(response.pagination.total)
        } else {
          // total 정보가 없는 경우 현재 페이지 데이터 개수로 추정
          const estimatedTotal = response.data.length < pagination.pageSize 
            ? pagination.offset + response.data.length
            : pagination.offset + response.data.length + 1
          pagination.setTotalItems(estimatedTotal)
        }
      }
    } catch (error: any) {
      console.error('이미지 로드 실패:', error)
      toast({
        title: "로드 실패",
        description: "이미지 목록을 불러올 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 페이지 변경시 이미지 로드
  useEffect(() => {
    loadImages()
  }, [pagination.currentPage, pagination.pageSize, isCheckingAuth])

  if (isCheckingAuth) return null;

  // 검색 기능 (클라이언트 사이드 필터링)
  const filteredImages = images.filter((image) => {
    if (!searchTerm.trim()) return true;
    
    const query = searchTerm.trim().normalize('NFC').toLowerCase();
    const filename = (image.filename || '').normalize('NFC').toLowerCase();
    const copyright = (image.copyright || '').normalize('NFC').toLowerCase();
    const imageId = image.image_id.toString();
    
    return filename.includes(query) || 
           copyright.includes(query) || 
           imageId.includes(query);
  })

  // 검색 초기화 함수
  const clearSearch = () => {
    setSearchTerm('');
  }


  const handleDownloadDirect = async (url: string, filename: string) => {
    try {
      await downloadImage(url, filename);
      toast({
        title: "성공",
        description: "이미지가 다운로드되었습니다.",
      });
    } catch (error) {
      console.error('다운로드 실패:', error);
      toast({
        title: "오류",
        description: "이미지 다운로드에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">내 이미지</h1>
            <p className="text-xl text-gray-600">업로드한 워터마크 이미지를 관리하세요</p>
          </div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="파일명으로 검색 (현재 페이지 내에서만 검색됩니다)"
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
              <p className="text-gray-600">이미지를 불러오는 중...</p>
            </div>
          )}

          {/* Search Results Summary & Pagination Info */}
          {!loading && images.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <div>
                {searchTerm.trim() ? (
                  <div className="text-sm text-gray-600">
                    <p>검색 결과: <span className="font-semibold">{filteredImages.length}</span>개 (현재 페이지 내)</p>
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ 전체 검색을 위해서는 모든 페이지를 확인해주세요
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    전체 <span className="font-semibold">{pagination.totalItems}</span>개의 이미지
                  </p>
                )}
              </div>
              {searchTerm.trim() && (
                <button
                  onClick={clearSearch}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  검색 초기화
                </button>
              )}
            </div>
          )}

          {/* Images Grid */}
          {!loading && filteredImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredImages.map((image) => {
                const uploadDate = new Date(image.upload_time).toLocaleDateString('ko-KR')
                
                return (
                  <Card key={image.image_id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={getImageUrl(image.s3_paths.gt)}
                          alt={image.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-400 font-mono mb-1">
                            ID: {image.image_id}
                          </p>
                          <h3 className="font-medium text-gray-900 truncate">{image.filename || '파일명 없음'}</h3>
                          <p className="text-sm text-gray-500">
                            {uploadDate}
                          </p>
                        </div>
                        
                        {/* 저작권 정보 항상 표시 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-blue-800 mb-1">저작권 정보</p>
                              <p className="text-sm text-blue-700 break-words">
                                {image.copyright || "저작권 정보가 설정되지 않았습니다"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-800">보호됨</Badge>
                          <Badge variant="outline">원본 보호</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent"
                            onClick={() => handleDownloadDirect(image.s3_paths.gt, `gt_${image.filename}`)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            원본
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent"
                            onClick={() => handleDownloadDirect(image.s3_paths.sr, `sr_${image.filename}`)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            워터마크
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination - Dashboard Style */}
          {!loading && images.length > 0 && !searchTerm.trim() && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-8 space-y-3 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                {((pagination.currentPage - 1) * pagination.pageSize) + 1}-{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} / {pagination.totalItems}
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pagination.prevPage}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-2 sm:px-3"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">이전</span>
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => pagination.goToPage(pageNum)}
                        disabled={loading}
                        className="w-8 h-8 p-0 text-xs sm:text-sm"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {pagination.totalPages > 3 && (
                    <>
                      <span className="px-1 text-gray-400 text-xs">...</span>
                      <Button
                        variant={pagination.currentPage === pagination.totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => pagination.goToPage(pagination.totalPages)}
                        disabled={loading}
                        className="w-8 h-8 p-0 text-xs sm:text-sm"
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={pagination.nextPage}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-2 sm:px-3"
                >
                  <span className="hidden sm:inline mr-1">다음</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          )}

          {!loading && filteredImages.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500 mb-4">
                  {searchTerm.trim() ? (
                    <>
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">"{searchTerm}"에 대한 검색 결과가 없습니다</p>
                      <p className="text-sm">다른 키워드로 검색해보세요</p>
                    </>
                  ) : (
                    <>
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">아직 업로드한 이미지가 없습니다</p>
                      <p className="text-sm">첫 번째 이미지를 업로드해보세요</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="mt-12 text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">새로운 이미지 분석</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/protect">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Shield className="mr-2 h-4 w-4" />
                    원본 보호하기
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                    <Search className="mr-2 h-4 w-4" />
                    위변조 검증하기
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
