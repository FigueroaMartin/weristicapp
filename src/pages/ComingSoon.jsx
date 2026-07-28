export default function ComingSoon({ icon, title }) {
  return (
    <div className="page">
      <h2>{icon} {title}</h2>
      <div className="card coming-soon-card">
        <span className="coming-soon-icon">{icon}</span>
        <h3 className="coming-soon-title">Próximamente</h3>
        <p className="empty">Estamos preparando esta sección. Vuelve pronto.</p>
      </div>
    </div>
  )
}
