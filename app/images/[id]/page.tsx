'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { getImageUrl, downloadImage } from '@/lib/image-utils';

interface ImageDetail {
  image_id: number;
  filename: string;
  copyright: string;
  upload_time: string;
  s3_paths: {
    gt: string;
    lr: string;
    sr: string;
    sr_h: string;
  };
}

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [imageDetail, setImageDetail] = useState<ImageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchImageDetail();
  }, [params.id]);

  const fetchImageDetail = async () => {
    try {
      setLoading(true);
      const imageId = parseInt(params.id as string);
      const response = await apiClient.getImageDetail(imageId);
      setImageDetail(response);
    } catch (error: any) {
      console.error('이미지 상세 정보 조회 실패:', error);
      toast({
        title: "오류",
        description: "이미지 정보를 불러올 수 없습니다.",
        variant: "destructive",
      });
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">이미지 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!imageDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">이미지를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로 가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">이미지 상세 정보</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 이미지 정보 */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">이미지 정보</h3>
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-700">ID:</span> {imageDetail.image_id}</p>
                  <p><span className="font-medium text-gray-700">파일명:</span> {imageDetail.filename}</p>
                  <p><span className="font-medium text-gray-700">저작권:</span> {imageDetail.copyright || '없음'}</p>
                  <p><span className="font-medium text-gray-700">업로드 시간:</span> {new Date(imageDetail.upload_time).toLocaleString('ko-KR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 이미지 미리보기 */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* GT (Ground Truth) 이미지 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">GT (Ground Truth) 이미지</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {imageDetail.s3_paths.gt ? (
                    <div className="relative">
                      <Image
                        src={getImageUrl(imageDetail.s3_paths.gt)}
                        alt="GT 이미지"
                        width={500}
                        height={400}
                        className="w-full h-auto object-contain"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleDownload(imageDetail.s3_paths.gt, `gt_${imageDetail.filename}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                          title="GT 이미지 다운로드"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">GT 이미지를 불러올 수 없습니다</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(imageDetail.s3_paths.gt, `gt_${imageDetail.filename}`)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  disabled={!imageDetail.s3_paths.gt}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  GT 이미지 다운로드
                </button>
              </div>

              {/* SR_H (Super Resolution High) 이미지 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">SR_H (워터마크) 이미지</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {imageDetail.s3_paths.sr_h ? (
                    <div className="relative">
                      <Image
                        src={getImageUrl(imageDetail.s3_paths.sr_h)}
                        alt="SR_H 이미지"
                        width={500}
                        height={400}
                        className="w-full h-auto object-contain"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleDownload(imageDetail.s3_paths.sr_h, `sr_h_${imageDetail.filename}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                          title="SR_H 이미지 다운로드"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">SR_H 이미지를 불러올 수 없습니다</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(imageDetail.s3_paths.sr_h, `sr_h_${imageDetail.filename}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  disabled={!imageDetail.s3_paths.sr_h}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  SR_H 이미지 다운로드
                </button>
              </div>
            </div>

            {/* 추가 이미지들 (LR, SR) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* LR (Low Resolution) 이미지 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">LR (저해상도) 이미지</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {imageDetail.s3_paths.lr ? (
                    <div className="relative">
                      <Image
                        src={getImageUrl(imageDetail.s3_paths.lr)}
                        alt="LR 이미지"
                        width={500}
                        height={400}
                        className="w-full h-auto object-contain"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleDownload(imageDetail.s3_paths.lr, `lr_${imageDetail.filename}`)}
                          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-colors"
                          title="LR 이미지 다운로드"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">LR 이미지를 불러올 수 없습니다</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(imageDetail.s3_paths.lr, `lr_${imageDetail.filename}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  disabled={!imageDetail.s3_paths.lr}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  LR 이미지 다운로드
                </button>
              </div>

              {/* SR (Super Resolution) 이미지 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">SR (복원) 이미지</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {imageDetail.s3_paths.sr ? (
                    <div className="relative">
                      <Image
                        src={getImageUrl(imageDetail.s3_paths.sr)}
                        alt="SR 이미지"
                        width={500}
                        height={400}
                        className="w-full h-auto object-contain"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleDownload(imageDetail.s3_paths.sr, `sr_${imageDetail.filename}`)}
                          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-colors"
                          title="SR 이미지 다운로드"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">SR 이미지를 불러올 수 없습니다</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(imageDetail.s3_paths.sr, `sr_${imageDetail.filename}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  disabled={!imageDetail.s3_paths.sr}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  SR 이미지 다운로드
                </button>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/my-images')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                내 이미지 목록
              </button>
              <button
                onClick={() => router.push('/protect')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                새 이미지 업로드
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}