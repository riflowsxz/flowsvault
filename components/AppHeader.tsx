'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { LanguageSwitcher } from '@/components/language-switcher';
import { FileUploader } from '@/components/FileUploader';
import { FileList } from '@/components/FileList';
import { useLanguage } from '@/lib/i18n/context';
import type { FileUploadClient } from '@/lib/upload-client';
import type { FileMetadata } from '@/lib/validators';
import type { UploadedFile } from '@/app/page';

interface AppHeaderProps {
  uploadClient: FileUploadClient;
  onUploadSuccess: (result: { data: FileMetadata; file?: File }) => void;
  onUploadError: (error: string) => void;
  files: UploadedFile[];
  onDeleteFile: (fileId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
}

export const AppHeader = memo(({ uploadClient, onUploadSuccess, onUploadError, files, onDeleteFile, searchQuery, setSearchQuery, filterType, setFilterType }: AppHeaderProps) => {
  const { t } = useLanguage();
  
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container max-w-[1600px] mx-auto flex h-12 sm:h-14 md:h-16 lg:h-[72px] items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-3.5 min-w-0 flex-1">
            <div className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-lg shrink-0">
              <Image src="/android-chrome-192x192.png" alt="FlowsVault" fill className="object-contain" />
            </div>
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{t('appName')}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            <Link href="/docs">
              <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 hover:bg-primary/10 rounded-lg border-primary/20 hover:border-primary/40" title="API Documentation">
                <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
              </Button>
            </Link>
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        <div>
          <section>
            <div className="border border-border rounded-lg bg-card">
              <div className="p-6 sm:p-8 md:p-10">
                <div className="relative mb-8 sm:mb-10 md:mb-12">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-4 flex items-center gap-1">
                      <Star className="h-3 w-3 text-muted-foreground fill-muted-foreground" />
                      <Star className="h-3 w-3 text-muted-foreground fill-muted-foreground" />
                      <Star className="h-3 w-3 text-muted-foreground fill-muted-foreground" />
                    </span>
                  </div>
                </div>

                <FileUploader
                  uploadClient={uploadClient}
                  onUploadSuccess={onUploadSuccess}
                  onUploadError={onUploadError}
                />
              
              <div className="relative my-8 sm:my-10 md:my-12">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 flex items-center gap-1">
                    <Star className="h-3 w-3 text-muted-foreground fill-muted-foreground" />
                    <Star className="h-3 w-3 text-muted-foreground fill-muted-foreground" />
                    <Star className="h-3 w-3 text-muted-foreground fill-muted-foreground" />
                  </span>
                </div>
              </div>

              <FileList
                files={files}
                onDeleteFile={onDeleteFile}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                uploadClient={uploadClient}
              />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
});

AppHeader.displayName = 'AppHeader';
