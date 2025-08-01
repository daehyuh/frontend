"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, Search, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
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

  // 인증 상태 확인 및 이미지 로드
  useEffect(() => {
    const checkAuthAndLoadImages = async () => {
      try {
        // 약간의 지연을 두어 쿠키가 완전히 로드되도록 함
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

        // 이미지 목록 로드
        await loadImages()
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuthAndLoadImages()
  }, [router, toast])

  const loadImages = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getUserImages()
      if (response.success && response.data) {
        setImages(response.data)
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

  if (isCheckingAuth) return null;

  const filteredImages = images.filter((image) => {
    if (!searchTerm.trim()) return true;
    
    const searchTerm_normalized = searchTerm.trim();
    const filename = image.filename || '';
    const copyright = image.copyright || '';
    
    // 여러 방법으로 검색 시도
    const searchPatterns = [
      searchTerm_normalized.toLowerCase(),
      searchTerm_normalized.toUpperCase(),
      searchTerm_normalized,
    ];
    
    const targetTexts = [
      filename.toLowerCase(),
      filename.toUpperCase(), 
      filename,
      copyright.toLowerCase(),
      copyright.toUpperCase(),
      copyright,
    ];
    
    // 패턴 중 하나라도 매칭되면 true
    const isMatch = searchPatterns.some(pattern => 
      targetTexts.some(text => text.includes(pattern))
    );
    
    // 디버깅용 로그 (한글 검색 테스트용)
    if (searchTerm_normalized.length > 0) {
      console.log('검색어:', searchTerm_normalized);
      console.log('파일명:', filename);
      console.log('저작권:', copyright);
      console.log('매칭 결과:', isMatch);
    }
    
    return isMatch;
  })


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
                  placeholder="파일명 또는 저작권 정보로 검색..."
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

          {/* Search Results Summary */}
          {!loading && images.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                {searchTerm.trim() ? (
                  <>검색 결과: <span className="font-semibold">{filteredImages.length}</span>개 (전체 {images.length}개 중)</>
                ) : (
                  <>전체 <span className="font-semibold">{images.length}</span>개의 이미지</>
                )}
              </p>
              {searchTerm.trim() && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  검색 초기화
                </button>
              )}
            </div>
          )}

          {/* Images Grid */}
          {!loading && filteredImages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          <h3 className="font-medium text-gray-900 truncate">{image.filename || '파일명 없음'}</h3>
                          <p className="text-sm text-gray-500">
                            {uploadDate}
                          </p>
                        </div>
                        
                        {/* 카피라이트 정보 강조 표시 */}
                        {image.copyright && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-blue-800 mb-1">저작권 정보</p>
                                <p className="text-sm text-blue-700 break-words">{image.copyright}</p>
                              </div>
                            </div>
                          </div>
                        )}

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
