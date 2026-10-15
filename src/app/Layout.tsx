import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGlossary } from '../glossary/GlossaryContext';
import styles from './App.module.css';

export default function Layout() {
  const { pathname } = useLocation();
  const closeGlossary = useGlossary()?.closeGlossary;
  useEffect(() => { closeGlossary?.(); }, [pathname, closeGlossary]);
  return (
    <div className={styles.app}>
      <header>
        <h1>Silver Sprint</h1>
        <p>Java Silver SE 17 対策ドリル</p>
        <nav aria-label="メインナビゲーション" className={styles.navigation}>
          <NavLink to="/" end>ホーム</NavLink>
          <NavLink to="/questions">問題一覧</NavLink>
          <NavLink to="/glossary">用語集</NavLink>
          <NavLink to="/drill">ドリル</NavLink>
          <NavLink to="/review">復習</NavLink>
          <NavLink to="/stats">戦績</NavLink>
        </nav>
      </header>
      <main><Outlet /></main>
    </div>
  );
}
