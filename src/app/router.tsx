import { Link, Route, Routes } from 'react-router-dom';
import type { GlossaryDictionary, Question } from '../data/types';
import { validateContent } from '../data/validate';
import GlossaryDetailDialog from '../glossary/GlossaryDetailDialog';
import GlossaryProvider from '../glossary/GlossaryProvider';
import GlossaryPage from '../pages/GlossaryPage';
import HomePage from '../pages/HomePage';
import QuestionListPage from '../pages/QuestionListPage';
import Layout from './Layout';

type AppRoutesProps = { questions: Question[]; glossary: GlossaryDictionary };

// App supplies HashRouter; tests can supply MemoryRouter.
export default function AppRoutes({ questions, glossary }: AppRoutesProps) {
  const validation = validateContent(questions, glossary);
  return (
    <GlossaryProvider glossary={glossary}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage questionCount={questions.length} glossaryCount={Object.keys(glossary).length} validation={validation} />} />
          <Route path="questions" element={<QuestionListPage questions={questions} valid={validation.valid} />} />
          <Route path="glossary" element={<GlossaryPage glossary={glossary} valid={validation.valid} />} />
          <Route path="*" element={<><h2>ページが見つかりません。</h2><Link to="/">Homeへ戻る</Link></>} />
        </Route>
      </Routes>
      <GlossaryDetailDialog />
    </GlossaryProvider>
  );
}
