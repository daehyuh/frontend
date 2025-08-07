"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import FileUpload from "@/components/file-upload"
import { apiClient } from "@/lib/api"

export default function ProtectPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [copyrightInfo, setCopyrightInfo] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [algorithms, setAlgorithms] = useState<string[]>([])
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // 인증 확인 및 알고리즘 목록 가져오기
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 약간의 지연을 두어 쿠키가 완전히 로드되도록 함
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!apiClient.isAuthenticated()) {
          toast({
            title: "로그인 필요",
            description: "이 서비스를 이용하려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          router.push("/login")
        } else {
          // 보호 알고리즘 목록 가져오기
          try {
            const algorithmsList = await apiClient.getProtectionAlgorithms()
            setAlgorithms(algorithmsList)
            if (algorithmsList.length > 0) {
              setSelectedAlgorithm(algorithmsList[0]) // 첫 번째 알고리즘을 기본 선택
            }
          } catch (error) {
            console.error('Failed to load algorithms:', error)
            // 기본 알고리즘 설정
            setAlgorithms(['EditGuard', 'OmniGuard', 'RobustWide'])
            setSelectedAlgorithm('EditGuard')
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router, toast])

  if (isCheckingAuth) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleProtect = async () => {
    if (!selectedFile) return

    setIsProcessing(true)

    try {
      // 이미지 업로드 (선택된 알고리즘 포함)
      await apiClient.uploadImage(copyrightInfo, selectedFile, selectedAlgorithm)
      
      toast({
        title: "업로드 성공",
        description: "이미지가 성공적으로 업로드되고 워터마크가 삽입되었습니다.",
      })

      // 업로드 완료 후 바로 my-images 페이지로 리다이렉션
      router.push('/my-images')
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorTitle = "업로드 실패";
      let errorDescription = "이미지 처리 중 오류가 발생했습니다.";
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // 백엔드에서 오는 구체적인 에러 메시지 처리
        if (message.includes('file size') || message.includes('too large') || message.includes('크기')) {
          errorTitle = "파일 크기 초과";
          errorDescription = "이미지 파일 크기가 10MB를 초과합니다. 더 작은 파일을 업로드해주세요.";
        } else if (message.includes('file format') || message.includes('invalid format') || message.includes('png')) {
          errorTitle = "파일 형식 오류";
          errorDescription = "PNG 형식의 이미지만 업로드 가능합니다.";
        } else if (message.includes('corrupted') || message.includes('damaged') || message.includes('손상')) {
          errorTitle = "파일 손상";
          errorDescription = "이미지 파일이 손상되었습니다. 다른 파일을 선택해주세요.";
        } else if (message.includes('unauthorized') || message.includes('token')) {
          errorTitle = "인증 오류";
          errorDescription = "로그인이 만료되었습니다. 다시 로그인해주세요.";
        } else if (message.includes('quota') || message.includes('limit')) {
          errorTitle = "업로드 한도 초과";
          errorDescription = "일일 업로드 한도를 초과했습니다. 내일 다시 시도해주세요.";
        } else if (message.includes('server') || message.includes('internal') || message.includes('500')) {
          errorTitle = "서버 오류";
          errorDescription = "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (message.includes('network') || message.includes('fetch')) {
          errorTitle = "네트워크 오류";
          errorDescription = "인터넷 연결을 확인하고 다시 시도해주세요.";
        } else {
          // 백엔드에서 온 원본 메시지 사용
          errorDescription = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">디지털 원본 보호</h1>
            <p className="text-xl text-gray-600">보이지 않는 워터마크로 당신의 이미지를 안전하게 보호하세요</p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-lg p-1 gap-1 bg-gray-100">
              <Link href="/protect">
                <Button
                  type="button"
                  className={`rounded-md px-6 py-2 flex items-center space-x-2 transition-colors font-medium
                    ${
                      true
                        ? 'bg-primary text-white font-bold shadow-sm' // 활성화
                        : 'bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary'
                    }
                  `}
                  style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
                  tabIndex={-1}
                  disabled
                >
                  <Shield className="h-4 w-4" />
                  <span>원본 보호</span>
                </Button>
              </Link>
              <Link href="/verify">
                <Button
                  type="button"
                  className={`rounded-md px-6 py-2 flex items-center space-x-2 transition-colors font-medium
                    bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary
                  `}
                  tabIndex={-1}
                >
                  <Search className="h-4 w-4" />
                  <span>위변조 검증</span>
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>이미지 업로드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload
                onFileSelect={handleFileSelect}
                title="보호할 이미지를 여기에 드래그 앤 드롭하거나 클릭하여 업로드하세요"
                description="지원 형식: PNG (최대 10MB)"
              />

              {/* 알고리즘 선택 토글바 */}
              <div className="space-y-3">
                <Label>보호 알고리즘 선택</Label>
                <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                  {algorithms.map((algorithm) => (
                    <Button
                      key={algorithm}
                      type="button"
                      onClick={() => setSelectedAlgorithm(algorithm)}
                      className={`flex-1 min-w-[100px] px-4 py-2 rounded-md font-medium transition-all duration-200
                        ${
                          selectedAlgorithm === algorithm
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-transparent text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm'
                        }
                      `}
                    >
                      {algorithm}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  선택한 알고리즘: <span className="font-medium text-primary">{selectedAlgorithm}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyright">이미지에 삽입할 저작권 정보를 입력하세요 (선택 사항)</Label>
                <Input
                  id="copyright"
                  placeholder="예: © 2025 홍길동. All rights reserved."
                  value={copyrightInfo}
                  onChange={(e) => setCopyrightInfo(e.target.value)}
                />
              </div>

              <Button onClick={handleProtect} disabled={!selectedFile || isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI가 워터마크를 보호하고 있습니다...
                  </>
                ) : (
                  "원본파일 보호 하기"
                )}
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  )
}
