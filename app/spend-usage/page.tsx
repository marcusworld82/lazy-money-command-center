export default function SpendUsagePage() {
  return <div className="marco-library">
    <header className="marco-library-header"><h1>Spend</h1><p>Every completed Run will log provider-reported cost against its agent.</p></header>
    <section className="marco-library-card"><header><b>SPEND. NOT YET CONNECTED</b><em>Unavailable</em></header><div><dl><dt>Text providers</dt><dd>Not connected in Phase 4.6</dd><dt>Image and video</dt><dd>Not connected in Phase 4.6</dd><dt>Run costs</dt><dd>No provider-reported costs yet</dd><dt>Budget controls</dt><dd>Stored per agent; enforced when generation arrives.</dd></dl></div></section>
    <p className="marco-note">MARCO never estimates spend from a hardcoded price table. A cost appears only after a provider reports one.</p>
  </div>;
}
