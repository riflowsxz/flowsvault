import { DEFAULT_UPLOAD_DURATION, getUploadDurationLabel, uploadDurationOptions, type UploadDuration } from './upload-durations';

const DEFAULT_BASE_URL = '/api';

type Duration = UploadDuration;

export interface UploadResponse {
  success: boolean;
  data?: {
    id: string;
    fileName: string;
    originalName: string;
    size: number;
    mimeType: string;
    extension: string;
    uploadedAt: string;
    expiresAt: string | null;
    downloadUrl: string;
    duration: string;
  };
  error?: string;
  code?: string;
  allowedTypes?: string[];
  allowedDurations?: string[];
  message?: string;
}

export interface FileInfo {
  id: string;
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  extension: string;
  uploadedAt: string;
  expiresAt: string | null;
  downloadUrl: string;
  duration?: string;
  isExpired?: boolean;
}

export class FileUploadClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
  }

  getAvailableDurations(): Array<{ value: Duration; label: string }> {
    return uploadDurationOptions.map((option) => ({ ...option }));
  }

  async uploadFile(
    file: File,
    duration: Duration = DEFAULT_UPLOAD_DURATION,
    onProgress?: (progress: number) => void,
    abortSignal?: AbortSignal,
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('duration', duration);

      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        if (abortSignal) {
          if (abortSignal.aborted) {
            reject(new Error('Upload aborted'));
            return;
          }
          abortSignal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Upload aborted'));
          });
        }

        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response: UploadResponse = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error('Invalid JSON response from server'));
            }
          } else {
            try {
              const response: UploadResponse = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              let errorMessage = xhr.statusText || 'Unknown error';
              if (xhr.status === 413) {
                errorMessage = 'File too large for server to accept';
              } else if (xhr.status === 401) {
                errorMessage = 'Authentication required';
              } else if (xhr.status === 403) {
                errorMessage = 'Access forbidden';
              } else if (xhr.status === 500) {
                errorMessage = 'Internal server error';
              }
              reject(new Error(`Upload failed (${xhr.status}): ${errorMessage}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', `${this.baseUrl}/upload`);
        xhr.send(formData);
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Upload aborted') {
        return {
          success: false,
          error: 'Upload aborted',
          code: 'ABORTED',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'CLIENT_ERROR',
      };
    }
  }

  async getFileInfo(fileId: string): Promise<{ success: boolean; data?: FileInfo; error?: string; code?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'CLIENT_ERROR',
      };
    }
  }

  async listFiles(page = 1, limit = 10): Promise<{
    success: boolean;
    data?: FileInfo[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    error?: string;
    code?: string;
  }> {
    try {
      const url = `${this.baseUrl}/upload?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'CLIENT_ERROR',
      };
    }
  }

  private resolveDownloadUrl(fileNameOrUrl: string): string {
    if (!fileNameOrUrl) {
      throw new Error('Invalid filename');
    }

    if (/^https?:\/\//i.test(fileNameOrUrl)) {
      return fileNameOrUrl;
    }

    if (fileNameOrUrl.includes('../') || fileNameOrUrl.includes('..\\')) {
      throw new Error('Invalid filename');
    }

    return `${this.baseUrl}/download/${encodeURIComponent(fileNameOrUrl)}`;
  }

  async downloadFile(fileIdentifier: string, originalFileName?: string): Promise<boolean> {
    try {
      const link = document.createElement('a');
      link.href = this.resolveDownloadUrl(fileIdentifier);
      if (originalFileName) {
        link.download = originalFileName;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (err) {
      console.error('Download failed:', err);
      return false;
    }
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatDuration(duration: Duration): string {
    return getUploadDurationLabel(duration);
  }
}

export type { Duration };
