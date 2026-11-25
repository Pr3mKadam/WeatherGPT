export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="state-box state-empty">
      {Icon && (
        <span className="state-icon" aria-hidden="true">
          <Icon size={22} />
        </span>
      )}
      <div className="state-copy">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
