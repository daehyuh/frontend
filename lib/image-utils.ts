// 백엔드 이미지 URL 처리 유틸리티

/**
 * 이미지 URL 생성 - S3 Bucket이 공개되어 있으므로 직접 접근
 */
export function getImageUrl(imagePath: string | undefined): string {
  if (!imagePath) {
    return '/placeholder.png';
  }

  // 이미 완전한 URL인 경우 그대로 반환 (S3 URL)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 백엔드 API를 통해 이미지 서빙
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  return `${API_BASE_URL}/images/${imagePath}`;
}

/**
 * 직접 S3 URL 반환 (다운로드용)
 */
export function getDirectImageUrl(imagePath: string | undefined): string {
  if (!imagePath) {
    return '';
  }

  // 이미 완전한 URL인 경우 그대로 반환
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 백엔드 API를 통해 이미지 서빙
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  return `${API_BASE_URL}/images/${imagePath}`;
}

/**
 * 이미지 다운로드 (강제 다운로드 방식)
 */
export async function downloadImage(imagePath: string, filename: string): Promise<void> {
  console.log('=== 이미지 다운로드 시작 ===');
  console.log('다운로드할 경로:', imagePath);
  console.log('저장될 파일명:', filename);
  
  try {
    // 모든 URL에 대해 강제 다운로드 링크 생성
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // 임시로 DOM에 추가하고 클릭
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('강제 다운로드 완료');
  } catch (error) {
    console.error('=== 이미지 다운로드 실패 ===');
    console.error('오류 상세:', error);
    console.error('경로:', imagePath);
    console.error('파일명:', filename);
    throw error;
  }
}