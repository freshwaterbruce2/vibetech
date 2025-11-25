import React from 'react';
import Dashboard from './Dashboard';

// Example usage of the Dashboard component
export default function DashboardExample() {
  return (
    <div className="min-h-screen bg-aura-background">
      {/* Basic usage with default props */}
      <Dashboard />

      {/* Advanced usage with custom props */}
      {/*
      <Dashboard
        title="Custom Analytics Dashboard"
        subtitle="Monitor your custom business metrics"
        refreshInterval={60000} // 1 minute
        className="custom-dashboard-class"
      />
      */}

      {/* Usage without header */}
      {/*
      <Dashboard
        showHeader={false}
        refreshInterval={0} // Disable auto-refresh
      />
      */}
    </div>
  );
}