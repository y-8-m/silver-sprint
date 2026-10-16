import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { HelpContext } from './HelpContext';

export default function HelpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openHelp = useCallback(() => setOpen(true), []);
  const closeHelp = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, openHelp, closeHelp }), [open, openHelp, closeHelp]);
  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}
