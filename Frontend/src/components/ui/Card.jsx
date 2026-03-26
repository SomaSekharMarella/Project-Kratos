export default function Card({ title, children }) {
  return (
    <section className="card">
      {title ? <h2 className="section-title">{title}</h2> : null}
      {children}
    </section>
  );
}

