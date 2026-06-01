import { sampleGraph } from "../graph/sampleGraph";

export function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Awilixify</p>
          <h1>DevTools</h1>
        </div>

        <nav className="nav-list" aria-label="DevTools sections">
          <button type="button" className="nav-item active">
            Graph
          </button>
          <button type="button" className="nav-item">
            Modules
          </button>
          <button type="button" className="nav-item">
            Providers
          </button>
        </nav>
      </aside>

      <section className="workspace" aria-labelledby="graph-title">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">fastify-cqrs sample</p>
            <h2 id="graph-title">Module Graph</h2>
          </div>
          <span className="status-pill">Static preview</span>
        </header>

        <div className="graph-layout">
          <section className="graph-panel" aria-label="Module graph preview">
            {sampleGraph.modules.map((module) => (
              <article className="module-node" key={module.id}>
                <strong>{module.name}</strong>
                <span>{module.providers.length} providers</span>
              </article>
            ))}
          </section>

          <aside className="inspector" aria-label="Graph inspector">
            <h3>Inspector</h3>
            <dl>
              <div>
                <dt>Modules</dt>
                <dd>{sampleGraph.modules.length}</dd>
              </div>
              <div>
                <dt>Edges</dt>
                <dd>{sampleGraph.edges.length}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{sampleGraph.source}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
}
