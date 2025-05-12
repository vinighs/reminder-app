import React from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/sidebar/Sidebar';
import MainContent from './components/main/MainContent';
import NotificationScheduler from './components/notification/NotificationScheduler';
import './styles/index.css'; // Import global styles

function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <Sidebar />
        <MainContent />
        
        {/* Componente invisível que gerencia as notificações */}
        <NotificationScheduler />
      </div>
    </AppProvider>
  );
}

export default App;