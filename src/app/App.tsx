import { HashRouter } from 'react-router-dom';
import { glossary } from '../data/glossary';
import { questions } from '../data/questions';
import AppRoutes from './router';

export default function App() {
  return (
    <HashRouter>
      <AppRoutes questions={questions} glossary={glossary} />
    </HashRouter>
  );
}
