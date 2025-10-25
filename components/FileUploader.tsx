'use client';

import { useState, useId, memo, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { UploadCloud, File, X, FileText, FileImage, FileVideo, FileAudio, Check, AlertCircle, Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import { FileUploadClient, type Duration } from '@/lib/upload-client';
import { DEFAULT_UPLOAD_DURATION } from '@/lib/upload-durations';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type FileMetadata } from '@/lib/validators';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/i18n/context';
import NextImage from 'next/image';

const LoginModal = lazy(() => import('@/components/login-modal').then(mod => ({ default: mod.LoginModal })));

const MAX_FILE_SIZE_BYTES = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE ?? '104857600');
const MAX_FILE_SIZE_LABEL = `${Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB`;
const CONCURRENT_UPLOADS = 3;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000;

const ALLOWED_EXTENSIONS = new Set<string>(
  (JSON.parse(process.env.NEXT_PUBLIC_ALLOWLIST || '[]') as string[]).map(ext => ext.toLowerCase())
);

interface QueuedFile {
  id: string;
  file: File;
  previewUrl?: string;
  status: 'pending' | 'uploading' | 'paused' | 'success' | 'error';
  progress: number;
  error?: string;
  abortController?: AbortController;
  retryCount: number;
  startTime?: number;
  uploadedBytes?: number;
  resumeRequested?: boolean;
  retryRequested?: boolean;
}

interface FileUploaderProps {
  onUploadSuccess: (result: { data: FileMetadata; file?: File }) => void;
  onUploadError: (error: string) => void;
  uploadClient: FileUploadClient;
}

export const FileUploader = memo(({ onUploadSuccess, onUploadError, uploadClient }: FileUploaderProps) => {
  const { status } = useSession();
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<Duration>(DEFAULT_UPLOAD_DURATION);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingUploadAction, setPendingUploadAction] = useState<'select' | 'upload' | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [aggregateProgress, setAggregateProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadQueueRef = useRef<Set<string>>(new Set());
  const durationOptions = useMemo(() => uploadClient.getAvailableDurations(), [uploadClient]);

  useEffect(() => {
    if (durationOptions.length === 0) {
      return;
    }

    const isCurrentValid = durationOptions.some((option) => option.value === selectedDuration);
    if (!isCurrentValid) {
      const fallback = durationOptions.find((option) => option.value === DEFAULT_UPLOAD_DURATION) ?? durationOptions[0];
      setSelectedDuration(fallback.value);
    }
  }, [durationOptions, selectedDuration]);

  useEffect(() => {
    const totalFiles = queuedFiles.length;
    if (totalFiles === 0) {
      if (aggregateProgress !== 0 || estimatedTimeRemaining !== null) {
        setAggregateProgress(0);
        setEstimatedTimeRemaining(null);
      }
      return;
    }

    const totalProgress = queuedFiles.reduce((sum, file) => {
      if (file.status === 'success') return sum + 100;
      if (file.status === 'uploading') return sum + file.progress;
      return sum;
    }, 0);

    const avgProgress = Math.round(totalProgress / totalFiles);
    if (avgProgress !== aggregateProgress) {
      setAggregateProgress(avgProgress);
    }

    const uploadingFiles = queuedFiles.filter(f => f.status === 'uploading' && f.startTime);
    if (uploadingFiles.length > 0) {
      const now = Date.now();
      let totalSpeed = 0;
      let validSpeedCount = 0;

      uploadingFiles.forEach(file => {
        if (file.startTime && file.uploadedBytes && file.progress > 0) {
          const elapsedSeconds = (now - file.startTime) / 1000;
          const speed = file.uploadedBytes / elapsedSeconds;
          totalSpeed += speed;
          validSpeedCount++;
        }
      });

      if (validSpeedCount > 0) {
        const avgSpeed = totalSpeed / validSpeedCount;
        const remainingFiles = queuedFiles.filter(f => f.status === 'pending' || f.status === 'uploading');
        const remainingBytes = remainingFiles.reduce((sum, file) => {
          if (file.status === 'uploading' && file.uploadedBytes) {
            return sum + (file.file.size - file.uploadedBytes);
          }
          return sum + file.file.size;
        }, 0);

        const etaSeconds = Math.ceil(remainingBytes / avgSpeed);
        if (etaSeconds !== estimatedTimeRemaining) {
          setEstimatedTimeRemaining(etaSeconds);
        }
      } else if (estimatedTimeRemaining !== null) {
        setEstimatedTimeRemaining(null);
      }
    } else if (estimatedTimeRemaining !== null) {
      setEstimatedTimeRemaining(null);
    }
  }, [queuedFiles, aggregateProgress, estimatedTimeRemaining]);

  const createFilePreview = useCallback((file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  }, []);

  const validateFileType = useCallback((file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    return ALLOWED_EXTENSIONS.has(extension);
  }, []);

  const addToQueue = useCallback((file: File) => {
    if (file.size === 0) {
      onUploadError('File is empty');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onUploadError(`File size exceeds ${MAX_FILE_SIZE_LABEL}`);
      return;
    }

    if (!validateFileType(file)) {
      const fileName = file.name.toLowerCase();
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      onUploadError(`File type ${extension || 'unknown'} is not allowed`);
      return;
    }

    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const previewUrl = createFilePreview(file);
    const newQueuedFile: QueuedFile = {
      id: fileId,
      file,
      previewUrl,
      status: 'pending',
      progress: 0,
      retryCount: 0,
    };

    setQueuedFiles(prev => [...prev, newQueuedFile]);
  }, [createFilePreview, onUploadError, validateFileType]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      setPendingUploadAction('select');
      setShowLoginModal(true);
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(addToQueue);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      setPendingUploadAction('select');
      setShowLoginModal(true);
      return;
    }

    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'loading') {
      event.target.value = '';
      return;
    }

    if (status === 'unauthenticated') {
      setPendingUploadAction('select');
      setShowLoginModal(true);
      event.target.value = '';
      return;
    }

    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      files.forEach(addToQueue);
      event.target.value = '';
    }
  }, [addToQueue, status]);

  const removeFileFromQueue = useCallback((id: string) => {
    setQueuedFiles(prev => {
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove) {
        if (fileToRemove.abortController) {
          fileToRemove.abortController.abort();
        }
        if (fileToRemove.previewUrl) {
          URL.revokeObjectURL(fileToRemove.previewUrl);
        }
        uploadQueueRef.current.delete(id);
      }
      return prev.filter(file => file.id !== id);
    });
  }, []);

  const pauseUpload = useCallback((id: string) => {
    setQueuedFiles(prev => {
      let hasChanges = false;
      const updated = prev.map(file => {
        if (file.id === id && file.status === 'uploading' && file.abortController) {
          file.abortController.abort();
          uploadQueueRef.current.delete(id);
          hasChanges = true;
          return { ...file, status: 'paused' as const, abortController: undefined };
        }
        return file;
      });
      return hasChanges ? updated : prev;
    });
  }, []);

  const resumeUpload = useCallback((id: string) => {
    setQueuedFiles(prev => {
      let hasChanges = false;
      const updated = prev.map(file => {
        if (file.id === id && file.status === 'paused') {
          hasChanges = true;
          return { ...file, status: 'pending' as const, resumeRequested: true };
        }
        return file;
      });
      return hasChanges ? updated : prev;
    });
  }, []);

  const retryUpload = useCallback((id: string) => {
    setQueuedFiles(prev => {
      let hasChanges = false;
      const updated = prev.map(file => {
        if (file.id === id && file.status === 'error') {
          hasChanges = true;
          return { ...file, status: 'pending' as const, error: undefined, retryCount: 0, retryRequested: true };
        }
        return file;
      });
      return hasChanges ? updated : prev;
    });
  }, []);

  const uploadFile = useCallback(async (queuedFile: QueuedFile) => {
    const { file, id } = queuedFile;
    const abortController = new AbortController();

    setQueuedFiles(prev =>
      prev.map(f =>
        f.id === id ? {
          ...f,
          status: 'uploading',
          progress: 0,
          abortController,
          startTime: Date.now(),
          uploadedBytes: 0,
          resumeRequested: false,
          retryRequested: false,
        } : f
      )
    );

    uploadQueueRef.current.add(id);

    try {
      const response = await uploadClient.uploadFile(
        file,
        selectedDuration,
        (progress) => {
          const uploadedBytes = (progress / 100) * file.size;
          setQueuedFiles(prev =>
            prev.map(f =>
              f.id === id ? { ...f, progress: Math.round(progress), uploadedBytes } : f
            )
          );
        },
        abortController.signal
      );

      uploadQueueRef.current.delete(id);

      if (response.code === 'ABORTED') {
        return;
      }

      if (response.success && response.data) {
        setQueuedFiles(prev =>
          prev.map(f =>
            f.id === id ? { ...f, status: 'success', abortController: undefined } : f
          )
        );
        onUploadSuccess({ data: response.data, file });
      } else {
        const errorMsg = response.error || 'Upload failed due to an unknown error.';

        if (queuedFile.retryCount < MAX_RETRY_ATTEMPTS) {
          const retryDelay = RETRY_DELAY_BASE * Math.pow(2, queuedFile.retryCount);
          setQueuedFiles(prev =>
            prev.map(f =>
              f.id === id ? {
                ...f,
                status: 'pending',
                retryCount: f.retryCount + 1,
                abortController: undefined,
                error: `Retrying... (${f.retryCount + 1}/${MAX_RETRY_ATTEMPTS})`,
              } : f
            )
          );

          await new Promise(resolve => setTimeout(resolve, retryDelay));
          const retryFile = queuedFiles.find(f => f.id === id);
          if (retryFile && retryFile.status === 'pending') {
            await uploadFile({ ...retryFile, retryCount: retryFile.retryCount });
          }
        } else {
          setQueuedFiles(prev =>
            prev.map(f =>
              f.id === id ? { ...f, status: 'error', error: errorMsg, abortController: undefined } : f
            )
          );
          onUploadError(errorMsg);
        }
      }
    } catch (error) {
      uploadQueueRef.current.delete(id);

      if (error instanceof Error && error.message === 'Upload aborted') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'A network error occurred.';

      if (queuedFile.retryCount < MAX_RETRY_ATTEMPTS) {
        const retryDelay = RETRY_DELAY_BASE * Math.pow(2, queuedFile.retryCount);
        setQueuedFiles(prev =>
          prev.map(f =>
            f.id === id ? {
              ...f,
              status: 'pending',
              retryCount: f.retryCount + 1,
              abortController: undefined,
              error: `Retrying... (${f.retryCount + 1}/${MAX_RETRY_ATTEMPTS})`,
            } : f
          )
        );

        await new Promise(resolve => setTimeout(resolve, retryDelay));
        const retryFile = queuedFiles.find(f => f.id === id);
        if (retryFile && retryFile.status === 'pending') {
          await uploadFile({ ...retryFile, retryCount: retryFile.retryCount });
        }
      } else {
        setQueuedFiles(prev =>
          prev.map(f =>
            f.id === id ? { ...f, status: 'error', error: errorMessage, abortController: undefined } : f
          )
        );
        onUploadError(errorMessage);
      }
    }
  }, [onUploadSuccess, onUploadError, selectedDuration, uploadClient, queuedFiles]);

  const processUploadQueue = useCallback(async () => {
    const pendingFiles = queuedFiles.filter(f => f.status === 'pending');
    const currentlyUploading = uploadQueueRef.current.size;

    if (currentlyUploading >= CONCURRENT_UPLOADS || pendingFiles.length === 0) {
      return;
    }

    const filesToUpload = pendingFiles.slice(0, CONCURRENT_UPLOADS - currentlyUploading);

    await Promise.all(filesToUpload.map(file => uploadFile(file)));
  }, [queuedFiles, uploadFile]);

  const uploadAllFiles = useCallback(async () => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      setPendingUploadAction('upload');
      setShowLoginModal(true);
      return;
    }

    processUploadQueue();
  }, [status, processUploadQueue]);

  useEffect(() => {
    const hasUploadingFiles = queuedFiles.some(f => f.status === 'uploading');
    const hasResumeRetryRequests = queuedFiles.some(f => f.resumeRequested || f.retryRequested);
    const hasPendingFiles = queuedFiles.some(f => f.status === 'pending');

    if ((hasUploadingFiles || hasResumeRetryRequests) && hasPendingFiles && uploadQueueRef.current.size < CONCURRENT_UPLOADS) {
      processUploadQueue();
    }
  }, [queuedFiles, processUploadQueue]);

  const clearAllFiles = useCallback(() => {
    setQueuedFiles(prev => {
      prev.forEach(file => {
        if (file.abortController) {
          file.abortController.abort();
        }
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
      uploadQueueRef.current.clear();
      return [];
    });
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && pendingUploadAction) {
      if (pendingUploadAction === 'select' && fileInputRef.current) {
        fileInputRef.current.click();
      } else if (pendingUploadAction === 'upload' && queuedFiles.length > 0) {
        void uploadAllFiles();
      }
      setPendingUploadAction(null);
    }
  }, [status, pendingUploadAction, queuedFiles, uploadAllFiles]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-5 w-5" />;
    } else if (file.type.startsWith('video/')) {
      return <FileVideo className="h-5 w-5" />;
    } else if (file.type.startsWith('audio/')) {
      return <FileAudio className="h-5 w-5" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5" />;
    } else if (file.type.startsWith('text/')) {
      return <FileText className="h-5 w-5" />;
    } else {
      return <File className="h-5 w-5" />;
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderFilePreview = (queuedFile: QueuedFile) => {
    const { file, previewUrl, status, progress, error } = queuedFile;

    return (
      <div
        key={queuedFile.id}
        className="flex flex-col gap-3 rounded-xl border bg-card p-4"
      >
        <div className="flex items-start gap-3">
          {file.type.startsWith('image/') ? (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border">
              {previewUrl ? (
                <NextImage
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  width={48}
                  height={48}
                />
              ) : (
                <FileImage className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border bg-muted text-primary">
              {getFileIcon(file)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-foreground" title={file.name}>
                  {file.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {uploadClient.formatFileSize(file.size)}
                  {queuedFile.retryCount > 0 && ` • Retry ${queuedFile.retryCount}/${MAX_RETRY_ATTEMPTS}`}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {status === 'uploading' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => pauseUpload(queuedFile.id)}
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                    title="Pause upload"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                )}

                {status === 'paused' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => resumeUpload(queuedFile.id)}
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                    title="Resume upload"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}

                {status === 'error' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => retryUpload(queuedFile.id)}
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                    title="Retry upload"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFileFromQueue(queuedFile.id)}
                  disabled={status === 'uploading'}
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {status === 'uploading' && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('uploadingProgress')}</span>
                  <span className="font-medium text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 rounded-full" />
              </div>
            )}

            {status === 'paused' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Pause className="h-4 w-4" />
                <span>{t('pausedAt')} {progress}%</span>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {status === 'success' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span>{t('uploadSuccessful')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      id="upload-panel"
      className="rounded-2xl border bg-card p-6"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 text-foreground">
              <span className="text-sm font-medium">{t('expires')}:</span>
              <Select value={selectedDuration} onValueChange={(value) => setSelectedDuration(value as Duration)}>
                <SelectTrigger className="w-40 rounded-lg">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {queuedFiles.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{t('totalProgress')}</span>
              <div className="flex items-center gap-3">
                {estimatedTimeRemaining !== null && (
                  <span className="text-xs text-muted-foreground">
                    {t('eta')}: {formatTime(estimatedTimeRemaining)}
                  </span>
                )}
                <span className="font-bold text-primary">{aggregateProgress}%</span>
              </div>
            </div>
            <Progress value={aggregateProgress} className="h-2 rounded-full" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {queuedFiles.filter(f => f.status === 'success').length} of {queuedFiles.length} {t('filesCompleted')}
              </span>
              <span>
                {queuedFiles.filter(f => f.status === 'uploading').length} {t('uploading')}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            multiple
          />

          {queuedFiles.length === 0 && (
            <div
              className={`group relative flex w-full flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed p-8 text-center ${
                isDragging
                  ? 'border-primary bg-primary/10 dark:bg-primary/20'
                  : 'border-muted-foreground/30 bg-muted/30 hover:border-muted-foreground/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (status === 'loading') {
                  return;
                }

                if (status === 'unauthenticated') {
                  setPendingUploadAction('select');
                  setShowLoginModal(true);
                  return;
                }
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Upload files by clicking or dragging and dropping"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }
              }}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'
              }`}>
                <UploadCloud className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {isDragging ? t('dropFilesToUpload') : t('dragFilesHere')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('or')} <span className="text-primary font-medium">{t('browseFromDevice')}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('maximumFileSize')}: {MAX_FILE_SIZE_LABEL} {t('perFile')}
                </p>
              </div>
            </div>
          )}

          {queuedFiles.length > 0 && (
            <div className="space-y-3">
              {queuedFiles.map(queuedFile => renderFilePreview(queuedFile))}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (status === 'loading') {
                      return;
                    }

                    if (status === 'unauthenticated') {
                      setPendingUploadAction('select');
                      setShowLoginModal(true);
                      return;
                    }
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="flex-1 rounded-lg"
                >
                  {t('addMoreFiles')}
                </Button>

                <Button
                  variant="outline"
                  onClick={clearAllFiles}
                  className="flex-1 rounded-lg"
                >
                  {t('clearAll')}
                </Button>

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (status === 'unauthenticated') {
                      setPendingUploadAction('upload');
                      setShowLoginModal(true);
                      return;
                    }
                    void uploadAllFiles();
                  }}
                  disabled={
                    queuedFiles.every(f => f.status === 'success' || f.status === 'uploading' || f.status === 'paused')
                  }
                  className="flex-1 rounded-lg"
                >
                  {queuedFiles.some(f => f.status === 'uploading') ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('uploadingProgress')} ({queuedFiles.filter(f => f.status === 'uploading').length})</span>
                    </div>
                  ) : (
                    <span>{t('uploadAll')} {queuedFiles.filter(f => f.status === 'pending').length > 0 ? `(${queuedFiles.filter(f => f.status === 'pending').length})` : ''}</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => {
              setShowLoginModal(false);
              if (pendingUploadAction) {
                setPendingUploadAction(null);
              }
            }}
            onLoginSuccess={() => {
              setShowLoginModal(false);
            }}
          />
        )}
      </Suspense>
    </section>
  );
});

FileUploader.displayName = 'FileUploader';
