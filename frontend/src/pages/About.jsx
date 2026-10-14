import { Link } from 'react-router-dom';

const TEAM = [
  'Elano Barros Serrão',
  'Adhan Borges de Souza',
  'Izabel Cristina Martins dos Santos',
  'Luigi Gabriel Lopes dos Santos',
];

export default function About() {
  return (
    <section className="sobre">
      <div className="sobre-texto">
        <span>NOSSA HISTÓRIA</span>
        <h2>Sobre o Pérgamo</h2>

        <p>
          O Pérgamo é um portal de divulgação científica para publicação e organização de artigos
          acadêmicos no formato de revistas digitais. Nasceu para enfrentar um problema conhecido:
          o alto custo de publicar e de acessar pesquisas.
        </p>

        <p>
          O nome faz referência à antiga Biblioteca de Pérgamo e à ideia de preservar e disseminar o
          conhecimento. Com o lema “Ciência sem Fronteiras”, a plataforma busca derrubar as barreiras
          financeiras da pesquisa por meio da tecnologia, oferecendo um ambiente simples, direto e
          aberto para pesquisadores e leitores.
        </p>

        <p>
          Aqui, o leitor navega pelas áreas do conhecimento, encontra artigos, lê os resumos e baixa os
          textos completos. O pesquisador envia o seu trabalho, que passa por uma avaliação antes de ser
          publicado numa edição da revista.
        </p>

        <Link to="/artigos" className="btn btn-dark">
          Explorar artigos
        </Link>
      </div>

      <div className="sobre-info">
        <div className="info-card">
          <h3>Como funciona</h3>
          <div className="linha">
            <span>1. Cadastre-se</span>
            <span>Leitor ou pesquisador</span>
          </div>
          <div className="linha">
            <span>2. Envie o artigo</span>
            <span>PDF + resumo</span>
          </div>
          <div className="linha">
            <span>3. Avaliação</span>
            <span>Equipe administradora</span>
          </div>
          <div className="linha">
            <span>4. Publicação</span>
            <span>Acesso aberto</span>
          </div>
        </div>

        <div className="info-card">
          <h3>Equipe</h3>
          {TEAM.map((name) => (
            <p key={name}>👤 {name}</p>
          ))}
          <p>🎓 Back-end Frameworks · Ciência da Computação</p>
        </div>

        <div className="info-card">
          <h3>Contato</h3>
          <p>📍 Manaus - AM</p>
          <p>✉ contato@pergamo.com.br</p>
          <p>📚 Acesso gratuito</p>
        </div>
      </div>
    </section>
  );
}
