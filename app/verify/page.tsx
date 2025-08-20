"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"
import FileUpload from "@/components/file-upload"
import { apiClient, type AlgorithmsResponse, type AlgorithmInfo } from "@/lib/api"
import { apiWithLoading } from "@/lib/api-with-loading"
import { useLoading } from "@/contexts/loading-context"

export default function VerifyPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [algorithms, setAlgorithms] = useState<AlgorithmsResponse>({})
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const loadingContext = useLoading()

  // API 래퍼에 로딩 컨텍스트 설정
  useEffect(() => {
    apiWithLoading.setLoadingContext(loadingContext)
  }, [loadingContext])

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
          router.push("/login?redirect=/verify")
        } else {
          // 알고리즘 목록 가져오기 (검증에서도 동일한 알고리즘 사용)
          try {
            const algorithmsData = await apiWithLoading.getAlgorithms()
            setAlgorithms(algorithmsData)
            const algorithmNames = Object.keys(algorithmsData)
            if (algorithmNames.length > 0) {
              setSelectedAlgorithm(algorithmNames[0]) // 첫 번째 알고리즘을 기본 선택
            }
          } catch (error) {
            console.error('Failed to load algorithms:', error)
            toast({
              title: "알고리즘 로드 실패",
              description: "알고리즘 목록을 가져오는데 실패했습니다. 페이지를 새로고침해주세요.",
              variant: "destructive",
            })
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

  const handleVerify = async () => {
    if (!selectedFile) return

    setIsProcessing(true)

    try {
      let validateResponse = null
      let usedAlgorithm = ""
      
      // 자동 검증: 두 알고리즘 병렬 실행
      console.log('두 알고리즘으로 동시 검증 시작 중...')
      
      const editGuardPromise = apiWithLoading.validateImage(selectedFile, 'EditGuard')
        .then(result => ({ success: true, result, algorithm: 'EditGuard' }))
        .catch(error => ({ success: false, error, algorithm: 'EditGuard' }))
      
      const robustWidePromise = apiWithLoading.validateImage(selectedFile, 'RobustWide')
        .then(result => ({ success: true, result, algorithm: 'RobustWide' }))
        .catch(error => ({ success: false, error, algorithm: 'RobustWide' }))
      
      const results = await Promise.allSettled([editGuardPromise, robustWidePromise])
      
      let editGuardResult = null
      let robustWideResult = null
      
      if (results[0].status === 'fulfilled') {
        editGuardResult = results[0].value
      }
      if (results[1].status === 'fulfilled') {
        robustWideResult = results[1].value
      }
      
      // EditGuard가 성공하면 우선 사용
      if (editGuardResult?.success) {
        validateResponse = editGuardResult.result
        usedAlgorithm = 'EditGuard'
        console.log('EditGuard 검증 성공 (자동 검증):', validateResponse)
      }
      // EditGuard 실패 시 RobustWide 사용
      else if (robustWideResult?.success) {
        validateResponse = robustWideResult.result
        usedAlgorithm = 'RobustWide'
        console.log('RobustWide 검증 성공 (자동 검증):', validateResponse)
      }
      // 둘 다 실패한 경우
      else {
        const editGuardError = editGuardResult?.error || new Error('EditGuard 알 수 없는 오류')
        console.error('두 알고리즘 모두 실패 (자동 검증):', { editGuardResult, robustWideResult })
        throw editGuardError
      }
      
      console.log(`최종 검증 성공 - 사용된 알고리즘: ${usedAlgorithm}`, validateResponse)
      
      toast({
        title: "검증 완료",
        description: `${usedAlgorithm} 알고리즘으로 자동 분석이 완료되었습니다.`,
      })

      // 백엔드에서 받은 validation_id UUID로 결과 페이지 이동
      if (validateResponse && validateResponse.validation_id) {
        // 변조가 감지된 경우에만 제보 모달 자동 열기 (로그인된 사용자에게만)
        const isDetected = validateResponse.modification_rate && validateResponse.modification_rate > 0
        console.log('검증 결과:', {
          validation_id: validateResponse.validation_id,
          modification_rate: validateResponse.modification_rate,
          usedAlgorithm,
          isDetected
        })
        
        // 로그인된 사용자이면서 변조가 감지된 경우에만 제보 모달 열기
        if (apiClient.isAuthenticated() && isDetected) {
          console.log('변조 감지됨, 제보 모달 자동 열기 플래그 저장')
          sessionStorage.setItem(`shouldOpenReport_${validateResponse.validation_id}`, 'true')
        }
        
        // 결과 페이지로 이동 - 로딩 상태는 페이지 이동까지 유지
        router.push(`/result/${validateResponse.validation_id}`)
        // setIsProcessing(false)는 의도적으로 호출하지 않음 - 페이지 이동까지 로딩 유지
      } else {
        console.error('No validation_id in response:', validateResponse)
        toast({
          title: "검증 완료",
          description: "검증은 완료되었지만 결과 페이지로 이동할 수 없습니다.",
          variant: "destructive",
        })
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Validation error:', error);
      
      let errorTitle = "검증 실패";
      let errorDescription = "이미지 검증 중 오류가 발생했습니다.";
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // 백엔드에서 오는 구체적인 에러 메시지 처리
        if (message.includes('file size') || message.includes('too large') || message.includes('크기')) {
          errorTitle = "파일 크기 초과";
          errorDescription = "이미지 파일 크기가 10MB를 초과합니다. 더 작은 파일을 업로드해주세요.";
        } else if (message.includes('file format') || message.includes('invalid format') || message.includes('png')) {
          errorTitle = "파일 형식 오류";
          errorDescription = "PNG 형식의 이미지만 검증 가능합니다.";
        } else if (message.includes('corrupted') || message.includes('damaged') || message.includes('손상')) {
          errorTitle = "파일 손상";
          errorDescription = "이미지 파일이 손상되었습니다. 다른 파일을 선택해주세요.";
        } else if (message.includes('unauthorized') || message.includes('token')) {
          errorTitle = "인증 오류";
          errorDescription = "로그인이 만료되었습니다. 다시 로그인해주세요.";
        } else if (message.includes('analysis failed') || message.includes('분석 실패')) {
          errorTitle = "분석 불가능";
          errorDescription = "이미지 분석에 실패했습니다. 다른 이미지를 시도해보세요.";
        } else if (message.includes('quota') || message.includes('limit')) {
          errorTitle = "검증 한도 초과";
          errorDescription = "일일 검증 한도를 초과했습니다. 내일 다시 시도해주세요.";
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">AI 위변조 검증</h1>
            <p className="text-xl text-gray-600">의심스러운 이미지를 업로드하여 위변조 여부를 확인하세요</p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-lg p-1 gap-1 bg-gray-100">
              <Link href="/protect">
                <Button
                  type="button"
                  className={`rounded-md px-6 py-2 flex items-center space-x-2 transition-colors font-medium
                    bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary
                  `}
                  tabIndex={-1}
                >
                  <Shield className="h-4 w-4" />
                  <span>원본 보호</span>
                </Button>
              </Link>
              <Link href="/verify">
                <Button
                  type="button"
                  className={`rounded-md px-6 py-2 flex items-center space-x-2 transition-colors font-medium
                    bg-primary text-white font-bold shadow-sm
                  `}
                  style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
                  tabIndex={-1}
                  disabled
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
                title="검증할 이미지를 여기에 드래그 앤 드롭하거나 클릭하여 업로드하세요"
                description="지원 형식: PNG (최대 10MB)"
              />

              {/* 자동 검증 */}
              <div className="space-y-3">
                <Button 
                  onClick={handleVerify} 
                  disabled={!selectedFile || isProcessing} 
                  className="w-full" 
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI가 두 알고리즘으로 자동 분석하고 있습니다...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      자동 검증 시작하기
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-600 text-center">
                  두 알고리즘(EditGuard, RobustWide)을 자동으로 찾아서 검증합니다
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">검증 과정 안내</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• AI가 이미지의 픽셀 패턴을 분석합니다</li>
              <li>• 딥페이크 및 편집 흔적을 탐지합니다</li>
              <li>• 워터마크 정보를 추출합니다</li>
              <li>• 종합적인 무결성 보고서를 생성합니다</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
