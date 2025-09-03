import React from 'react';
import { useListAppsListAppsGet, useHealthCheckHealthGet } from '../api/generated';

// Simple example showing how clean and easy the generated hooks are to use
export const ApiExample = () => {
  // Get health status
  const { data: healthData, isLoading: healthLoading } = useHealthCheckHealthGet();

  // Get list of apps
  const { data: appsData, isLoading: appsLoading } = useListAppsListAppsGet();

  if (healthLoading || appsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Health Status</h3>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(healthData, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Available Apps</h3>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(appsData, null, 2)}
        </pre>
      </div>
    </div>
  );
};