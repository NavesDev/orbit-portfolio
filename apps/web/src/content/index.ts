import type { Locale } from '@portfolio/core';

import { enUS } from './en-US/index';
import { ptBR } from './pt-BR/index';
import type { SiteContent } from './types';

const CONTENT: Readonly<Record<Locale, SiteContent>> = {
  'en-US': enUS,
  'pt-BR': ptBR,
};

/** Exhaustive over `LOCALES` by type: a new locale without copy is a type error. */
export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale];
}

export type { SiteContent, StripPhrase } from './types';
