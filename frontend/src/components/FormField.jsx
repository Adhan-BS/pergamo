export default function FormField({ label, name, error, hint, children }) {
  return (
    <div className={`campo${error ? ' campo-erro' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && <small className="dica">{hint}</small>}
      {error && (
        <small className="erro" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
