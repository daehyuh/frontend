// 백엔드 이미지 URL 처리 유틸리티

/**
 * 백엔드에서 직접 이미지를 서빙하는 URL 생성
 */
export function getImageUrl(imagePath: string | undefined): string {
  if (!imagePath) {
    return '/placeholder.png';
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
 * 백엔드에서 직접 이미지 다운로드
 */
export async function downloadImage(imagePath: string, filename: string): Promise<void> {
  try {
    const imageUrl = getImageUrl(imagePath);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error('다운로드 실패');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('이미지 다운로드 실패:', error);
    throw error;
  }
}