'use client';

import { memo } from 'react';
import { Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/i18n/context';

const languages = [
  {
    code: 'en',
    label: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'id',
    label: 'Indonesia',
    flag: '🇮🇩',
  },
] as const;

export const LanguageSwitcher = memo(() => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 hover:bg-primary/10 rounded-lg border-primary/20 hover:border-primary/40"
          title="Change Language"
        >
          <Languages className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 sm:w-48 rounded-lg border bg-popover p-1.5 sm:p-2 text-popover-foreground" align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer text-sm sm:text-base"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl">{lang.flag}</span>
              <span>{lang.label}</span>
            </div>
            {language === lang.code && (
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
