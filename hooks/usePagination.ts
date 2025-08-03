"use client"

import { useState, useCallback, useMemo } from "react"

interface UsePaginationOptions {
  initialPage?: number
  pageSize?: number
}

interface UsePaginationReturn {
  currentPage: number
  pageSize: number
  offset: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setTotalItems: (total: number) => void
  reset: () => void
}

export function usePagination({
  initialPage = 1,
  pageSize = 12
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalItems, setTotalItems] = useState(0)

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])
  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize])
  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages])
  const hasPrevPage = useMemo(() => currentPage > 1, [currentPage])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasNextPage])

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [hasPrevPage])

  const reset = useCallback(() => {
    setCurrentPage(initialPage)
    setTotalItems(0)
  }, [initialPage])

  return {
    currentPage,
    pageSize,
    offset,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setTotalItems,
    reset
  }
}

// 페이지 번호 목록 생성 유틸리티
export function generatePageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}