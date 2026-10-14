import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { GlossaryDictionary } from '../data/types';
import { GlossaryContext } from './GlossaryContext';

type GlossaryProviderProps = {
  glossary: GlossaryDictionary;
  children: ReactNode;
};

export default function GlossaryProvider({ glossary, children }: GlossaryProviderProps) {
  const [selectedGlossaryId, setSelectedGlossaryId] = useState<string | null>(null);
  const getEntry = useCallback((id: string) => (
    Object.hasOwn(glossary, id) ? glossary[id] : undefined
  ), [glossary]);
  const openGlossary = useCallback((id: string) => {
    if (getEntry(id)) setSelectedGlossaryId(id);
  }, [getEntry]);
  const closeGlossary = useCallback(() => setSelectedGlossaryId(null), []);
  const value = useMemo(() => ({
    glossary,
    selectedGlossaryId,
    getEntry,
    openGlossary,
    closeGlossary,
  }), [glossary, selectedGlossaryId, getEntry, openGlossary, closeGlossary]);

  return <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>;
}
