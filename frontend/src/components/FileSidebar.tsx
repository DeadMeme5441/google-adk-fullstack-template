import { useState, useCallback, useRef } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { 
  Files, 
  Upload, 
  Download, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Image,
  FileAudio,
  FileVideo,
  Archive,
  File,
  History,
  X,
  Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useFileOperations, type FileMetadata } from '../hooks/useFileManagement'

// Remove duplicate interface since it's imported from hooks

interface FileSidebarProps {
  sessionId: string
  isOpen: boolean
  onToggle: () => void
  className?: string
}

// File type detection helper
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
  if (mimeType.startsWith('video/')) return <FileVideo className="h-4 w-4" />
  if (mimeType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />
  if (mimeType.includes('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
    return <FileText className="h-4 w-4" />
  }
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) {
    return <Archive className="h-4 w-4" />
  }
  return <File className="h-4 w-4" />
}

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// File item component
const FileItem = ({ 
  file, 
  onDownload, 
  onDelete, 
  onShowVersions 
}: { 
  file: FileMetadata
  onDownload: (filename: string) => void
  onDelete: (filename: string) => void
  onShowVersions: (file: FileMetadata) => void
}) => {
  return (
    <div className="group p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {getFileIcon(file.mime_type)}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate" title={file.filename}>
              {file.filename}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)} • {file.version_count} version{file.version_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDownload(file.artifact_name)}
            className="h-7 w-7 p-0"
            title="Download"
          >
            <Download className="h-3 w-3" />
          </Button>
          {file.version_count > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onShowVersions(file)}
              className="h-7 w-7 p-0"
              title="Version history"
            >
              <History className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(file.artifact_name)}
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {file.namespace === 'user' && (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            User file
          </span>
        </div>
      )}
    </div>
  )
}

// Version history modal component
const VersionHistoryModal = ({ 
  file, 
  onClose, 
  onDownloadVersion 
}: { 
  file: FileMetadata | null
  onClose: () => void
  onDownloadVersion: (filename: string, version: number) => void
}) => {
  if (!file) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 max-h-96 p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Version History</h3>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-3">
          <p className="font-medium text-gray-900 dark:text-gray-50">{file.filename}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
        </div>
        <ScrollArea className="max-h-48">
          <div className="space-y-2">
            {file.versions.map((version) => (
              <div 
                key={version} 
                className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Version {version}</span>
                  {version === file.latest_version && (
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                      Latest
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDownloadVersion(file.artifact_name, version)}
                  className="h-8 px-2"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}

// Main FileSidebar component
export function FileSidebar({ sessionId, isOpen, onToggle, className }: FileSidebarProps) {
  const [versionModalFile, setVersionModalFile] = useState<FileMetadata | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Use file operations hook
  const {
    files,
    isLoading,
    uploadFile,
    downloadFile,
    deleteFile,
    isUploading,
  } = useFileOperations(sessionId)

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      // Upload each file
      droppedFiles.forEach((file) => {
        uploadFile({ file, namespace: 'session' })
      })
    }
  }, [uploadFile])

  // File action handlers
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      // Upload each file
      selectedFiles.forEach((file) => {
        uploadFile({ file, namespace: 'session' })
      })
    }
    e.target.value = '' // Reset input
  }

  const handleDownload = (artifactName: string, displayName?: string) => {
    downloadFile({ 
      artifactName, 
      filename: displayName 
    })
  }

  const handleDelete = (artifactName: string) => {
    deleteFile(artifactName)
  }

  const handleShowVersions = (file: FileMetadata) => {
    setVersionModalFile(file)
  }

  const handleDownloadVersion = (artifactName: string, version: number) => {
    downloadFile({ 
      artifactName, 
      version,
      filename: versionModalFile?.filename 
    })
    setVersionModalFile(null)
  }

  return (
    <>
      <div 
        className={cn(
          "flex transition-all duration-300 ease-in-out",
          isOpen ? "w-80" : "w-12",
          className
        )}
      >
        {/* Toggle Button */}
        <div className="flex flex-col">
          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-none border-l border-y border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isOpen ? "Hide files" : "Show files"}
          >
            {isOpen ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <Files className="h-3 w-3 absolute top-2 right-1" />
              </>
            )}
          </Button>
        </div>

        {/* Sidebar Content */}
        {isOpen && (
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 border-l border-y border-gray-200 dark:border-gray-600 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center">
                  <Files className="h-5 w-5 mr-2" />
                  Files
                </h2>
              </div>
              
              {/* Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
                  isDragging 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                onClick={handleFileSelect}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {isDragging ? 'Drop files here' : 'Upload files'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Drag & drop or click to browse
                </p>
              </div>
            </div>

            {/* File List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-500 mb-3 animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading files...</p>
                  </div>
                ) : files.length > 0 ? (
                  files.map((file) => (
                    <FileItem
                      key={file.artifact_name}
                      file={file}
                      onDownload={(artifactName) => handleDownload(artifactName, file.filename)}
                      onDelete={handleDelete}
                      onShowVersions={handleShowVersions}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Files className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No files uploaded yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Upload files to get started
                    </p>
                  </div>
                )}
                
                {/* Upload status */}
                {isUploading && (
                  <div className="text-center py-4 border-t border-gray-200 dark:border-gray-600">
                    <Loader2 className="h-6 w-6 mx-auto text-blue-600 dark:text-blue-500 mb-2 animate-spin" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Uploading files...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Version History Modal */}
      <VersionHistoryModal
        file={versionModalFile}
        onClose={() => setVersionModalFile(null)}
        onDownloadVersion={handleDownloadVersion}
      />
    </>
  )
}