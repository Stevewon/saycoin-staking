import React from 'react'
import './StatsCard.css'

function StatsCard({ title, value, subtitle, icon, color = 'primary' }) {
  return (
    <div className={`stats-card stats-card-${color}`}>
      <div className="stats-card-icon">{icon}</div>
      <div className="stats-card-content">
        <h3 className="stats-card-title">{title}</h3>
        <div className="stats-card-value">{value}</div>
        {subtitle && <p className="stats-card-subtitle">{subtitle}</p>}
      </div>
    </div>
  )
}

export default StatsCard
