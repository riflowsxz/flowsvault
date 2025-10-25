'use client';

import { memo, useState } from 'react';

import { FileText, Search, Download, Eye, Trash2, Image as ImageIcon, Archive, FolderOpen, Copy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { type UploadedFile } from '@/app/page';
import { FileUploadClient } from '@/lib/upload-client';
import { useLanguage } from '@/lib/i18n/context';
import { toast } from 'sonner';

interface FileListProps {
  files: UploadedFile[];
  onDeleteFile: (fileId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  uploadClient: FileUploadClient;
}

const FileIcon = memo(({ mimeType }: { mimeType: string }) => {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
  if (mimeType.includes('pdf')) return <FileText className="h-5 w-5" />;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
});
FileIcon.displayName = 'FileIcon';

const FileItem = memo(({ file, onDeleteFile, uploadClient }: { file: UploadedFile; onDeleteFile: (id: string) => Promise<void>; uploadClient: FileUploadClient }) => {
  const { t } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleDownload = async () => {
    const success = await uploadClient.downloadFile(file.fileName, file.originalName);
    if (!success) {
      toast.error(t('downloadFailed'), { description: t('downloadFailedDesc') });
    }
  };
  
  const handleDeleteConfirm = async () => {
    await onDeleteFile(file.id);
    setShowDeleteDialog(false);
  };

  const handlePreview = () => {
    const previewUrl = `/api/preview/${encodeURIComponent(file.id)}`;
    window.open(previewUrl, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(file.downloadUrl);
      toast.success(t('linkCopied'));
    } catch (error) {
      console.error('Failed to copy download link:', error);
      toast.error(t('unableToCopy'));
    }
  };

  const getTimeLeft = (expiresAt: string | null) => {
    if (!expiresAt) return t('neverExpires');
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return t('expired');
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}${t('daysLeft')}`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}${t('hoursLeft')}`;
    return `${Math.floor(diff / (1000 * 60))}${t('minutesLeft')}`;
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return t('image');
    if (mimeType.includes('pdf')) return t('pdf');
    if (mimeType.includes('zip') || mimeType.includes('archive')) return t('archive');
    if (mimeType.includes('text')) return t('document');
    if (mimeType.includes('audio')) return t('audio');
    if (mimeType.includes('video')) return t('video');
    return t('file');
  };

  const expiresLabel = getTimeLeft(file.expiresAt);
  const isExpired = expiresLabel === 'Expired';

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all duration-300 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border bg-muted text-primary">
          <FileIcon mimeType={file.mimeType} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-foreground" title={file.originalName}>
                {file.originalName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {uploadClient.formatFileSize(file.size)} • {getFileType(file.mimeType)} • {new Date(file.uploadedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreview}
                title={t('preview')}
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyLink}
                title={t('copyLink')}
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title={t('download')}
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                title={t('deleteFile')}
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>{expiresLabel}</span>
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
              file.isExpired 
                ? 'bg-destructive/20 text-destructive' 
                : 'bg-primary/10 text-primary'
            }`}>
              {file.isExpired ? t('expired') : t('active')}
            </span>
          </div>
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteFileConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteFileConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3">
            <AlertDialogCancel className="w-full sm:flex-1 h-9 text-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-400 delay-75 ease-out">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="w-full sm:flex-1 h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors animate-in fade-in-0 slide-in-from-bottom-3 duration-400 delay-150 ease-out"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

FileItem.displayName = 'FileItem';


export const FileList = memo(({ files, onDeleteFile, searchQuery, setSearchQuery, filterType, setFilterType, uploadClient }: FileListProps) => {
  const { t } = useLanguage();
  
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full pl-10"
            />
          </div>

          <Tabs value={filterType} onValueChange={setFilterType} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 sm:w-auto">
              <TabsTrigger value="all" className="rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground">
                {t('all')}
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground">
                {t('active')}
              </TabsTrigger>
              <TabsTrigger value="expired" className="rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground">
                {t('expired')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-3">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
                <FolderOpen className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">{t('noFilesYet')}</p>
                <p className="text-sm text-muted-foreground">{t('uploadFirstFile')}</p>
              </div>
            </div>
          ) : (
            files.map((file) => (
              <FileItem key={file.id} file={file} onDeleteFile={onDeleteFile} uploadClient={uploadClient} />
            ))
          )}
        </div>
      </div>
    </section>
  );
});

FileList.displayName = 'FileList';
