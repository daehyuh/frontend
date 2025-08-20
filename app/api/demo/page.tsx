"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download, Shield, Search, Code, Key, Upload, CheckCircle, User, Copy, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api"
import Image from "next/image"

export default function DemoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [copyright, setCopyright] = useState("")
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("EditGuard")
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // 샘플 이미지 리스트
  const sampleImages = [
    { id: 1, name: "샘플 이미지 1", path: "/face/1.png" },
    { id: 2, name: "샘플 이미지 2", path: "/face/2.png" },
    { id: 3, name: "샘플 이미지 3", path: "/face/3.png" },
    { id: 4, name: "샘플 이미지 4", path: "/face/4.png" }
  ]

  // 알고리즘 정보
  const algorithms = {
    "EditGuard": "조작 영역 탐지 (95% 정밀도)",
    "RobustWide": "AI 편집 공격 방지 워터마크",
    "FAKEFACE": "얼굴 딥페이크 방지"
  }

  // 사용자 정보 및 인증 확인
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!apiClient.isAuthenticated()) {
          setIsAuthenticated(false)
          setIsLoadingUser(false)
          return
        }

        setIsAuthenticated(true)
        
        // 사용자 정보 로드
        const user = await apiClient.getMe()
        setUserInfo(user)
        
        // 백엔드에서 받은 API 키 사용, 없으면 데모용 키 생성
        const userApiKey = user.api_key || `ak_${user.id.toString().padStart(8, '0')}${'x'.repeat(24)}`
        setApiKey(userApiKey)
        
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoadingUser(false)
      }
    }

    checkAuthAndLoadUser()
  }, [])

  // API 키 복사
  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      toast({
        title: "복사 완료",
        description: "API 키가 클립보드에 복사되었습니다.",
      })
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "API 키 복사에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  // API 키 마스킹
  const getMaskedApiKey = (key: string) => {
    if (key.length <= 8) return key
    return `${key.slice(0, 8)}${'*'.repeat(key.length - 12)}${key.slice(-4)}`
  }

  // 워터마크 생성 및 다운로드
  const handleWatermarkDownload = async (imagePath: string) => {
    if (!apiKey) {
      toast({
        title: "API 키 필요",
        description: "API 키를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey.startsWith('ak_') || apiKey.length !== 35) {
      toast({
        title: "잘못된 API 키 형식",
        description: "API 키는 'ak_' + 32자리 문자열이어야 합니다.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    
    try {
      // 이미지 파일을 fetch로 가져오기
      const imageResponse = await fetch(imagePath)
      const imageBlob = await imageResponse.blob()
      
      // FormData 생성
      const formData = new FormData()
      const fileName = imagePath.split('/').pop() || 'sample.png'
      formData.append('file', imageBlob, fileName)
      formData.append('copyright', copyright)
      formData.append('protection_algorithm', selectedAlgorithm)

      // 워터마크 생성 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/open/generate`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `서버 오류: ${response.status}`)
      }

      const result = await response.json()
      console.log('워터마크 생성 결과:', result)

      if (result.success && result.data && result.data[0]) {
        const responseData = result.data[0]
        let watermarkUrl = null
        
        // s3_paths에서 sr_h (워터마크) URL 추출
        if (responseData.s3_paths && responseData.s3_paths.sr_h) {
          watermarkUrl = responseData.s3_paths.sr_h
        } else if (responseData.watermarked_url) {
          // 기존 필드명도 지원
          watermarkUrl = responseData.watermarked_url
        }
        
        if (watermarkUrl) {
          // 워터마크 이미지 다운로드
          const downloadResponse = await fetch(watermarkUrl)
          const downloadBlob = await downloadResponse.blob()
          
          // 파일 다운로드
          const url = window.URL.createObjectURL(downloadBlob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          const originalFileName = fileName.replace('.png', '')
          a.download = `watermarked_${selectedAlgorithm}_${originalFileName}_${Date.now()}.png`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)

          toast({
            title: "워터마크 생성 완료",
            description: `${selectedAlgorithm} 알고리즘으로 워터마크가 적용된 이미지가 다운로드되었습니다.`,
          })
        } else {
          throw new Error('워터마크 URL을 받지 못했습니다.')
        }
      } else {
        throw new Error('워터마크 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('워터마크 생성 오류:', error)
      toast({
        title: "워터마크 생성 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 이미지 검증
  const handleVerification = async () => {
    if (!verificationFile) {
      toast({
        title: "파일 선택 필요",
        description: "검증할 이미지를 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "API 키 필요",
        description: "API 키를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', verificationFile)
      formData.append('model', selectedAlgorithm)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/open/verify`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `서버 오류: ${response.status}`)
      }

      const result = await response.json()
      console.log('검증 결과:', result)

      if (result.success && result.data && result.data[0]) {
        setVerificationResult(result.data[0])
        toast({
          title: "검증 완료",
          description: `${selectedAlgorithm} 알고리즘으로 이미지 검증이 완료되었습니다.`,
        })
      } else {
        throw new Error('검증에 실패했습니다.')
      }
    } catch (error) {
      console.error('검증 오류:', error)
      toast({
        title: "검증 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 파일 검증 함수
  const validateFile = (file: File) => {
    if (!file.type.includes('png')) {
      toast({
        title: "파일 형식 오류",
        description: "PNG 파일만 업로드 가능합니다.",
        variant: "destructive",
      })
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "최대 10MB까지 업로드 가능합니다.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && validateFile(file)) {
      setVerificationFile(file)
      setVerificationResult(null) // 새 파일 선택 시 이전 결과 초기화
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    const file = files[0]
    
    if (file && validateFile(file)) {
      setVerificationFile(file)
      setVerificationResult(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              <Code className="inline-block w-8 h-8 mr-3" />
              OPEN API 데모
            </h1>
            <p className="text-xl text-gray-600 text-center">
              AEGIS Open API를 사용한 워터마크 생성 및 검증 테스트
            </p>
          </div>

          {/* 사용자 API 키 정보 */}
          {isLoadingUser ? (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="animate-pulse flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isAuthenticated && userInfo ? (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900">
                  <User className="w-5 h-5 mr-2" />
                  내 API 키 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">사용자</p>
                      <p className="font-medium text-blue-900">{userInfo.name} ({userInfo.email})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">사용자 ID</p>
                      <p className="font-mono text-blue-900">#{userInfo.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-700">API 키</p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyApiKey}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded p-3">
                      <code className="text-sm font-mono text-gray-800">
                        {showApiKey ? apiKey : getMaskedApiKey(apiKey)}
                      </code>
                    </div>
                  </div>
                  
                  <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      💡 <strong>팁:</strong> 이 API 키는 자동으로 아래 입력란에 적용됩니다. 
                      복사 버튼을 클릭하여 외부 애플리케이션에서 사용할 수 있습니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8 bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Key className="w-6 h-6 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">로그인이 필요합니다</h3>
                    <p className="text-sm text-yellow-700">
                      API 키를 확인하려면 로그인해주세요.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/login?redirect=/api/demo')}
                    className="ml-auto"
                  >
                    로그인
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API 설정 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                API 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API 키</Label>
                  <Input
                    id="apiKey"
                    placeholder="ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    형식: ak_ + 32자리 랜덤 문자열
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="algorithm">알고리즘 선택</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(algorithms).map(([key, description]) => (
                        <SelectItem key={key} value={key}>
                          {key} - {description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="copyright">저작권 정보 (선택사항)</Label>
                <Input
                  id="copyright"
                  placeholder=""
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 워터마크 생성 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  워터마크 생성
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    샘플 이미지를 선택하여 워터마크를 적용하고 다운로드하세요.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {sampleImages.map((image) => (
                      <div key={image.id} className="space-y-2">
                        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={image.path}
                            alt={image.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm font-medium text-center">{image.name}</p>
                        <Button
                          onClick={() => handleWatermarkDownload(image.path)}
                          disabled={isProcessing || !apiKey}
                          className="w-full"
                          size="sm"
                        >
                          {isProcessing ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-3 w-3" />
                          )}
                          워터마크 다운로드
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 이미지 검증 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  이미지 검증
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    워터마크가 적용된 이미지를 업로드하여 검증하세요.
                  </p>
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragOver 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`mx-auto h-12 w-12 mb-4 ${
                      isDragOver ? 'text-primary' : 'text-gray-400'
                    }`} />
                    
                    {verificationFile ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-600">
                          ✓ 선택된 파일: {verificationFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          파일 크기: {(verificationFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <label className="cursor-pointer inline-block">
                          <span className="text-sm text-blue-600 hover:text-blue-800 underline">
                            다른 파일 선택
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".png"
                            onChange={handleFileUpload}
                            disabled={isProcessing || !apiKey}
                          />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <label className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            PNG 파일을 드래그하여 놓거나 클릭하여 선택하세요
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".png"
                            onChange={handleFileUpload}
                            disabled={isProcessing || !apiKey}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">최대 10MB</p>
                      </div>
                    )}
                  </div>

                  {/* 검증 버튼 */}
                  <Button
                    onClick={handleVerification}
                    disabled={!verificationFile || isProcessing || !apiKey}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        검증 중...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        이미지 검증하기
                      </>
                    )}
                  </Button>

                </div>
              </CardContent>
            </Card>
          </div>

          {/* API 사용법 안내 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>API 사용법</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">1. 워터마크 생성</h4>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                    <div>POST /open/generate</div>
                    <div>Header: X-API-Key: {apiKey || 'your_api_key'}</div>
                    <div>Body: file, copyright, protection_algorithm</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. 이미지 검증</h4>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                    <div>POST /open/verify</div>
                    <div>Header: X-API-Key: {apiKey || 'your_api_key'}</div>
                    <div>Body: file, model</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">제한사항</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• PNG 파일만 지원 (최대 10MB)</li>
                  <li>• API 키 기반 인증 필수</li>
                  <li>• API 키 형식: ak_ + 32자리 랜덤 문자열</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}