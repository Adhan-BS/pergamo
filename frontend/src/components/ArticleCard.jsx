import { Link } from 'react-router-dom';
import { truncate } from '../utils/format.js';

/**
 * Card de artigo no estilo "capa" do front original:
 * ao passar o mouse, o resumo aparece sobre a capa.
 */
export default function ArticleCard({ article, journalTitle }) {
  const authors = article.authors?.map((author) => author.name).join(', ');
  const journal = article.issue?.journal?.title ?? journalTitle;

  return (
    <Link to={`/artigos/${article.id}`} className="artigo-card">
      <div className="capa">
        <div className="capa-conteudo">
          {article.area && <span className="selo-area">{article.area.name}</span>}
          <h3>{article.title}</h3>
        </div>
        <div className="sinopse">{truncate(article.abstract, 280)}</div>
      </div>
      <div className="artigo-info">
        {authors && <h4>{authors}</h4>}
        {journal && <p>{journal}</p>}
      </div>
    </Link>
  );
}
