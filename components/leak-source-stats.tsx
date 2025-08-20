"use client";

import { useEffect, useState } from "react"
import { ExternalLink, TrendingUp, Clock, AlertTriangle, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, type UserReportStatsData, type UserReportDomain, type UserReportLink } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface LeakSourceStatsProps {
  className?: string;
}

export default function LeakSourceStats({ className = "" }: LeakSourceStatsProps) {
  const { toast } = useToast()
  const [statsData, setStatsData] = useState<UserReportStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'frequent' | 'recent'>('frequent')

  useEffect(() => {
    loadStatsData()
  }, [])

  const loadStatsData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getUserReportStats()
      
      console.log('사용자 제보 통계 API 응답:', response)
      
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data[0] : response.data
        console.log('처리된 제보 통계 데이터:', data)
        setStatsData(data as UserReportStatsData)
      } else {
        console.warn('제보 통계 데이터가 없습니다:', response)
      }
    } catch (error) {
      console.error('제보 통계 데이터 로드 실패:', error)
      toast({
        title: "통계 로드 실패",
        description: "제보 통계 데이터를 불러올 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 시간 포맷팅 함수
  const formatTimeAgo = (isoString: string): string => {
    const reportTime = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - reportTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays}일 전`
    } else if (diffHours > 0) {
      return `${diffHours}시간 전`
    } else {
      return "방금 전"
    }
  }

  // URL 축약 함수
  const truncateUrl = (url: string, maxLength: number = 35): string => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + '...'
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

  if (!statsData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          유출 소스 분석
        </h3>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
          <p className="text-gray-500">제보 데이터가 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          유출 소스 분석
        </h3>
        <div className="flex items-center gap-2">
          <Select value={selectedView} onValueChange={(value: 'frequent' | 'recent') => setSelectedView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frequent">최빈 도메인</SelectItem>
              <SelectItem value="recent">최신 제보</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 최빈 도메인 뷰 */}
      {selectedView === 'frequent' && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            최빈 유출 도메인 TOP 5
          </h4>
          {statsData.most_frequent_domains && statsData.most_frequent_domains.length > 0 ? (
            <div className="space-y-2">
              {statsData.most_frequent_domains.slice(0, 5).map((domain, index) => (
                <div key={domain.domain} className="flex items-center justify-between p-4 bg-red-50 rounded-lg min-h-[60px]">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{domain.domain}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-900">{domain.count}건</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">도메인 데이터가 없습니다</p>
          )}
        </div>
      )}

      {/* 최신 제보 링크 뷰 */}
      {selectedView === 'recent' && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            최신 제보 링크
          </h4>
          {statsData.recent_report_links && statsData.recent_report_links.length > 0 ? (
            <div className="space-y-2">
              {statsData.recent_report_links.slice(0, 5).map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg min-h-[60px]">
                  <div className="flex items-center flex-1 min-w-0">
                    <ExternalLink className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={report.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium truncate block"
                        title={report.link}
                      >
                        {truncateUrl(report.link)}
                      </a>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTimeAgo(report.reported_time)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">최신 제보가 없습니다</p>
          )}
        </div>
      )}
    </div>
  )
}