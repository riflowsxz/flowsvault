'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileUploadClient } from '@/lib/upload-client';
import { type FileMetadata } from '@/lib/validators';
import { AppHeader } from '@/components/AppHeader';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { LanguageProvider, useLanguage } from '@/lib/i18n/context';

export interface UploadedFile extends FileMetadata {
  isExpired: boolean;
  localObjectUrl?: string;
}

function HomePageContent() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const uploadClient = useMemo(() => new FileUploadClient(), []);

  const handleUploadError = useCallback((errorText: string) => {
    toast.error(t('uploadFailed'), {
      description: errorText,
    });
  }, [t]);

  const fetchAndSetFiles = useCallback(async () => {
    if (status === 'authenticated' && session?.user?.id) {
      try {
        const result = await uploadClient.listFiles(1, 100);
        if (result.success && result.data) {
          const now = Date.now();
          const normalizedFiles: UploadedFile[] = result.data.map((file) => ({
            ...file,
            isExpired: file.expiresAt ? new Date(file.expiresAt).getTime() <= now : false,
          }));
          setUploadedFiles(normalizedFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
        } else {
          toast.error(t('loadFilesFailed'), {
            description: result.error || 'An unknown error occurred.',
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast.error(t('loadFilesFailed'), {
          description: message,
        });
      }
    }
  }, [uploadClient, session?.user?.id, status, t]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAndSetFiles();
    }
  }, [status, fetchAndSetFiles]);

  useEffect(() => {
    if (uploadedFiles.length === 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      setUploadedFiles((prev) => {
        let hasChanges = false;
        const updated = prev.map((file) => {
          if (!file.expiresAt) return file;
          const isExpired = new Date(file.expiresAt).getTime() <= now;
          if (isExpired !== file.isExpired) {
            hasChanges = true;
            return { ...file, isExpired };
          }
          return file;
        });
        return hasChanges ? updated : prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [uploadedFiles.length]);

  const handleUploadSuccess = (response: { data: FileMetadata; file?: File }) => {
    const { data, file } = response;
    const localObjectUrl = file ? URL.createObjectURL(file) : undefined;
    const newFile: UploadedFile = {
      ...data,
      isExpired: data.expiresAt ? new Date(data.expiresAt).getTime() <= Date.now() : false,
      localObjectUrl,
    };

    setUploadedFiles((prev) => [newFile, ...prev]);
    toast.success(t('uploadSuccess'), {
      description: data.originalName,
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    if (status === 'authenticated' && session?.user?.id) {
      try {
        const result = await uploadClient.deleteFile(fileId);
        if (result.success) {
          setUploadedFiles((prev) => {
            const fileToDelete = prev.find((file) => file.id === fileId);
            if (fileToDelete?.localObjectUrl) {
              URL.revokeObjectURL(fileToDelete.localObjectUrl);
            }
            return prev.filter((file) => file.id !== fileId);
          });
          toast.success(t('fileDeleted'));
        } else {
          toast.error(t('deleteFileFailed'), {
            description: result.error || 'An unknown error occurred.',
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast.error(t('deleteFileFailed'), {
          description: message,
        });
      }
    }
  };

  const filteredFiles = useMemo(() => {
    return uploadedFiles.filter((file) => {
      const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'active' && !file.isExpired) ||
        (filterType === 'expired' && file.isExpired);
      return matchesSearch && matchesFilter;
    });
  }, [uploadedFiles, searchQuery, filterType]);



  return (
    <>
      <Toaster position="bottom-right" richColors />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <AppHeader
          uploadClient={uploadClient}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          files={filteredFiles}
          onDeleteFile={handleDeleteFile}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
        />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <HomePageContent />
    </LanguageProvider>
  );
}