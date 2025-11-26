import React from 'react';

const TradingTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-aura-background p-6">
      <h1 className="text-3xl font-bold text-white">Trading Dashboard Test</h1>
      <p className="text-white mt-4">If you see this, routing works!</p>

      <div className="mt-8 space-y-4">
        <div>
          <h2 className="text-xl text-white">Testing API Connection:</h2>
          <button
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:8001/api/health');
                const data = await response.json();
                alert(JSON.stringify(data, null, 2));
              } catch (error) {
                alert(`Error: ${  error}`);
              }
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Test API Health
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingTest;
