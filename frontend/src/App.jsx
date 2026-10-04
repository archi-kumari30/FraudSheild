import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>
          <AppRoutes />
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
