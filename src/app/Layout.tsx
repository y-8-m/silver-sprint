import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGlossary } from '../glossary/GlossaryContext';
import HelpButton from '../help/HelpButton';
import { useHelp } from '../help/HelpContext';
import styles from './App.module.css';
import type { LayoutOutletContext } from './layoutOutletContext';

export default function Layout() {
  const { pathname } = useLocation();
  const closeGlossary = useGlossary()?.closeGlossary;
  const closeHelp = useHelp()?.closeHelp;
  const [immersive, setImmersive] = useState(false);
  const outletContext = useMemo<LayoutOutletContext>(() => ({ setImmersive }), []);
  useEffect(() => { closeGlossary?.(); }, [pathname, closeGlossary]);
  useEffect(() => { closeHelp?.(); }, [pathname, closeHelp]);
  return (
    <div className={styles.app}>
      {!immersive && (
        <header>
          <div className={styles.titleRow}>
            <div>
              <h1>Silver Sprint</h1>
              <p>Java Silver SE 17 対策ドリル</p>
            </div>
            <HelpButton />
          </div>
          <nav aria-label="メインナビゲーション" className={styles.navigation}>
            <NavLink to="/" end>ホーム</NavLink>
            <NavLink to="/questions">問題一覧</NavLink>
            <NavLink to="/glossary">用語集</NavLink>
            <NavLink to="/drill">ドリル</NavLink>
            <NavLink to="/review">復習</NavLink>
            <NavLink to="/stats">戦績</NavLink>
          </nav>
        </header>
      )}
      <main><Outlet context={outletContext} /></main>
    </div>
  );
}
