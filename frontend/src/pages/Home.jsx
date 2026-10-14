import { Link } from 'react-router-dom';
import { catalog } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { areaIcon, plural } from '../utils/format.js';
import ArticleCard from '../components/ArticleCard.jsx';
import IssueCard from '../components/IssueCard.jsx';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx';

function Block({ state, empty, children }) {
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorMessage error={state.error} onRetry={state.reload} />;
  if (state.data.length === 0) return <EmptyState>{empty}</EmptyState>;
  return children(state.data);
}

export default function Home() {
  const { user } = useAuth();

  const areas = useFetch(() => catalog.getAreas(), []);
  const issues = useFetch(() => catalog.getIssues({ per_page: 6 }).then((r) => r.data), []);
  const articles = useFetch(() => catalog.getArticles({ per_page: 6 }).then((r) => r.data), []);

  const apiDown = [areas, issues, articles].every((state) => state.error);
  const heroArticles = (articles.data ?? []).slice(0, 3);

  const reloadAll = () => {
    areas.reload();
    issues.reload();
    articles.reload();
  };

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h2>
            A Ciência <span>ao Alcance</span> de Todos
          </h2>
          <p>
            Leia artigos científicos de diversas áreas do conhecimento e publique o seu trabalho sem as
            taxas abusivas do mercado editorial. Cadastre-se gratuitamente e faça parte da comunidade.
          </p>
          <div className="hero-buttons">
            <Link to="/artigos" className="btn btn-primary">
              Explorar artigos
            </Link>
            {user ? (
              <Link to="/conta" className="btn btn-outline">
                Minha conta
              </Link>
            ) : (
              <Link to="/cadastro" className="btn btn-outline">
                Cadastre-se
              </Link>
            )}
          </div>
        </div>

        {heroArticles.length > 0 && (
          <div className="hero-capas">
            {heroArticles.map((article) => (
              <Link key={article.id} to={`/artigos/${article.id}`} className="hero-capa">
                {article.area && <span className="selo-area">{article.area.name}</span>}
                <strong>{article.title}</strong>
              </Link>
            ))}
          </div>
        )}

        <div className="hero-faixa">Acesso aberto • Publicação sem taxas • Ciência sem Fronteiras</div>
      </section>

      {apiDown ? (
        <section className="secao">
          <ErrorMessage error={areas.error} onRetry={reloadAll} />
        </section>
      ) : (
        <>
          {/* ÁREAS */}
          <section className="secao">
            <div className="secao-header">
              <h2>Áreas do Conhecimento</h2>
              <Link to="/artigos" className="btn btn-dark">
                Acesse para mais →
              </Link>
            </div>
            <Block state={areas} empty="Nenhuma área cadastrada ainda.">
              {(data) => (
                <div className="cards">
                  {data.map((area) => (
                    <Link key={area.id} to={`/artigos?area=${area.slug}`} className="card area-card">
                      <h3>
                        {areaIcon(area.slug)} {area.name}
                      </h3>
                      <p>{plural(area.journals_count ?? 0, 'revista', 'revistas')}</p>
                    </Link>
                  ))}
                </div>
              )}
            </Block>
          </section>

          {/* EDIÇÕES RECENTES */}
          <section className="secao secao-clara">
            <div className="secao-header">
              <h2>Edições Recentes</h2>
              <Link to="/revistas" className="btn btn-dark">
                Ver revistas →
              </Link>
            </div>
            <Block state={issues} empty="Ainda não há edições com artigos publicados.">
              {(data) => (
                <div className="edicoes-grid">
                  {data.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </Block>
          </section>

          {/* ARTIGOS RECENTES */}
          <section className="secao">
            <div className="secao-header">
              <h2>Artigos Recentes</h2>
              <Link to="/artigos" className="btn btn-dark">
                Acesse para mais →
              </Link>
            </div>
            <Block state={articles} empty="Ainda não há artigos publicados.">
              {(data) => (
                <div className="artigos-grid">
                  {data.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </Block>
          </section>
        </>
      )}

      {/* CHAMADA PARA PUBLICAR */}
      <section className="chamada">
        <h2>Publicar não precisa custar caro</h2>
        <p>
          O Pérgamo é uma alternativa simples e acessível para pesquisadores divulgarem seus trabalhos e
          para qualquer pessoa ler ciência de qualidade.
        </p>
        {user ? (
          <Link to="/conta" className="btn btn-primary">
            Ir para minha conta
          </Link>
        ) : (
          <Link to="/cadastro" className="btn btn-primary">
            Criar conta gratuita
          </Link>
        )}
      </section>
    </>
  );
}
