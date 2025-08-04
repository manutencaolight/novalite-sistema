// FORÇANDO A ATUALIZAÇÃO FINAL DO FRONTEND

import React from 'react';
import './App.css';
import { Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '@mui/material';
import LoginPage from './LoginPage';
import meuLogo from './novalite_logo.png';

// Ícones
import DashboardIcon from '@mui/icons-material/Dashboard';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ComputerIcon from '@mui/icons-material/Computer';
import BuildIcon from '@mui/icons-material/Build';

// Componentes de página
import QuadroDeAviso from './QuadroDeAviso';
import EventList from './EventList';
import EventDetail from './EventDetail';
import EquipmentList from './EquipmentList';
import LogisticsDashboard from './LogisticsDashboard';
import ConferencePage from './ConferencePage';
import MaintenanceDashboard from './MaintenanceDashboard';
import AccessDenied from './AccessDenied';

function AppLayout() {
    const { user, logout } = useAuth();
    return (
        <div className="App">
            <header className="app-header">
                <NavLink to="/" className="header-logo">
                <img src={meuLogo} alt="Logotipo" />
                    <h1></h1>
                </NavLink>
                <nav>
                    <NavLink to="/"><DashboardIcon sx={{ mr: 1 }} />Quadro de Avisos</NavLink>
                    
                    {(user.role === 'admin' || user.role === 'planejamento') && (
                        <NavLink to="/eventos"><PostAddIcon sx={{ mr: 1 }} />Criar Lista de Material</NavLink>
                    )}

                    {(user.role === 'admin' || user.role === 'logistica') && (
                        <NavLink to="/logistica"><ChecklistIcon sx={{ mr: 1 }} />Conferência e Retorno</NavLink>
                    )}
                    
                    {/* --- LÓGICA DE PERMISSÃO ATUALIZADA AQUI --- */}
                    {(user.role === 'admin' || user.role === 'manutencao') && (
                        <NavLink to="/equipamentos"><ComputerIcon sx={{ mr: 1 }} />Cadastro de Equipamentos</NavLink>
                    )}
                    
                    {(user.role === 'admin' || user.role === 'logistica' || user.role === 'manutencao') && (
                         <NavLink to="/manutencao"><BuildIcon sx={{ mr: 1 }} />Manutenção</NavLink>
                    )}

                    <Button variant="text" sx={{ color: 'white' }} onClick={logout}>Sair ({user.username})</Button>
                </nav>
            </header>
            <main className="app-main-content">
                <Outlet />
            </main>
        </div>
    );
}

function PrivateRoute({ children }) {
    const { user } = useAuth();
    if (!user) { return <Navigate to="/login" replace />; }
    return children;
}

function RoleBasedRoute({ allowedRoles, children }) {
    const { user } = useAuth();
    if (allowedRoles.includes(user.role)) { return children; }
    return <Navigate to="/acesso-negado" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/acesso-negado" element={<AccessDenied />} />

      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<QuadroDeAviso />} />
        <Route path="eventos" element={<RoleBasedRoute allowedRoles={['admin', 'planejamento']}><EventList /></RoleBasedRoute>} />
        <Route path="eventos/:id" element={<RoleBasedRoute allowedRoles={['admin', 'planejamento']}><EventDetail /></RoleBasedRoute>} />
        <Route path="logistica" element={<RoleBasedRoute allowedRoles={['admin', 'logistica']}><LogisticsDashboard /></RoleBasedRoute>} />
        <Route path="logistica/operacao/:id" element={<RoleBasedRoute allowedRoles={['admin', 'logistica']}><ConferencePage /></RoleBasedRoute>} />
        
        {/* --- ROTAS COM PERMISSÕES ATUALIZADAS --- */}
        <Route path="equipamentos" element={<RoleBasedRoute allowedRoles={['admin','logistica', 'manutencao']}><EquipmentList /></RoleBasedRoute>} />
        <Route path="manutencao" element={<RoleBasedRoute allowedRoles={['admin', 'logistica', 'manutencao']}><MaintenanceDashboard /></RoleBasedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;