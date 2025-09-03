import { useRef, useState } from 'react'
import { Button } from './ui/button'
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { handleFileInputChange, FileValidationPresets, type FileValidationOptions } from '../lib/fileUpload'
import { useUploadFile } from '../hooks/useFileManagement'

interface FileUploadButtonProps {
  sessionId: string
  variant?: 'default' | 'outline' | 'ghost' | 'icon'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
  validationOptions?: FileValidationOptions
  onUploadSuccess?: (filename: string) => void
  onUploadError?: (error: string) => void
}

export function FileUploadButton({
  sessionId,
  variant = 'default',
  size = 'default',
  className,
  showLabel = true,
  validationOptions = FileValidationPresets.general,
  onUploadSuccess,
  onUploadError
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const { mutate: uploadFile, isPending } = useUploadFile(sessionId)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    setUploadState('idle')
    setErrorMessage('')

    uploadFile(
      { file, namespace: 'session' },
      {
        onSuccess: (data) => {
          setUploadState('success')
          onUploadSuccess?.(file.name)
          
          // Reset success state after 2 seconds
          setTimeout(() => {
            setUploadState('idle')
          }, 2000)
        },
        onError: (error) => {
          const errorMsg = error instanceof Error ? error.message : 'Upload failed'
          setUploadState('error')
          setErrorMessage(errorMsg)
          onUploadError?.(errorMsg)
          
          // Reset error state after 3 seconds
          setTimeout(() => {
            setUploadState('idle')
            setErrorMessage('')
          }, 3000)
        }
      }
    )
  }

  const handleUploadError = (error: string) => {
    setUploadState('error')
    setErrorMessage(error)
    onUploadError?.(error)
    
    // Reset error state after 3 seconds
    setTimeout(() => {
      setUploadState('idle')
      setErrorMessage('')
    }, 3000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileInputChange(e, {
      ...validationOptions,
      maxFiles: 1,
      onFilesSelected: handleFilesSelected,
      onError: handleUploadError
    })
  }

  const getIcon = () => {
    if (isPending) return <Loader2 className="h-4 w-4 animate-spin" />
    if (uploadState === 'success') return <Check className="h-4 w-4 text-green-600" />
    if (uploadState === 'error') return <AlertCircle className="h-4 w-4 text-red-600" />
    return <Upload className="h-4 w-4" />
  }

  const getButtonVariant = () => {
    if (uploadState === 'error') return 'destructive'
    return variant
  }

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />
      
      <Button
        onClick={handleButtonClick}
        disabled={isPending}
        variant={getButtonVariant()}
        size={size}
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          uploadState === 'success' && "bg-green-600 hover:bg-green-700",
          className
        )}
      >
        {getIcon()}
        {showLabel && size !== 'icon' && (
          <span className="ml-2">
            {isPending ? 'Uploading...' : 
             uploadState === 'success' ? 'Uploaded!' :
             uploadState === 'error' ? 'Error' :
             'Upload File'}
          </span>
        )}
      </Button>
      
      {/* Error message tooltip */}
      {uploadState === 'error' && errorMessage && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50">
          <div className="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700 shadow-lg">
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for chat input area
export function ChatFileUploadButton({ sessionId, className }: { sessionId: string, className?: string }) {
  return (
    <FileUploadButton
      sessionId={sessionId}
      variant="ghost"
      size="icon"
      showLabel={false}
      className={cn(
        "h-10 w-10 rounded-xl border-0",
        "hover:bg-purple-100 text-purple-600",
        "transition-all duration-200",
        className
      )}
      validationOptions={{
        ...FileValidationPresets.general,
        maxSize: 50 * 1024 * 1024, // 50MB for chat uploads
      }}
    />
  )
}

// Hero version for home page
export function HeroFileUploadButton({ 
  sessionId, 
  className,
  onUploadSuccess 
}: { 
  sessionId: string
  className?: string
  onUploadSuccess?: (filename: string) => void
}) {
  return (
    <FileUploadButton
      sessionId={sessionId}
      variant="outline"
      size="lg"
      className={cn(
        "px-8 py-4 h-auto text-base font-medium",
        "border-2 border-dashed border-purple-300",
        "hover:border-purple-500 hover:bg-purple-50",
        "bg-white/80 backdrop-blur-sm",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300",
        "rounded-2xl",
        className
      )}
      onUploadSuccess={onUploadSuccess}
      validationOptions={{
        ...FileValidationPresets.general,
        maxSize: 100 * 1024 * 1024, // 100MB for initial uploads
      }}
    />
  )
}