import { useState, useEffect } from 'react';
import { initDatabase } from '../db/database.js';

export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Database initialization error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return { isInitialized, isLoading, error };
}; 