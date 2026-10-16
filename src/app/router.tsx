import { useMemo } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import type { GlossaryDictionary, Question } from '../data/types';
import { validateContent } from '../data/validate';
import GlossaryDetailDialog from '../glossary/GlossaryDetailDialog';
import GlossaryProvider from '../glossary/GlossaryProvider';
import GlossaryPage from '../pages/GlossaryPage';
import DrillPage from '../pages/DrillPage';
import HomePage from '../pages/HomePage';
import QuestionListPage from '../pages/QuestionListPage';
import StatsPage from '../pages/StatsPage';
import Layout from './Layout';

type AppRoutesProps = { questions: Question[]; glossary: GlossaryDictionary };

// App supplies HashRouter; tests can supply MemoryRouter.
export default function AppRoutes({ questions, glossary }: AppRoutesProps) {
  const validation = useMemo(() => validateContent(questions, glossary), [questions, glossary]);
  return (
    <GlossaryProvider glossary={glossary}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage questions={questions} validation={validation} />} />
          <Route path="questions" element={<QuestionListPage questions={questions} valid={validation.valid} />} />
          <Route path="glossary" element={<GlossaryPage glossary={glossary} valid={validation.valid} />} />
          <Route path="drill" element={<DrillPage key="all" mode="all" questions={questions} valid={validation.valid} />} />
          <Route path="review" element={<DrillPage key="review" mode="review" questions={questions} valid={validation.valid} />} />
          <Route path="stats" element={<StatsPage questions={questions} valid={validation.valid} />} />
          <Route path="*" element={<><h2>ページが見つかりません。</h2><Link to="/">ホームへ戻る</Link></>} />
        </Route>
      </Routes>
      <GlossaryDetailDialog />
    </GlossaryProvider>
  );
}
