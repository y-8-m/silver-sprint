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
        <p>Java Silver SE 17 Drill</p>
        <nav aria-label="メインナビゲーション" className={styles.navigation}>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/questions">Questions</NavLink>
          <NavLink to="/glossary">Glossary</NavLink>
          <NavLink to="/drill">Drill</NavLink>
          <NavLink to="/review">Review</NavLink>
          <NavLink to="/stats">Stats</NavLink>
        </nav>
      </header>
      <main><Outlet /></main>
    </div>
  );
}
