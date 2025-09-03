import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/auth'
import { 
  artifactsUploadFile,
  artifactsGetArtifactsMetadata,
  artifactsDownloadArtifact,
  deleteArtifact
} from '../client'

// File management types
export interface FileMetadata {
  filename: string
  artifact_name: string
  namespace: 'session' | 'user'
  mime_type: string
  size: number
  version_count: number
  latest_version: number
  versions: number[]
}

export interface UploadFileRequest {
  file: File
  namespace?: 'session' | 'user'
  custom_filename?: string
}

// Create authenticated options
function createAuthOptions(token?: string) {
  return {
    ...(token && { 
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }
}

// Hook for getting artifacts metadata
export function useArtifactsMetadata(sessionId: string) {
  const { user, token } = useAuth()
  const appName = 'default' // TODO: Get from config
  
  return useQuery({
    queryKey: ['artifactsMetadata', sessionId, user?.id],
    queryFn: () => {
      if (!user?.id || !token) {
        throw new Error('User not authenticated')
      }
      return artifactsGetArtifactsMetadata({
        path: {
          app_name: appName,
          user_id: user.id,
          session_id: sessionId,
        },
        ...createAuthOptions(token)
      })
    },
    enabled: !!user?.id && !!token && !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Hook for uploading files
export function useUploadFile(sessionId: string) {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const appName = 'default' // TODO: Get from config

  return useMutation({
    mutationFn: ({ file, namespace = 'session', custom_filename }: UploadFileRequest) => {
      if (!user?.id || !token) {
        throw new Error('User not authenticated')
      }
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('namespace', namespace)
      if (custom_filename) {
        formData.append('custom_filename', custom_filename)
      }
      
      return artifactsUploadFile({
        path: {
          app_name: appName,
          user_id: user.id,
          session_id: sessionId,
        },
        body: {
          file,
          namespace,
          custom_filename
        },
        ...createAuthOptions(token)
      })
    },
    onSuccess: () => {
      // Invalidate artifacts metadata query to refresh file list
      queryClient.invalidateQueries({
        queryKey: ['artifactsMetadata'],
      })
    },
  })
}

// Hook for downloading files
export function useDownloadFile(sessionId: string) {
  const { user, token } = useAuth()
  const appName = 'default' // TODO: Get from config

  return useMutation({
    mutationFn: async ({ 
      artifactName, 
      version
    }: { 
      artifactName: string
      version?: number
      filename?: string
    }) => {
      if (!user?.id || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await artifactsDownloadArtifact({
        path: {
          app_name: appName,
          user_id: user.id,
          session_id: sessionId,
          artifact_name: artifactName,
        },
        ...(version && { query: { version } }),
        ...createAuthOptions(token)
      })
      
      return response as unknown as Blob
    },
    onSuccess: async (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Determine filename
      let { filename } = variables
      if (filename && filename.startsWith('user:')) {
        filename = filename.substring(5)
      }
      
      link.download = filename || variables.artifactName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}

// Hook for deleting files
export function useDeleteFile(sessionId: string) {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const appName = 'default' // TODO: Get from config

  return useMutation({
    mutationFn: (artifactName: string) => {
      if (!user?.id || !token) {
        throw new Error('User not authenticated')
      }
      return deleteArtifact({
        path: {
          app_name: appName,
          user_id: user.id,
          session_id: sessionId,
          artifact_name: artifactName,
        },
        ...createAuthOptions(token)
      })
    },
    onSuccess: () => {
      // Invalidate artifacts metadata query to refresh file list
      queryClient.invalidateQueries({
        queryKey: ['artifactsMetadata'],
      })
    },
  })
}

// Combined hook for all file operations
export function useFileOperations(sessionId: string) {
  const artifactsQuery = useArtifactsMetadata(sessionId)
  const uploadMutation = useUploadFile(sessionId)
  const downloadMutation = useDownloadFile(sessionId)
  const deleteMutation = useDeleteFile(sessionId)

  // Extract files data from response
  const files = artifactsQuery.data && typeof artifactsQuery.data === 'object' && 'data' in artifactsQuery.data
    ? (artifactsQuery.data as any).data || []
    : artifactsQuery.data || []

  return {
    // Data
    files: files as FileMetadata[],
    isLoading: artifactsQuery.isLoading,
    
    // Operations
    uploadFile: uploadMutation.mutate,
    downloadFile: downloadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    
    // Status
    isUploading: uploadMutation.isPending,
    isDownloading: downloadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Errors
    uploadError: uploadMutation.error,
    downloadError: downloadMutation.error,
    deleteError: deleteMutation.error,
    
    // Manual refresh
    refetch: artifactsQuery.refetch,
  }
}