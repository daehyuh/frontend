import type { Metadata } from 'next'
import ResultContent from './components/ResultContent'

interface ResultPageProps {
  params: {
    id: string
  }
  searchParams: {
    showReport?: string
  }
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  try {
    // 서버 사이드에서 직접 API 호출 (인증 없이)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/validation-record/uuid/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch validation record')
    }

    const data = await response.json()
    const record = data.data && data.data[0] ? data.data[0] : null

    if (!record) {
      throw new Error('No validation record found')
    }
    
    const isDetected = record.modification_rate && record.modification_rate > 0
    const title = `${record.input_filename} - ${isDetected ? '변조 탐지' : '원본 확인'} | AEGIS`
    const description = `${record.input_filename} 파일의 위변조 검증 결과입니다. 변조률: ${record.modification_rate ? `${record.modification_rate.toFixed(2)}%` : '0%'}, 알고리즘: ${record.validation_algorithm}`
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://aegis.gdgoc.com/result/${params.id}`,
        images: [
          {
            url: 'https://aegis.gdgoc.com/image.png',
            width: 1200,
            height: 630,
            alt: `${record.input_filename} 검증 결과`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['https://aegis.gdgoc.com/image.png'],
      },
    }
  } catch (error) {
    console.error('generateMetadata error:', error)
    // 오류 발생 시 기본 메타데이터 반환
    return {
      title: '검증 결과 | AEGIS',
      description: 'AEGIS 이미지 위변조 검증 결과를 확인하세요.',
      openGraph: {
        title: '검증 결과 | AEGIS',
        description: 'AEGIS 이미지 위변조 검증 결과를 확인하세요.',
        type: 'website',
        url: `https://aegis.gdgoc.com/result/${params.id}`,
        images: [
          {
            url: 'https://aegis.gdgoc.com/image.png',
            width: 1200,
            height: 630,
            alt: 'AEGIS 검증 결과',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: '검증 결과 | AEGIS',
        description: 'AEGIS 이미지 위변조 검증 결과를 확인하세요.',
        images: ['https://aegis.gdgoc.com/image.png'],
      },
    }
  }
}

export default function ResultPage({ params, searchParams }: ResultPageProps) {
  const showReport = searchParams.showReport === 'true'
  return <ResultContent validationId={params.id} autoOpenReport={showReport} />
}