import { useCallback, useState } from 'react'

export interface FileValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[] // mime types
  maxFiles?: number
}

export interface DragAndDropHandlers {
  isDragging: boolean
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
}

export interface FileUploadUtilityOptions extends FileValidationOptions {
  onFilesSelected: (files: File[]) => void
  onError?: (error: string) => void
}

/**
 * Validates a file against the given options
 */
export function validateFile(file: File, options: FileValidationOptions = {}): string | null {
  const { maxSize, allowedTypes } = options

  // Check file size
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return `File size exceeds ${maxSizeMB}MB limit`
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        // Handle wildcard types like 'image/*'
        const category = type.slice(0, -2)
        return file.type.startsWith(category + '/')
      }
      return file.type === type
    })

    if (!isAllowed) {
      return `File type ${file.type} is not allowed`
    }
  }

  return null
}

/**
 * Validates multiple files and returns errors for invalid ones
 */
export function validateFiles(files: File[], options: FileValidationOptions = {}): { valid: File[], errors: string[] } {
  const { maxFiles } = options
  const valid: File[] = []
  const errors: string[] = []

  // Check max files limit
  if (maxFiles && files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`)
    return { valid, errors }
  }

  files.forEach((file, index) => {
    const error = validateFile(file, options)
    if (error) {
      errors.push(`File ${index + 1}: ${error}`)
    } else {
      valid.push(file)
    }
  })

  return { valid, errors }
}

/**
 * Extracts files from various sources (File array, FileList, drag event)
 */
export function extractFilesFromSource(source: File[] | FileList | React.DragEvent): File[] {
  if (source instanceof Array) {
    return source
  }
  
  if ('dataTransfer' in source) {
    // Drag event
    return Array.from(source.dataTransfer.files)
  }
  
  // FileList from input
  return Array.from(source)
}

/**
 * Custom hook for drag and drop file handling
 */
export function useDragAndDrop(options: FileUploadUtilityOptions): DragAndDropHandlers {
  const [isDragging, setIsDragging] = useState(false)
  const { onFilesSelected, onError, ...validationOptions } = options

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = extractFilesFromSource(e)
    if (files.length === 0) return

    const { valid, errors } = validateFiles(files, validationOptions)

    if (errors.length > 0 && onError) {
      onError(errors.join(', '))
    }

    if (valid.length > 0) {
      onFilesSelected(valid)
    }
  }, [onFilesSelected, onError, validationOptions])

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}

/**
 * Handles file selection from input element
 */
export function handleFileInputChange(
  event: React.ChangeEvent<HTMLInputElement>,
  options: FileUploadUtilityOptions
) {
  const files = event.target.files
  if (!files || files.length === 0) return

  const fileArray = extractFilesFromSource(files)
  const { valid, errors } = validateFiles(fileArray, options)

  if (errors.length > 0 && options.onError) {
    options.onError(errors.join(', '))
  }

  if (valid.length > 0) {
    options.onFilesSelected(valid)
  }

  // Clear the input so the same file can be selected again
  event.target.value = ''
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Check if a file is a document
 */
export function isDocumentFile(file: File): boolean {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml'
  ]
  return docTypes.includes(file.type) || file.type.startsWith('text/')
}

/**
 * Generate a preview URL for an image file
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('File is not an image'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Common file validation presets
 */
export const FileValidationPresets = {
  // Images only, max 10MB each
  images: {
    allowedTypes: ['image/*'],
    maxSize: 10 * 1024 * 1024,
  },
  
  // Documents, max 50MB each
  documents: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/json'
    ],
    maxSize: 50 * 1024 * 1024,
  },
  
  // All files, max 100MB each
  general: {
    maxSize: 100 * 1024 * 1024,
  }
} as const