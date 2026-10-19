import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useGlossary } from '../glossary/GlossaryContext';
import HelpButton from '../help/HelpButton';
import { useHelp } from '../help/HelpContext';
import styles from './App.module.css';
import type { LayoutOutletContext } from './layoutOutletContext';

export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const closeGlossary = useGlossary()?.closeGlossary;
  const closeHelp = useHelp()?.closeHelp;
  const [immersive, setImmersive] = useState(false);
  const outletContext = useMemo<LayoutOutletContext>(() => ({ setImmersive }), []);
  useEffect(() => { closeGlossary?.(); }, [pathname, closeGlossary]);
  useEffect(() => { closeHelp?.(); }, [pathname, closeHelp]);
  return (
    <div className={styles.app}>
      {!immersive && (
        <header className={styles.header}>
          {isHome ? (
            <div className={styles.brand}>
              <h1>Silver Sprint</h1>
              <p>Java Silver SE 17 対策</p>
            </div>
          ) : <Link className={styles.homeLink} to="/">← ホーム</Link>}
          <HelpButton />
        </header>
      )}
      <main><Outlet context={outletContext} /></main>
    </div>
  );
}
