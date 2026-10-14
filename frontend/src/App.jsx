import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Journals from './pages/Journals.jsx';
import JournalDetail from './pages/JournalDetail.jsx';
import IssueDetail from './pages/IssueDetail.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Account from './pages/Account.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="artigos" element={<Catalog />} />
        <Route path="artigos/:id" element={<ArticleDetail />} />
        <Route path="revistas" element={<Journals />} />
        <Route path="revistas/:id" element={<JournalDetail />} />
        <Route path="edicoes/:id" element={<IssueDetail />} />
        <Route path="sobre" element={<About />} />
        <Route path="entrar" element={<Login />} />
        <Route path="cadastro" element={<Register />} />
        <Route
          path="conta"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
