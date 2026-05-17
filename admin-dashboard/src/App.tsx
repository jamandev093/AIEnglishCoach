function App() {
  return (
    <main className="admin-shell">
      <section className="hero-card">
        <p className="eyebrow">AI English Coach</p>
        <h1>Admin Dashboard Foundation</h1>
        <p className="lead">Phase 15B is ready.</p>

        <div className="status-grid">
          <div className="status-card">
            <span>Dashboard Type</span>
            <strong>Separate Web App</strong>
          </div>

          <div className="status-card">
            <span>Stack</span>
            <strong>React + Vite + TypeScript</strong>
          </div>

          <div className="status-card">
            <span>Mobile App</span>
            <strong>Remains Clean</strong>
          </div>
        </div>

        <p className="note">
          Backend connection, admin login, users, and content management will be added in later phases.
        </p>
      </section>
    </main>
  );
}

export default App;
