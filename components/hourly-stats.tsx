"use client";

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Shield, Search, Clock, Calendar, Activity } from "lucide-react"
import { apiClient, type ValidationRawData, type ValidationDataItem } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface HourlyStatsProps {
  className?: string;
}

interface ProcessedStats {
  totalValidations: number;
  totalTampered: number;
  chartData: Array<{
    label: string;        // 시간/날짜 라벨
    validations: number;  // 총 검증 수
    tampered: number;     // 위변조 탐지 수
  }>;
}

export default function HourlyStats({ className = "" }: HourlyStatsProps) {
  const { toast } = useToast()
  const [rawData, setRawData] = useState<ValidationRawData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'1day' | '7days' | '30days' | 'all'>('1day')
  const [loading, setLoading] = useState(true)
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // UTC 시간을 로컬 시간으로 변환하는 함수
  const parseToLocalDate = (utcTimeString: string): Date => {
    // UTC 시간 문자열을 파싱
    const utcDate = new Date(utcTimeString)
    // 한국 시간대(KST, UTC+9)로 변환
    return new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
  }

  // Smooth curve helper function
  const createSmoothPath = (points: Array<{x: number, y: number}>) => {
    if (points.length < 2) return ''
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      
      if (i === 1) {
        // First curve
        const next = points[i + 1] || curr
        const cp1x = prev.x + (curr.x - prev.x) * 0.3
        const cp1y = prev.y
        const cp2x = curr.x - (next.x - curr.x) * 0.3
        const cp2y = curr.y
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
      } else if (i === points.length - 1) {
        // Last curve
        const cp1x = prev.x + (curr.x - prev.x) * 0.3
        const cp1y = prev.y
        const cp2x = curr.x - (curr.x - prev.x) * 0.3
        const cp2y = curr.y
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
      } else {
        // Middle curves
        const next = points[i + 1]
        const cp1x = prev.x + (curr.x - prev.x) * 0.5
        const cp1y = prev.y + (curr.y - prev.y) * 0.3
        const cp2x = curr.x - (next.x - curr.x) * 0.3
        const cp2y = curr.y
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
      }
    }
    
    return path
  }

  useEffect(() => {
    loadValidationData()
  }, [selectedPeriod])

  const loadValidationData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getValidationRawData(selectedPeriod)
      
      console.log('원시 데이터 API 응답:', response)
      
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data[0] : response.data
        console.log('처리된 원시 데이터:', data)
        setRawData(data as ValidationRawData)
      } else {
        console.warn('원시 데이터가 없습니다:', response)
      }
    } catch (error) {
      console.error('원시 데이터 로드 실패:', error)
      toast({
        title: "통계 로드 실패",
        description: "검증 데이터를 불러올 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (value: '1day' | '7days' | '30days' | 'all') => {
    setSelectedPeriod(value)
  }

  // 원시 데이터를 처리하여 시각화용 데이터로 변환
  const processData = (): ProcessedStats => {
    if (!rawData || !rawData.validations) {
      return {
        totalValidations: 0,
        totalTampered: 0,
        chartData: []
      }
    }

    const validations = rawData.validations
    const totalValidations = validations.length
    const totalTampered = validations.filter(v => v.is_tampered).length

    let chartData: Array<{ label: string; validations: number; tampered: number }> = []

    if (selectedPeriod === '1day') {
      // 1일: 시간대별 (0-23시)
      const hourlyMap = new Map<number, { validations: number; tampered: number }>()
      
      // 0-23시 초기화
      for (let hour = 0; hour < 24; hour++) {
        hourlyMap.set(hour, { validations: 0, tampered: 0 })
      }

      // 검증 데이터를 시간대별로 분류
      validations.forEach(validation => {
        const localDate = parseToLocalDate(validation.validation_time)
        const hour = localDate.getHours()
        
        const current = hourlyMap.get(hour) || { validations: 0, tampered: 0 }
        current.validations += 1
        if (validation.is_tampered) {
          current.tampered += 1
        }
        hourlyMap.set(hour, current)
      })

      chartData = Array.from({ length: 24 }, (_, hour) => ({
        label: `${hour}시`,
        validations: hourlyMap.get(hour)?.validations || 0,
        tampered: hourlyMap.get(hour)?.tampered || 0
      }))

    } else if (selectedPeriod === '7days') {
      // 7일: 일별
      const dailyMap = new Map<string, { validations: number; tampered: number }>()
      
      // 최근 7일 초기화
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        dailyMap.set(dateStr, { validations: 0, tampered: 0 })
      }

      validations.forEach(validation => {
        const localDate = parseToLocalDate(validation.validation_time)
        const dateStr = localDate.toISOString().split('T')[0]
        
        const current = dailyMap.get(dateStr) || { validations: 0, tampered: 0 }
        current.validations += 1
        if (validation.is_tampered) {
          current.tampered += 1
        }
        dailyMap.set(dateStr, current)
      })

      chartData = Array.from(dailyMap.entries()).map(([date, data]) => ({
        label: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        validations: data.validations,
        tampered: data.tampered
      })).sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())

    } else if (selectedPeriod === '30days') {
      // 30일: 주별 (4-5주)
      const weeklyMap = new Map<string, { validations: number; tampered: number }>()
      
      validations.forEach(validation => {
        const localDate = parseToLocalDate(validation.validation_time)
        const weekStart = new Date(localDate)
        weekStart.setDate(localDate.getDate() - localDate.getDay()) // 주 시작 (일요일)
        const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
        
        const current = weeklyMap.get(weekLabel) || { validations: 0, tampered: 0 }
        current.validations += 1
        if (validation.is_tampered) {
          current.tampered += 1
        }
        weeklyMap.set(weekLabel, current)
      })

      chartData = Array.from(weeklyMap.entries()).map(([week, data]) => ({
        label: `${week}주`,
        validations: data.validations,
        tampered: data.tampered
      })).sort()

    } else { // 'all'
      // 전체: 월별
      const monthlyMap = new Map<string, { validations: number; tampered: number }>()
      
      validations.forEach(validation => {
        const localDate = parseToLocalDate(validation.validation_time)
        const monthLabel = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}`
        
        const current = monthlyMap.get(monthLabel) || { validations: 0, tampered: 0 }
        current.validations += 1
        if (validation.is_tampered) {
          current.tampered += 1
        }
        monthlyMap.set(monthLabel, current)
      })

      chartData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        label: new Date(month + '-01').toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }),
        validations: data.validations,
        tampered: data.tampered
      })).sort()
    }

    return {
      totalValidations,
      totalTampered,
      chartData
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const stats = processData()

  if (stats.totalValidations === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          시간별 검증 통계
        </h3>
        <div className="text-center py-8">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
          <p className="text-gray-500">선택한 기간에 검증 데이터가 없습니다</p>
        </div>
      </div>
    )
  }

  const maxValidations = Math.max(...stats.chartData.map(d => d.validations), 1)
  const maxTampered = Math.max(...stats.chartData.map(d => d.tampered), 1)

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '1day': return '1일'
      case '7days': return '7일'
      case '30days': return '30일'
      case 'all': return '전체'
      default: return '7일'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          시간별 검증 통계
        </h3>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">1일</SelectItem>
              <SelectItem value="7days">7일</SelectItem>
              <SelectItem value="30days">30일</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">{stats.totalValidations}</div>
          <div className="text-sm text-blue-600 font-medium">총 검증</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-900">{stats.totalTampered}</div>
          <div className="text-sm text-red-600 font-medium">위변조 탐지</div>
        </div>
      </div>

      {/* 듀얼 라인 차트 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            {selectedPeriod === '1day' ? '시간대별' : 
             selectedPeriod === '7days' ? '일별' :
             selectedPeriod === '30days' ? '주별' : '월별'} 검증 추이
          </h4>
          <div className="text-xs text-gray-500">
            {getPeriodLabel(selectedPeriod)}간 데이터
          </div>
        </div>
        
        {/* 차트 영역 */}
        <div className="relative h-48 bg-gray-50 rounded-lg p-4" ref={chartRef}>
          {/* Y축 라벨 */}
          <div className="absolute left-0 top-4 bottom-6 flex flex-col justify-between text-xs text-gray-500">
            <span>{maxValidations}</span>
            <span>{Math.floor(maxValidations / 2)}</span>
            <span>0</span>
          </div>
          
          {/* 차트 본체 */}
          <div className="ml-8 h-full relative">
            <svg className="w-full h-full" viewBox="0 0 120 80" preserveAspectRatio="none">
              {/* 격자 라인 */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="120" height="80" fill="url(#grid)" />
              
              {stats.chartData.length > 1 && (
                <>
                  {/* 총 검증 smooth curve */}
                  <path
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={createSmoothPath(stats.chartData.map((d, i) => ({
                      x: 10 + (i / (stats.chartData.length - 1)) * 100,
                      y: 70 - (d.validations / maxValidations) * 60
                    })))}
                  />
                  
                  {/* 위변조 탐지 smooth curve */}
                  <path
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={createSmoothPath(stats.chartData.map((d, i) => ({
                      x: 10 + (i / (stats.chartData.length - 1)) * 100,
                      y: 70 - (d.tampered / maxValidations) * 60
                    })))}
                  />
                </>
              )}
              
              {/* 데이터 포인트 - 총 검증 */}
              {stats.chartData.map((d, i) => d.validations > 0 && (
                <circle
                  key={`validation-${i}`}
                  cx={`${10 + (i / (stats.chartData.length - 1)) * 100}`}
                  cy={`${70 - (d.validations / maxValidations) * 60}`}
                  r="2"
                  fill="#3B82F6"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const chartRect = chartRef.current?.getBoundingClientRect()
                    if (chartRect) {
                      setHoveredPoint({
                        index: i,
                        x: rect.left - chartRect.left + rect.width / 2,
                        y: rect.top - chartRect.top
                      })
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
              
              {/* 데이터 포인트 - 위변조 탐지 */}
              {stats.chartData.map((d, i) => d.tampered > 0 && (
                <circle
                  key={`tampered-${i}`}
                  cx={`${10 + (i / (stats.chartData.length - 1)) * 100}`}
                  cy={`${70 - (d.tampered / maxValidations) * 60}`}
                  r="2"
                  fill="#EF4444"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const chartRect = chartRef.current?.getBoundingClientRect()
                    if (chartRect) {
                      setHoveredPoint({
                        index: i,
                        x: rect.left - chartRect.left + rect.width / 2,
                        y: rect.top - chartRect.top
                      })
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>
            
            {/* 호버 툴팁 */}
            {hoveredPoint !== null && stats.chartData[hoveredPoint.index] && (
              <div
                className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none z-10 shadow-lg"
                style={{
                  left: `${hoveredPoint.x}px`,
                  top: `${hoveredPoint.y - 10}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="text-center">
                  <div className="font-medium mb-1">{stats.chartData[hoveredPoint.index].label}</div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      <span>총 검증: {stats.chartData[hoveredPoint.index].validations}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                      <span>위변조: {stats.chartData[hoveredPoint.index].tampered}</span>
                    </div>
                  </div>
                </div>
                {/* 툴팁 화살표 */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* X축 라벨 */}
          <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500 mt-2">
            {stats.chartData.length > 0 && (
              <>
                <span>{stats.chartData[0].label}</span>
                {stats.chartData.length > 2 && (
                  <span>{stats.chartData[Math.floor(stats.chartData.length / 2)].label}</span>
                )}
                <span>{stats.chartData[stats.chartData.length - 1].label}</span>
              </>
            )}
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-blue-500 rounded mr-2"></div>
            <span className="text-gray-700">총 검증</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-red-500 rounded mr-2"></div>
            <span className="text-gray-700">위변조 탐지</span>
          </div>
        </div>
      </div>
    </div>
  )
}