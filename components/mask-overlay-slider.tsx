"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, AlertTriangle } from "lucide-react"

interface MaskOverlaySliderProps {
  originalImageUrl: string
  maskImageUrl: string
  modificationRate: number
  filename: string
}

const MaskOverlaySlider = forwardRef<any, MaskOverlaySliderProps>(({
  originalImageUrl,
  maskImageUrl,
  modificationRate,
  filename
}, ref) => {
  const [opacity, setOpacity] = useState([50])
  const [showMaskOnly, setShowMaskOnly] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // 이미지 요소들
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null)
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null)

  // 이미지 로드
  useEffect(() => {
    const loadImages = async () => {
      try {
        const origImg = new Image()
        origImg.crossOrigin = "anonymous"
        origImg.src = originalImageUrl
        
        const mskImg = new Image()
        mskImg.crossOrigin = "anonymous"
        mskImg.src = maskImageUrl

        await Promise.all([
          new Promise((resolve, reject) => {
            origImg.onload = resolve
            origImg.onerror = () => reject(new Error('원본 이미지 로드 실패'))
          }),
          new Promise((resolve, reject) => {
            mskImg.onload = resolve
            mskImg.onerror = () => reject(new Error('마스크 이미지 로드 실패'))
          })
        ])

        setOriginalImg(origImg)
        setMaskImg(mskImg)
        setImagesLoaded(true)
      } catch (error) {
        console.error('이미지 로드 실패:', error)
        setImageError(error instanceof Error ? error.message : '이미지 로드에 실패했습니다')
      }
    }

    loadImages()
  }, [originalImageUrl, maskImageUrl])

  // 캔버스에 이미지 그리기 (수정된 부분)
  useEffect(() => {
    if (!imagesLoaded || !originalImg || !maskImg || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기를 원본 이미지에 맞게 설정
    canvas.width = originalImg.width
    canvas.height = originalImg.height

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (showMaskOnly) {
      // 마스크만 표시 (검은 배경)
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(maskImg, 0, 0)
    } else {
      // 원본 이미지 그리기
      ctx.drawImage(originalImg, 0, 0)

      // 슬라이더 값에 따라 빨간색 마스크 오버레이
      const maskOpacity = opacity[0] / 100
      
      if (maskOpacity > 0) {
        // 임시 캔버스에서 마스크를 빨간색으로 처리
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) return

        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height

        // 마스크 이미지를 임시 캔버스에 그리기
        tempCtx.drawImage(maskImg, 0, 0)
        
        // 마스크가 있는 부분만 빨간색으로 칠하기
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        const data = imageData.data
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1] 
          const b = data[i + 2]
          
          // [수정된 부분] 흰색 픽셀(변조 영역)만 감지하도록 수정
          if (r > 200 && g > 200 && b > 200) { 
            data[i] = 255     // Red
            data[i + 1] = 0   // Green  
            data[i + 2] = 0   // Blue
            data[i + 3] = Math.floor(255 * maskOpacity * 0.7) // Alpha (투명도)
          } else {
            // 그 외의 영역(검은색 부분)은 완전히 투명하게 처리
            data[i + 3] = 0 
          }
        }
        
        tempCtx.putImageData(imageData, 0, 0)
        
        // 처리된 마스크를 메인 캔버스에 그리기
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }
  }, [opacity, originalImg, maskImg, imagesLoaded, showMaskOnly])

  const toggleMaskView = () => {
    setShowMaskOnly(!showMaskOnly)
  }

  if (imageError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>변조 영역 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">이미지를 불러올 수 없습니다</h3>
            <p className="text-gray-600 mb-4">
              파일명: {filename}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              {imageError}
            </p>
            <p className="text-xs text-gray-400">
              원본 이미지나 마스크 파일이 삭제되었거나 접근할 수 없는 상태입니다.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!imagesLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>변조 영역 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">마스크 이미지 로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isTampering = modificationRate > 1.0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {isTampering && <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />}
            <span>변조 영역 시각화</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isTampering ? "destructive" : "default"}>
              {modificationRate.toFixed(2)}% 변조
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          <p><strong>파일명:</strong> {filename}</p>
          <p><strong>분석 결과:</strong> {isTampering ? '변조 탐지됨' : '원본 확인됨'}</p>
        </div>

        {/* 이미지 표시 영역 */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto mx-auto block"
            style={{ maxHeight: '600px' }}
          />
          {!showMaskOnly && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              변조 영역: {opacity[0].toFixed(0)}%
            </div>
          )}
        </div>
        
        {/* 컨트롤 패널 */}
        <div className="space-y-4">
          {/* 슬라이더 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                {showMaskOnly ? '마스크 보기' : '변조 영역 표시 강도'}
              </label>
              <span className="text-sm text-gray-500">{opacity[0].toFixed(0)}%</span>
            </div>
            <Slider
              value={opacity}
              onValueChange={setOpacity}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMaskView}
              className="flex items-center space-x-2"
            >
              {showMaskOnly ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>원본 보기</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>마스크만</span>
                </>
              )}
            </Button>
          </div>

          {/* 안내 텍스트 */}
          <div className="text-xs text-gray-500 text-center space-y-1 pt-2 border-t">
            <p>• 슬라이더를 조작하여 변조된 영역을 확인하세요</p>
            <p>• 빨간색 영역이 AI가 탐지한 변조 부분입니다</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

MaskOverlaySlider.displayName = "MaskOverlaySlider"

export default MaskOverlaySlider