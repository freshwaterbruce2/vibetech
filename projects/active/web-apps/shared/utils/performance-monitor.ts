import { useEffect, useState } from 'react';

export function usePerformanceMeasure(metric: string) {
  const [measurement, setMeasurement] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setMeasurement(duration);

      // Log performance metric
      console.log(`Performance [${metric}]: ${duration.toFixed(2)}ms`);
    };
  }, [metric]);

  return measurement;
}
