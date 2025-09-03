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
  Loader2,
  FolderOpen
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useFileOperations, type FileMetadata } from '../hooks/useFileManagement'

interface FileSidebarProps {
  sessionId: string
  isOpen: boolean
  onToggle: () => void
  className?: string
}

// File type detection helper
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 theme-primary-text" />
  if (mimeType.startsWith('video/')) return <FileVideo className="h-4 w-4 text-purple-600 dark:text-purple-400" />
  if (mimeType.startsWith('audio/')) return <FileAudio className="h-4 w-4 text-green-600 dark:text-green-400" />
  if (mimeType.includes('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
    return <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
  }
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) {
    return <Archive className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
  }
  return <File className="h-4 w-4 theme-text-muted" />
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
    <div className="group p-4 rounded-xl theme-card theme-border border theme-hover-bg transition-all duration-200 hover:shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-8 h-8 theme-bg-secondary rounded-lg flex items-center justify-center">
            {getFileIcon(file.mime_type)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium theme-text-primary truncate mb-1" title={file.filename}>
              {file.filename}
            </p>
            <div className="flex items-center space-x-2 text-xs theme-text-muted">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{file.version_count} version{file.version_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDownload(file.artifact_name)}
            className="h-8 w-8 p-0 theme-hover-bg-subtle rounded-lg transition-colors"
            title="Download file"
          >
            <Download className="h-3.5 w-3.5 theme-text-muted hover:theme-text-primary" />
          </Button>
          {file.version_count > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onShowVersions(file)}
              className="h-8 w-8 p-0 theme-hover-bg-subtle rounded-lg transition-colors"
              title="View version history"
            >
              <History className="h-3.5 w-3.5 theme-text-muted hover:theme-text-primary" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(file.artifact_name)}
            className="h-8 w-8 p-0 theme-hover-bg-subtle rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            title="Delete file"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {file.namespace === 'user' && (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-96 theme-card theme-border border theme-shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold theme-text-primary">Version History</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onClose} 
              className="h-8 w-8 p-0 theme-hover-bg-subtle rounded-lg"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-4 p-3 theme-bg-secondary rounded-lg">
            <p className="font-medium theme-text-primary text-sm mb-1">{file.filename}</p>
            <p className="text-xs theme-text-muted">{formatFileSize(file.size)}</p>
          </div>
          
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {file.versions.map((version) => (
                <div 
                  key={version} 
                  className="flex items-center justify-between p-3 rounded-lg theme-border border theme-hover-bg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 theme-bg-secondary rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium theme-text-primary">{version}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium theme-text-primary">Version {version}</span>
                      {version === file.latest_version && (
                        <span className="ml-2 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDownloadVersion(file.artifact_name, version)}
                    className="h-8 px-3 theme-hover-bg-subtle rounded-lg transition-colors"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Download</span>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
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
            className="h-12 w-12 rounded-none theme-border border-l border-y theme-hover-bg-subtle transition-colors"
            title={isOpen ? "Hide files" : "Show files"}
          >
            {isOpen ? (
              <ChevronRight className="h-4 w-4 theme-text-primary" />
            ) : (
              <div className="relative">
                <ChevronLeft className="h-4 w-4 theme-text-primary" />
                <Files className="h-3 w-3 absolute -top-1 -right-1 theme-primary-text" />
              </div>
            )}
          </Button>
        </div>

        {/* Sidebar Content */}
        {isOpen && (
          <div className="flex-1 theme-bg-secondary theme-border border-l border-y flex flex-col">
            {/* Header */}
            <div className="p-4 theme-border border-b theme-bg-primary">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 theme-primary-button rounded-xl flex items-center justify-center shadow-sm">
                  <Files className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold theme-text-primary">File Manager</h2>
                  <p className="text-xs theme-text-muted">Upload & manage files</p>
                </div>
              </div>
              
              {/* Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
                  isDragging 
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 scale-[1.02]" 
                    : "theme-border hover:border-blue-300 dark:hover:border-blue-600 theme-hover-bg-subtle"
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
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors",
                  isDragging ? "bg-blue-500 text-white" : "theme-bg-secondary theme-text-muted"
                )}>
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium theme-text-primary mb-1">
                  {isDragging ? 'Drop files here' : 'Upload files'}
                </p>
                <p className="text-xs theme-text-muted">
                  Drag & drop or click to browse
                </p>
              </div>
            </div>

            {/* File List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 theme-bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4 theme-shadow">
                      <Loader2 className="h-8 w-8 theme-primary-text animate-spin" />
                    </div>
                    <p className="text-sm font-medium theme-text-primary mb-1">Loading files...</p>
                    <p className="text-xs theme-text-muted">Please wait a moment</p>
                  </div>
                ) : files.length > 0 ? (
                  <>
                    <div className="flex items-center space-x-2 mb-4">
                      <FolderOpen className="h-4 w-4 theme-primary-text" />
                      <span className="text-xs font-medium theme-text-muted uppercase tracking-wider">
                        {files.length} file{files.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {files.map((file) => (
                      <FileItem
                        key={file.artifact_name}
                        file={file}
                        onDownload={(artifactName) => handleDownload(artifactName, file.filename)}
                        onDelete={handleDelete}
                        onShowVersions={handleShowVersions}
                      />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 theme-bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4 theme-shadow">
                      <Files className="h-8 w-8 theme-text-muted" />
                    </div>
                    <h3 className="text-sm font-medium theme-text-primary mb-2">No files yet</h3>
                    <p className="text-xs theme-text-muted leading-relaxed">
                      Upload files to share with the AI assistant
                    </p>
                  </div>
                )}
                
                {/* Upload status */}
                {isUploading && (
                  <div className="text-center py-6 theme-border border-t">
                    <div className="w-12 h-12 theme-bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Loader2 className="h-6 w-6 theme-primary-text animate-spin" />
                    </div>
                    <p className="text-sm font-medium theme-text-primary mb-1">Uploading files...</p>
                    <p className="text-xs theme-text-muted">Please wait while we process your files</p>
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