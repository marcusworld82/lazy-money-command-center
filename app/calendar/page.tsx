const days = Array.from({ length: 28 }, (_, index) => index + 1);

export default function CalendarPage() {
  return <div className="marco-library">
    <header className="marco-library-header"><h1>Calendar</h1><p>Staged posts. Nothing is published automatically.</p></header>
    <div className="marco-calendar">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <b key={day}>{day}</b>)}{days.map((day) => <div key={day} className={day === 14 ? "is-today" : ""}>{day}{day === 14 && <span>Review next batch</span>}{day === 19 && <span>Caption draft</span>}</div>)}</div>
    <p className="marco-note">Scheduled posts are library state, not Runs. Platform publishing is unavailable until a connector succeeds.</p>
  </div>;
}
