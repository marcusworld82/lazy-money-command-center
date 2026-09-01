export default function AutomationsPage() {
  return <div className="marco-library">
    <header className="marco-library-header"><h1>Automations</h1><p>Standing rules, not Runs.</p></header>
    <section className="marco-library-card"><header><b>SAVE. DROP LINK</b><em className="is-live">Live</em></header><div><dl><dt>Trigger</dt><dd>Comment contains “save”</dd><dt>Gate</dt><dd>Must follow</dd><dt>Action</dt><dd>DM the drop link</dd><dt>Status</dt><dd>Not configured — no connector is active.</dd></dl></div><footer><button className="marco-library-button">Pause</button><button className="marco-library-button">Edit flow</button><button className="marco-library-button">View log</button></footer></section>
    <section className="marco-library-card"><header><b>SIZE. FIT GUIDE</b><em className="is-paused">Paused</em></header><div><dl><dt>Trigger</dt><dd>Comment contains “size”</dd><dt>Gate</dt><dd>Off</dd><dt>Action</dt><dd>DM the fit chart</dd></dl></div><footer><button className="marco-library-button is-primary">Turn on</button><button className="marco-library-button">Edit flow</button></footer></section>
    <p className="marco-note">Automations are standing rules. They never claim to have fired unless a connector records an actual result.</p>
  </div>;
}
