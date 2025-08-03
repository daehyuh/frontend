"use client"

import { useState, useMemo } from "react"

interface UseSearchOptions<T> {
  searchFields: (keyof T)[]
  filterFn?: (item: T, query: string) => boolean
  normalizeText?: boolean
}

interface UseSearchReturn<T> {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredItems: T[]
  clearSearch: () => void
  hasActiveSearch: boolean
}

export function useSearch<T extends Record<string, any>>(
  items: T[],
  options: UseSearchOptions<T>
): UseSearchReturn<T> {
  const [searchTerm, setSearchTerm] = useState("")
  const { searchFields, filterFn, normalizeText = true } = options

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items

    const query = normalizeText 
      ? searchTerm.trim().normalize('NFC').toLowerCase()
      : searchTerm.trim()

    return items.filter((item) => {
      // 커스텀 필터 함수가 있으면 우선 사용
      if (filterFn) {
        return filterFn(item, query)
      }

      // 기본 검색 로직
      return searchFields.some(field => {
        const fieldValue = item[field]
        if (fieldValue == null) return false

        const normalizedValue = normalizeText
          ? String(fieldValue).normalize('NFC').toLowerCase()
          : String(fieldValue)

        return normalizedValue.includes(query)
      })
    })
  }, [items, searchTerm, searchFields, filterFn, normalizeText])

  const clearSearch = () => {
    setSearchTerm("")
  }

  const hasActiveSearch = searchTerm.trim().length > 0

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    clearSearch,
    hasActiveSearch
  }
}

// 이미지 검색을 위한 특화된 훅
export function useImageSearch<T extends { filename?: string; copyright?: string; image_id?: number | string }>(
  images: T[]
): UseSearchReturn<T> {
  return useSearch(images, {
    searchFields: ['filename', 'copyright'],
    filterFn: (image, query) => {
      const filename = (image.filename || '').normalize('NFC').toLowerCase()
      const copyright = (image.copyright || '').normalize('NFC').toLowerCase()
      const imageId = String(image.image_id || '')

      const isFilenameMatch = filename.includes(query)
      const isCopyrightMatch = copyright.includes(query)
      const isIdMatch = imageId.includes(query)

      return isFilenameMatch || isCopyrightMatch || isIdMatch
    }
  })
}

// 검증 기록 검색을 위한 특화된 훅
export function useValidationSearch<T extends { input_filename?: string; uuid?: string }>(
  records: T[]
): UseSearchReturn<T> {
  return useSearch(records, {
    searchFields: ['input_filename', 'uuid'],
    filterFn: (record, query) => {
      const filename = (record.input_filename || '').normalize('NFC').toLowerCase()
      const uuid = (record.uuid || '').toLowerCase()

      return filename.includes(query) || uuid.includes(query)
    }
  })
}