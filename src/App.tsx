import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import MyBooksPage from './pages/MyBooksPage';
import ExchangesPage from './pages/ExchangesPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleGetStarted = () => {
    setCurrentPage('discover');
  };

  const renderPage = () => {
    if (!user && currentPage !== 'home') {
      return <HomePage onGetStarted={handleGetStarted} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage onGetStarted={handleGetStarted} />;
      case 'discover':
        return <DiscoverPage />;
      case 'my-books':
        return <MyBooksPage />;
      case 'exchanges':
        return <ExchangesPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
