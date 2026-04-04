'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const changeLocale = (locale: Locale) => {
    startTransition(() => {
      // Set cookie
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      // Reload to apply new locale
      window.location.reload();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          <Globe className="h-4 w-4 mr-2" />
          {localeNames[currentLocale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLocale(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
