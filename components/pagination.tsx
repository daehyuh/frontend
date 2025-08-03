"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { generatePageNumbers } from "@/hooks/usePagination"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showQuickJumper?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showQuickJumper = false,
  className
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pageNumbers = generatePageNumbers(currentPage, totalPages, 5)
  const showStartEllipsis = pageNumbers[0] > 1
  const showEndEllipsis = pageNumbers[pageNumbers.length - 1] < totalPages

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* First Page */}
      {showStartEllipsis && (
        <>
          <Button
            variant={currentPage === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(1)}
            className="h-9 w-9 p-0"
          >
            1
          </Button>
          {pageNumbers[0] > 2 && (
            <Button variant="ghost" size="sm" disabled className="h-9 w-9 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((pageNumber) => (
        <Button
          key={pageNumber}
          variant={currentPage === pageNumber ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(pageNumber)}
          className="h-9 w-9 p-0"
        >
          {pageNumber}
        </Button>
      ))}

      {/* Last Page */}
      {showEndEllipsis && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <Button variant="ghost" size="sm" disabled className="h-9 w-9 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="h-9 w-9 p-0"
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Quick Jumper */}
      {showQuickJumper && totalPages > 10 && (
        <div className="flex items-center space-x-2 ml-4">
          <span className="text-sm text-gray-600">이동:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            className="w-16 h-9 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt(e.currentTarget.value)
                if (page >= 1 && page <= totalPages) {
                  onPageChange(page)
                  e.currentTarget.value = ''
                }
              }
            }}
            placeholder={String(currentPage)}
          />
        </div>
      )}
    </div>
  )
}

// 페이지 정보 표시 컴포넌트
interface PaginationInfoProps {
  currentPage: number
  pageSize: number
  totalItems: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={cn("text-sm text-gray-600", className)}>
      <span className="font-medium">{startItem}</span>-<span className="font-medium">{endItem}</span> of{" "}
      <span className="font-medium">{totalItems}</span> 항목
    </div>
  )
}