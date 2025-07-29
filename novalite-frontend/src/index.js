// Em: src/index.js (VERSÃO FINAL E CORRETA)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 1. O BrowserRouter deve ser o componente mais externo */}
    <BrowserRouter>
      {/* 2. O AuthProvider fica dentro do roteador, envolvendo o App */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);