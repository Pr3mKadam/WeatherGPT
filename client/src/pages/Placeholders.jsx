import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function NotFound() {
  return (
    <div className="not-found">
      <span className="eyebrow">404</span>
      <h1>This page drifted away.</h1>
      <p>The link may be old, or the page may not exist yet.</p>
      <Link to="/app" className="btn btn-primary">
        Back to the dashboard
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
