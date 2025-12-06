"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedTypes?: string[]
  maxSize?: number
  title?: string
  description?: string
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ["image/png"],
  maxSize = 100 * 1024 * 1024, // 10MB
  title = "파일을 여기에 드래그 앤 드롭하거나 클릭하여 업로드하세요",
  description = "지원 형식: PNG (최대 100MB)",
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        setSelectedFile(file)
        onFileSelect(file)

        // Create preview
        const reader = new FileReader()
        reader.onload = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
  })

  const removeFile = () => {
    setSelectedFile(null)
    setPreview(null)
  }

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-accent bg-accent/10" : "border-gray-300 hover:border-accent hover:bg-accent/5"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-accent" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {preview && (
            <div className="mt-4">
              <img
                src={preview || "/placeholder.png"}
                alt="Preview"
                className="max-w-full h-auto max-h-64 mx-auto rounded-lg"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
