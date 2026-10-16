import { createContext, useContext } from 'react';

export type HelpContextValue = {
  open: boolean;
  openHelp(): void;
  closeHelp(): void;
};

export const HelpContext = createContext<HelpContextValue | null>(null);

export function useHelp() {
  return useContext(HelpContext);
}
