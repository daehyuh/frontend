'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, X } from 'lucide-react';
import { apiClient, UserReportRequest } from '@/lib/api';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationUuid: string;
  onReportSubmitted?: () => void;
}

export default function ReportModal({ 
  isOpen, 
  onClose, 
  validationUuid,
  onReportSubmitted 
}: ReportModalProps) {
  const [reportLink, setReportLink] = useState('');
  const [reportText, setReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 기존 제보 데이터 불러오기
  const loadExistingReport = async () => {
    if (!isOpen || !validationUuid) return;
    
    setIsLoading(true);
    try {
      const validationRecord = await apiClient.getValidationRecordByUuid(validationUuid);
      
      // 기존 제보 데이터가 있으면 폼에 설정
      if (validationRecord.user_report_link) {
        setReportLink(validationRecord.user_report_link);
      }
      if (validationRecord.user_report_text) {
        setReportText(validationRecord.user_report_text);
      }
    } catch (error) {
      console.error('기존 제보 데이터 로드 실패:', error);
      // 에러가 발생해도 모달은 정상적으로 열어야 함
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 열릴 때 기존 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadExistingReport();
    }
  }, [isOpen, validationUuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reportLink && reportLink.length > 2000) {
      toast.error('발견 경로는 2000자를 초과할 수 없습니다.');
      return;
    }

    if (reportText && reportText.length > 10000) {
      toast.error('제보 내용은 10000자를 초과할 수 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: UserReportRequest = {
        validation_uuid: validationUuid,
        report_link: reportLink.trim() || '',
        report_text: reportText.trim() || '',
      };

      await apiClient.updateUserReport(reportData);
      
      toast.success('제보가 성공적으로 접수되었습니다.');
      
      // 폼 초기화
      setReportLink('');
      setReportText('');
      
      // 콜백 실행
      if (onReportSubmitted) {
        onReportSubmitted();
      }
      
      // 모달 닫기
      onClose();
    } catch (error) {
      console.error('제보 제출 실패:', error);
      toast.error(error instanceof Error ? error.message : '제보 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isLoading) return;
    
    // 모달이 닫힐 때만 폼 초기화 (제출 성공 시에는 이미 초기화됨)
    setReportLink('');
    setReportText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>위변조 이미지 제보</DialogTitle>
          </div>
          <DialogDescription>
            검증이 완료된 이미지에 대해 추가 정보를 제보할 수 있습니다. <br></br>
            변조된 이미지의 발견 경로나 추가 정보를 입력해주세요.<br></br>
            제보해주신 정보는 원작자에게 전달됩니다.<br></br>
            <span className="text-sm text-gray-500">※ 내용을 입력하지 않아도 제출 가능합니다.</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">기존 제보 데이터를 불러오는 중...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 기존 제보 데이터가 있을 때 알림 */}
            {(reportLink || reportText) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-medium">
                  📝 기존에 제출된 제보 내용이 표시되었습니다.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  내용을 수정한 후 다시 제출하거나, 그대로 두고 취소할 수 있습니다.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="report-link">
                발견 경로 (선택)
                <span className="text-sm text-gray-500 ml-2">
                  최대 2,000자
                </span>
              </Label>
              <Input
                id="report-link"
                type="url"
                placeholder="https://example.com/image-source"
                value={reportLink}
                onChange={(e) => setReportLink(e.target.value)}
                maxLength={2000}
                disabled={isSubmitting}
              />
            <p className="text-xs text-gray-500">
              이미지를 발견한 웹사이트, SNS, 게시글 등의 URL을 입력해주세요.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-text">
              제보 내용 (선택)
              <span className="text-sm text-gray-500 ml-2">
                최대 10,000자
              </span>
            </Label>
            <Textarea
              id="report-text"
              placeholder="이미지의 변조 내용, 발견 경위, 추가 정보 등을 자세히 작성해주세요."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              maxLength={10000}
              rows={6}
              disabled={isSubmitting}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>변조 흔적, 원본과의 차이점, 발견 경위 등을 작성해주세요.</span>
              <span>{reportText.length}/10,000</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '제출 중...' : '제보하기'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}