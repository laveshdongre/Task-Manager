import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={48} />}
      {title && <h3>{title}</h3>}
      {description && <p style={{ fontSize: 14 }}>{description}</p>}
      {action}
    </div>
  );
}
