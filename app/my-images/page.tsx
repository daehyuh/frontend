"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, Search, Shield, ChevronLeft, ChevronRight, Calendar, X, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { usePagination } from "@/hooks/usePagination"
import { apiClient } from "@/lib/api"
import { getImageUrl, getDirectImageUrl, downloadImage } from "@/lib/image-utils"

interface ImageRecord {
  image_id: number
  filename: string
  copyright: string
  upload_time: string
  protection_algorithm?: string
  s3_paths?: {
    gt?: string
    sr_h?: string
  }
}

export default function MyImagesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [images, setImages] = useState<ImageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null)
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
          router.push("/login?redirect=/my-images")
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
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const imageData = response.data
        
        setImages(imageData)
        
        // 페이지네이션 정보가 별도로 없으므로 현재 데이터로 추정
        const estimatedTotal = imageData.length < pagination.pageSize 
          ? pagination.offset + imageData.length
          : pagination.offset + imageData.length + 1
        pagination.setTotalItems(estimatedTotal)
      } else {
        // 데이터가 없는 경우
        setImages([])
        pagination.setTotalItems(0)
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

  // 모달 열기
  const openImageModal = (image: ImageRecord) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  }

  // 모달 닫기
  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  }



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

          {/* Images List - Horizontal Cards */}
          {!loading && filteredImages.length > 0 && (
            <div className="space-y-4">
              {filteredImages.map((image) => {
                const uploadDate = new Date(image.upload_time).toLocaleDateString('ko-KR')
                
                return (
                  <Card key={image.image_id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openImageModal(image)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          {/* 이미지 썸네일 */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {image.s3_paths?.gt ? (
                              <img
                                src={getImageUrl(image.s3_paths.gt)}
                                alt={image.filename}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Shield className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg text-gray-900 truncate">
                                {image.filename || '파일명 없음'}
                              </h3>
                              <Badge className="bg-green-100 text-green-800">
                                <Shield className="w-3 h-3 mr-1" />
                                보호됨
                              </Badge>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {uploadDate}
                              </div>
                              <div className="flex items-center">
                                <span className="mr-1">ID:</span>
                                <span className="font-medium text-blue-600">
                                  #{image.image_id}
                                </span>
                              </div>
                              {image.protection_algorithm && (
                                <div className="flex items-center">
                                  <span className="mr-1">알고리즘:</span>
                                  <span className="font-medium text-purple-600">
                                    {image.protection_algorithm}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="text-sm text-gray-600">
                              <span className="mr-1">저작권:</span>
                              <span className="text-blue-600">
                                {image.copyright || "저작권 정보가 설정되지 않았습니다"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 다운로드 버튼들 */}
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent"
                            onClick={async (e) => {
                              e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                              const baseName = image.filename.replace(/\.[^/.]+$/, "");
                              const downloadFilename = `${baseName}_origi.png`;
                              
                              if (!image.s3_paths?.gt) {
                                toast({
                                  title: "다운로드 실패",
                                  description: "원본 이미지 URL이 없습니다.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              try {
                                // CORS 우회를 위해 새 창에서 다운로드 시도
                                const link = document.createElement('a');
                                link.href = getDirectImageUrl(image.s3_paths.gt);
                                link.download = downloadFilename;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                
                                // 사용자 제스처 컨텍스트에서 실행되도록 즉시 클릭
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                
                                toast({
                                  title: "다운로드 시작",
                                  description: `${downloadFilename} 다운로드가 시작되었습니다.`,
                                });
                              } catch (error) {
                                console.error('다운로드 실패:', error);
                                toast({
                                  title: "다운로드 실패",
                                  description: "이미지 다운로드 중 오류가 발생했습니다.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={!image.s3_paths?.gt}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            원본
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent"
                            onClick={async (e) => {
                              e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                              const baseName = image.filename.replace(/\.[^/.]+$/, "");
                              const downloadFilename = `${baseName}_wm.png`;
                              
                              if (!image.s3_paths?.sr_h) {
                                toast({
                                  title: "다운로드 실패",
                                  description: "워터마크 이미지 URL이 없습니다.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              try {
                                // CORS 우회를 위해 새 창에서 다운로드 시도
                                const link = document.createElement('a');
                                link.href = getDirectImageUrl(image.s3_paths.sr_h);
                                link.download = downloadFilename;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                
                                // 사용자 제스처 컨텍스트에서 실행되도록 즉시 클릭
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                
                                toast({
                                  title: "다운로드 시작",
                                  description: `${downloadFilename} 다운로드가 시작되었습니다.`,
                                });
                              } catch (error) {
                                console.error('다운로드 실패:', error);
                                toast({
                                  title: "다운로드 실패",
                                  description: "이미지 다운로드 중 오류가 발생했습니다.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={!image.s3_paths?.sr_h}
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

      {/* 이미지 상세 모달 */}
      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-auto">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">이미지 상세 보기</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={closeImageModal}
                  className="p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 이미지들 */}
                <div className="space-y-4">
                  {/* 원본 이미지 */}
                  {selectedImage.s3_paths?.gt && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <Eye className="w-5 h-5 mr-2" />
                        원본 이미지
                      </h3>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={getImageUrl(selectedImage.s3_paths.gt)}
                          alt={`${selectedImage.filename} - 원본`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* 워터마크 이미지 */}
                  {selectedImage.s3_paths?.sr_h && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        워터마크 이미지
                      </h3>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={getImageUrl(selectedImage.s3_paths.sr_h)}
                          alt={`${selectedImage.filename} - 워터마크`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 이미지 정보 */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">이미지 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">파일명</label>
                        <p className="text-gray-900">{selectedImage.filename || '파일명 없음'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">이미지 ID</label>
                        <p className="text-gray-900">#{selectedImage.image_id}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">업로드 날짜</label>
                        <p className="text-gray-900">{new Date(selectedImage.upload_time).toLocaleString('ko-KR')}</p>
                      </div>

                      {selectedImage.protection_algorithm && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">보호 알고리즘</label>
                          <p className="text-purple-600 font-medium">{selectedImage.protection_algorithm}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-500">저작권 정보</label>
                        <p className="text-blue-600">{selectedImage.copyright || "저작권 정보가 설정되지 않았습니다"}</p>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Badge className="bg-green-100 text-green-800">
                          <Shield className="w-3 h-3 mr-1" />
                          보호됨
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* 다운로드 버튼들 */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">다운로드</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="bg-transparent"
                        onClick={async () => {
                          const baseName = selectedImage.filename.replace(/\.[^/.]+$/, "");
                          const downloadFilename = `${baseName}_origi.png`;
                          
                          if (!selectedImage.s3_paths?.gt) {
                            toast({
                              title: "다운로드 실패",
                              description: "원본 이미지 URL이 없습니다.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          try {
                            // CORS 우회를 위해 새 창에서 다운로드 시도
                            const link = document.createElement('a');
                            link.href = selectedImage.s3_paths.gt;
                            link.download = downloadFilename;
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            
                            // 사용자 제스처 컨텍스트에서 실행되도록 즉시 클릭
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            toast({
                              title: "다운로드 시작",
                              description: `${downloadFilename} 다운로드가 시작되었습니다.`,
                            });
                          } catch (error) {
                            console.error('다운로드 실패:', error);
                            toast({
                              title: "다운로드 실패",
                              description: "이미지 다운로드 중 오류가 발생했습니다.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!selectedImage.s3_paths?.gt}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        원본 이미지
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="bg-transparent"
                        onClick={async () => {
                          const baseName = selectedImage.filename.replace(/\.[^/.]+$/, "");
                          const downloadFilename = `${baseName}_wm.png`;
                          
                          if (!selectedImage.s3_paths?.sr_h) {
                            toast({
                              title: "다운로드 실패",
                              description: "워터마크 이미지 URL이 없습니다.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          try {
                            // CORS 우회를 위해 새 창에서 다운로드 시도
                            const link = document.createElement('a');
                            link.href = selectedImage.s3_paths.sr_h;
                            link.download = downloadFilename;
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            
                            // 사용자 제스처 컨텍스트에서 실행되도록 즉시 클릭
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            toast({
                              title: "다운로드 시작",
                              description: `${downloadFilename} 다운로드가 시작되었습니다.`,
                            });
                          } catch (error) {
                            console.error('다운로드 실패:', error);
                            toast({
                              title: "다운로드 실패",
                              description: "이미지 다운로드 중 오류가 발생했습니다.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!selectedImage.s3_paths?.sr_h}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        워터마크 이미지
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
