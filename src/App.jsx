import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDatabase } from './hooks/useDatabase';
import Layout from './components/Layout';
import Home from './pages/Home';
import Stats from './pages/Stats';
import Sessions from './pages/Sessions';
import Jobs from './pages/Jobs';
import Vacations from './pages/Vacations';
import Settings from './pages/Settings';

function App() {
  const { isInitialized, isLoading, error } = useDatabase();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833-.27 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error al inicializar</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Preparando la aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="stats" element={<Stats />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="vacations" element={<Vacations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
