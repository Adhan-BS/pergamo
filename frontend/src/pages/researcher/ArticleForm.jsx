import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalog, researcher } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { fieldError } from '../../utils/format.js';
import FormField from '../../components/FormField.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';

const MAX_PDF_MB = 10;

/** Primeiro erro de um grupo de campos, ex.: "keywords" ou "keywords.0". */
function groupError(errors, prefix) {
  const key = Object.keys(errors ?? {}).find((k) => k === prefix || k.startsWith(`${prefix}.`));
  return key ? errors[key][0] : undefined;
}

function pdfProblem(file) {
  if (!file) return 'Escolha o arquivo PDF do artigo.';
  if (file.size > MAX_PDF_MB * 1024 * 1024) return `O PDF pode ter no máximo ${MAX_PDF_MB} MB.`;
  return null;
}

export default function ArticleForm() {
  const { id } = useParams();
  const areas = useFetch(() => catalog.getAreas(), []);
  const existing = useFetch(() => (id ? researcher.get(id) : Promise.resolve(null)), [id]);

  if (areas.loading || existing.loading) return <Loading />;

  if (existing.error?.status === 404 || existing.error?.status === 403) {
    return (
      <section className="container estado">
        <h2>Artigo não encontrado</h2>
        <p>Ele não existe ou não pertence à sua conta.</p>
        <Link to="/meus-artigos" className="btn btn-dark">
          Voltar aos meus artigos
        </Link>
      </section>
    );
  }

  const error = areas.error ?? existing.error;
  if (error) {
    return (
      <ErrorMessage
        error={error}
        onRetry={() => {
          areas.reload();
          existing.reload();
        }}
      />
    );
  }

  return <Editor key={id ?? 'novo'} article={existing.data} areas={areas.data} />;
}

function Editor({ article, areas }) {
  const editing = Boolean(article);
  const readOnly = editing && article.status === 'publicado';
  const { user } = useAuth();
  const navigate = useNavigate();

  const nextKey = useRef(1);
  const makeAuthor = (data = {}) => ({
    key: nextKey.current++,
    name: data.name ?? '',
    affiliation: data.affiliation ?? '',
    email: data.email ?? '',
  });

  const [title, setTitle] = useState(article?.title ?? '');
  const [abstract, setAbstract] = useState(article?.abstract ?? '');
  const [areaId, setAreaId] = useState(article?.area ? String(article.area.id) : '');
  const [keywordsText, setKeywordsText] = useState(article?.keywords.map((k) => k.name).join(', ') ?? '');
  const [authors, setAuthors] = useState(() =>
    editing
      ? article.authors.map((author) => makeAuthor(author))
      : [makeAuthor({ name: user.name, affiliation: user.institution ?? '' })],
  );
  const [file, setFile] = useState(null);

  const [errors, setErrors] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Troca de PDF (só na edição)
  const [newFile, setNewFile] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [pdfMessage, setPdfMessage] = useState('');
  const [pdfSending, setPdfSending] = useState(false);

  const parseKeywords = () => [
    ...new Set(
      keywordsText
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean),
    ),
  ];

  const cleanAuthors = () =>
    authors
      .map(({ name, affiliation, email }) => ({
        name: name.trim(),
        affiliation: affiliation.trim(),
        email: email.trim(),
      }))
      .filter((author) => author.name || author.affiliation || author.email);

  const updateAuthor = (key, field, value) =>
    setAuthors((list) => list.map((author) => (author.key === key ? { ...author, [field]: value } : author)));

  const addAuthor = () => setAuthors((list) => [...list, makeAuthor()]);
  const removeAuthor = (key) => setAuthors((list) => list.filter((author) => author.key !== key));

  /** Confere o essencial no navegador, no mesmo formato de erros da API. */
  const validateLocally = () => {
    const found = {};
    if (!title.trim()) found.title = ['O título é obrigatório.'];
    if (abstract.trim().length < 30) found.abstract = ['O resumo deve ter pelo menos 30 caracteres.'];
    if (!areaId) found.area_id = ['Escolha a área do artigo.'];
    if (cleanAuthors().length === 0) found.authors = ['Informe pelo menos um autor.'];
    cleanAuthors().forEach((author, index) => {
      if (!author.name) found[`authors.${index}.name`] = ['Todo autor precisa de um nome.'];
    });
    if (!editing) {
      const problem = pdfProblem(file);
      if (problem) found.file = [problem];
    }
    return Object.keys(found).length ? found : null;
  };

  const buildFormData = () => {
    const data = new FormData();
    data.append('title', title.trim());
    data.append('abstract', abstract.trim());
    data.append('area_id', areaId);
    cleanAuthors().forEach((author, index) => {
      data.append(`authors[${index}][name]`, author.name);
      if (author.affiliation) data.append(`authors[${index}][affiliation]`, author.affiliation);
      if (author.email) data.append(`authors[${index}][email]`, author.email);
    });
    parseKeywords().forEach((word, index) => data.append(`keywords[${index}]`, word));
    data.append('file', file);
    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const local = validateLocally();
    setErrors(local);
    if (local) {
      setMessage({ type: 'erro', text: 'Corrija os campos destacados.' });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await researcher.update(article.id, {
          title: title.trim(),
          abstract: abstract.trim(),
          area_id: Number(areaId),
          authors: cleanAuthors(),
          keywords: parseKeywords(),
        });
        setMessage({ type: 'sucesso', text: 'Alterações salvas.' });
      } else {
        await researcher.create(buildFormData());
        navigate('/meus-artigos', {
          state: { flash: 'Artigo criado como rascunho. Quando estiver pronto, envie para avaliação.' },
        });
      }
    } catch (err) {
      setErrors(err.errors);
      setMessage({ type: 'erro', text: err.errors ? 'Corrija os campos destacados.' : err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSendForReview = async () => {
    setMessage(null);
    setSaving(true);
    try {
      await researcher.submit(article.id);
      navigate('/meus-artigos', { state: { flash: `“${article.title}” foi enviado para avaliação.` } });
    } catch (err) {
      setMessage({ type: 'erro', text: err.message });
      setSaving(false);
    }
  };

  const handleReplacePdf = async () => {
    setPdfError('');
    setPdfMessage('');

    const problem = pdfProblem(newFile);
    if (problem) {
      setPdfError(problem);
      return;
    }

    setPdfSending(true);
    try {
      const data = new FormData();
      data.append('file', newFile);
      await researcher.replaceFile(article.id, data);
      setNewFile(null);
      setPdfMessage('PDF substituído com sucesso.');
    } catch (err) {
      setPdfError(fieldError(err.errors, 'file') ?? err.message);
    } finally {
      setPdfSending(false);
    }
  };

  return (
    <section className="container">
      <Link to="/meus-artigos" className="voltar">
        ← Meus artigos
      </Link>

      <form className="form-card form-largo" onSubmit={handleSubmit} noValidate>
        <h2>{editing ? 'Editar artigo' : 'Enviar novo artigo'}</h2>
        {editing && (
          <p className="form-intro">
            <StatusBadge status={article.status} />
          </p>
        )}
        {!editing && (
          <p className="form-intro">
            O artigo é salvo como rascunho. Depois você pode revisar e enviar para avaliação.
          </p>
        )}

        {readOnly && (
          <div className="alerta alerta-erro" role="alert">
            Artigos publicados não podem mais ser editados.
          </div>
        )}

        {message && (
          <div
            className={`alerta alerta-${message.type}`}
            role={message.type === 'erro' ? 'alert' : 'status'}
          >
            {message.text}
          </div>
        )}

        <fieldset className="grupo" disabled={readOnly || saving}>
          <FormField label="Título" name="title" error={fieldError(errors, 'title')}>
            <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </FormField>

          <FormField
            label="Resumo"
            name="abstract"
            hint="Mínimo de 30 caracteres."
            error={fieldError(errors, 'abstract')}
          >
            <textarea
              id="abstract"
              rows="8"
              value={abstract}
              onChange={(event) => setAbstract(event.target.value)}
            />
          </FormField>

          <FormField label="Área do conhecimento" name="area_id" error={fieldError(errors, 'area_id')}>
            <select id="area_id" value={areaId} onChange={(event) => setAreaId(event.target.value)}>
              <option value="">Selecione...</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Palavras-chave"
            name="keywords"
            hint="Separe por vírgulas. Máximo de 10."
            error={groupError(errors, 'keywords')}
          >
            <input
              id="keywords"
              value={keywordsText}
              onChange={(event) => setKeywordsText(event.target.value)}
            />
          </FormField>

          <div className="autores-editor">
            <h3>Autores</h3>
            {groupError(errors, 'authors') && !errors?.['authors.0.name'] && (
              <small className="erro">{groupError(errors, 'authors')}</small>
            )}

            {authors.map((author, index) => (
              <div key={author.key} className="autor-linha">
                <FormField
                  label={`Autor ${index + 1}: nome`}
                  name={`author-name-${author.key}`}
                  error={fieldError(errors, `authors.${index}.name`)}
                >
                  <input
                    id={`author-name-${author.key}`}
                    value={author.name}
                    onChange={(event) => updateAuthor(author.key, 'name', event.target.value)}
                  />
                </FormField>
                <FormField
                  label={`Autor ${index + 1}: instituição`}
                  name={`author-aff-${author.key}`}
                  error={fieldError(errors, `authors.${index}.affiliation`)}
                >
                  <input
                    id={`author-aff-${author.key}`}
                    value={author.affiliation}
                    onChange={(event) => updateAuthor(author.key, 'affiliation', event.target.value)}
                  />
                </FormField>
                <FormField
                  label={`Autor ${index + 1}: e-mail`}
                  name={`author-email-${author.key}`}
                  error={fieldError(errors, `authors.${index}.email`)}
                >
                  <input
                    id={`author-email-${author.key}`}
                    type="email"
                    value={author.email}
                    onChange={(event) => updateAuthor(author.key, 'email', event.target.value)}
                  />
                </FormField>
                {authors.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-perigo btn-pequeno"
                    aria-label={`Remover autor ${index + 1}`}
                    onClick={() => removeAuthor(author.key)}
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}

            <button type="button" className="btn btn-ghost btn-pequeno" onClick={addAuthor}>
              + Adicionar autor
            </button>
          </div>

          {!editing && (
            <FormField
              label="Arquivo do artigo (PDF)"
              name="file"
              hint={`Somente PDF, até ${MAX_PDF_MB} MB.`}
              error={fieldError(errors, 'file')}
            >
              <input
                id="file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </FormField>
          )}
        </fieldset>

        {!readOnly && (
          <div className="form-acoes">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar como rascunho'}
            </button>
            {editing && article.status === 'rascunho' && (
              <button type="button" className="btn btn-dark" disabled={saving} onClick={handleSendForReview}>
                Enviar para avaliação
              </button>
            )}
            <Link to="/meus-artigos" className="btn btn-ghost">
              Cancelar
            </Link>
          </div>
        )}
        {editing && article.status === 'rascunho' && (
          <p className="dica">Salve as alterações antes de enviar para avaliação.</p>
        )}
      </form>

      {editing && !readOnly && (
        <div className="form-card form-largo bloco-pdf">
          <h3>Substituir o PDF</h3>
          <p className="form-intro">Envie uma nova versão do arquivo. O PDF anterior será trocado.</p>

          {pdfMessage && (
            <div className="alerta alerta-sucesso" role="status">
              {pdfMessage}
            </div>
          )}

          <FormField label="Novo arquivo (PDF)" name="new-file" error={pdfError}>
            <input
              id="new-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setNewFile(event.target.files?.[0] ?? null)}
            />
          </FormField>

          <button type="button" className="btn btn-dark" disabled={pdfSending} onClick={handleReplacePdf}>
            {pdfSending ? 'Enviando...' : 'Substituir PDF'}
          </button>
        </div>
      )}
    </section>
  );
}
