"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

interface UseAsyncOperationOptions {
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
}

interface UseAsyncOperationReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useAsyncOperation<T = any>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {}
): UseAsyncOperationReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    errorMessage
  } = options

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await asyncFn(...args)
        setData(result)
        
        if (showSuccessToast) {
          toast({
            title: "성공",
            description: successMessage || "작업이 완료되었습니다.",
          })
        }
        
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        
        if (showErrorToast) {
          toast({
            title: "오류",
            description: errorMessage || error.message,
            variant: "destructive",
          })
        }
        
        return null
      } finally {
        setLoading(false)
      }
    },
    [asyncFn, showSuccessToast, showErrorToast, successMessage, errorMessage, toast]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

// 특화된 훅들
export function useImageUpload() {
  return useAsyncOperation(
    async (copyright: string, file: File) => {
      const { apiClient } = await import("@/lib/api")
      return apiClient.uploadImage(copyright, file)
    },
    {
      showSuccessToast: true,
      successMessage: "이미지가 성공적으로 업로드되었습니다.",
      errorMessage: "이미지 업로드에 실패했습니다."
    }
  )
}

export function useImageValidation() {
  return useAsyncOperation(
    async (file: File) => {
      const { apiClient } = await import("@/lib/api")
      return apiClient.validateImage(file)
    },
    {
      showSuccessToast: false,
      errorMessage: "이미지 검증에 실패했습니다."
    }
  )
}

export function useDataFetch<T>(fetchFn: () => Promise<T>) {
  return useAsyncOperation(fetchFn, {
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: "데이터를 불러오는데 실패했습니다."
  })
}

// 이미지 다운로드를 위한 훅
export function useImageDownload() {
  return useAsyncOperation(
    async (url: string, filename: string) => {
      const { downloadImage } = await import("@/lib/image-utils")
      await downloadImage(url, filename)
      return true
    },
    {
      showSuccessToast: true,
      successMessage: "이미지가 다운로드되었습니다.",
      errorMessage: "이미지 다운로드에 실패했습니다."
    }
  )
}