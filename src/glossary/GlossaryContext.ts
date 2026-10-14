import { createContext, useContext } from 'react';
import type { GlossaryDictionary, GlossaryEntry } from '../data/types';

export type GlossaryContextValue = {
  glossary: GlossaryDictionary;
  selectedGlossaryId: string | null;
  getEntry(id: string): GlossaryEntry | undefined;
  openGlossary(id: string): void;
  closeGlossary(): void;
};

export const GlossaryContext = createContext<GlossaryContextValue | null>(null);

export function useGlossary() {
  return useContext(GlossaryContext);
}
