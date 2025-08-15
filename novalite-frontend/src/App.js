// Em: src/App.js (Versão Final com Gestão de Equipes)

import React, { useEffect } from 'react';
import './App.css';
import { Routes, Route, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups'; // --- ÍCONE ADICIONADO ---

// Componentes de página
import QuadroDeAviso from './QuadroDeAviso';
import EventList from './EventList';
import EventDetail from './EventDetail';
import EquipmentList from './EquipmentList';
import LogisticsDashboard from './LogisticsDashboard';
import ConferencePage from './ConferencePage';
import MaintenanceDashboard from './MaintenanceDashboard';
import AccessDenied from './AccessDenied';
import PontoPage from './PontoPage';
import TeamManagementPage from './TeamManagementPage'; // --- NOVA PÁGINA IMPORTADA ---

function AppLayout() {
    const { user, logout } = useAuth();
    
    // Lógica de navegação exclusiva para freelancers
    if (user.role === 'freelancer_ponto') {
        return (
            <div className="App">
                <header className="app-header">
                    <NavLink to="/ponto" className="header-logo">
                        <img src={meuLogo} alt="Logotipo" />
                        <h1>Registro de Ponto</h1>
                    </NavLink>
                    <nav>
                        <NavLink to="/ponto"><AccessTimeIcon sx={{ mr: 1 }} />Meu Ponto</NavLink>
                        <Button variant="text" sx={{ color: 'white' }} onClick={logout}>Sair ({user.username})</Button>
                    </nav>
                </header>
                <main className="app-main-content">
                    <Outlet />
                </main>
            </div>
        );
    }

    // Navegação padrão para os outros usuários
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
                        <>
                            <NavLink to="/eventos"><PostAddIcon sx={{ mr: 1 }} />Listas de Materiais</NavLink>
                            {/* --- NOVO LINK ADICIONADO AO MENU --- */}
                            <NavLink to="/gestao-equipes"><GroupsIcon sx={{ mr: 1 }} />Gestão de Equipes</NavLink>
                        </>
                    )}
                    {(user.role === 'admin' || user.role === 'logistica') && (
                        <NavLink to="/logistica"><ChecklistIcon sx={{ mr: 1 }} />Conferência e Retorno</NavLink>
                    )}
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

// Componente de Rota Privada (não precisa de alterações)
function PrivateRoute({ children }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'freelancer_ponto') {
                navigate('/ponto', { replace: true });
            }
        } else {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    return user ? children : null;
}

// Componente de Rota por Permissão (não precisa de alterações)
function RoleBasedRoute({ allowedRoles, children }) {
    const { user } = useAuth();
    if (user && allowedRoles.includes(user.role)) {
        return children;
    }
    return <Navigate to="/acesso-negado" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/acesso-negado" element={<AccessDenied />} />

      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="ponto" element={
            <RoleBasedRoute allowedRoles={['admin', 'freelancer_ponto']}>
                <PontoPage />
            </RoleBasedRoute>
        } />

        <Route index element={
            <RoleBasedRoute allowedRoles={['admin', 'planejamento', 'logistica', 'manutencao']}>
                <QuadroDeAviso />
            </RoleBasedRoute>
        } />
        
        {/* --- NOVA ROTA ADICIONADA PARA A PÁGINA DE GESTÃO DE EQUIPES --- */}
        <Route path="gestao-equipes" element={
            <RoleBasedRoute allowedRoles={['admin', 'planejamento']}>
                <TeamManagementPage />
            </RoleBasedRoute>
        } />
        
        <Route path="eventos" element={<RoleBasedRoute allowedRoles={['admin', 'planejamento']}><EventList /></RoleBasedRoute>} />
        <Route path="eventos/:id" element={<RoleBasedRoute allowedRoles={['admin', 'planejamento']}><EventDetail /></RoleBasedRoute>} />
        <Route path="logistica" element={<RoleBasedRoute allowedRoles={['admin', 'logistica']}><LogisticsDashboard /></RoleBasedRoute>} />
        <Route path="logistica/operacao/:id" element={<RoleBasedRoute allowedRoles={['admin', 'logistica']}><ConferencePage /></RoleBasedRoute>} />
        <Route path="equipamentos" element={<RoleBasedRoute allowedRoles={['admin','logistica', 'manutencao']}><EquipmentList /></RoleBasedRoute>} />
        <Route path="manutencao" element={<RoleBasedRoute allowedRoles={['admin', 'logistica', 'manutencao']}><MaintenanceDashboard /></RoleBasedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;