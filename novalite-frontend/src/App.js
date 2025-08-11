// Em: src/App.js (Versão com Rota e Navegação Exclusiva para Ponto)

import React, { useEffect } from 'react'; // Adicionado useEffect
import './App.css';
import { Routes, Route, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'; // Adicionado useNavigate
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
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Ícone para o ponto

// Componentes de página
import QuadroDeAviso from './QuadroDeAviso';
import EventList from './EventList';
import EventDetail from './EventDetail';
import EquipmentList from './EquipmentList';
import LogisticsDashboard from './LogisticsDashboard';
import ConferencePage from './ConferencePage';
import MaintenanceDashboard from './MaintenanceDashboard';
import AccessDenied from './AccessDenied';
import PontoPage from './PontoPage'; // --- NOVA PÁGINA IMPORTADA ---

function AppLayout() {
    const { user, logout } = useAuth();
    
    // --- LÓGICA DE NAVEGAÇÃO EXCLUSIVA ---
    // Se o usuário for freelancer_ponto, a navegação será diferente
    if (user.role === 'freelancer_ponto') {
        return (
            <div className="App">
                <header className="app-header">
                    <NavLink to="/ponto" className="header-logo">
                        <img src={meuLogo} alt="Logotipo" />
                        <h1>Registro de Ponto</h1>
                    </NavLink>
                    <nav>
                        {/* O único link visível é o de ponto */}
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
                        <NavLink to="/eventos"><PostAddIcon sx={{ mr: 1 }} />Criar Lista de Material</NavLink>
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

// --- COMPONENTE DE ROTA PRIVADA ATUALIZADO ---
function PrivateRoute({ children }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            // Se o usuário for freelancer_ponto, redireciona para /ponto
            if (user.role === 'freelancer_ponto') {
                navigate('/ponto', { replace: true });
            }
            // Para outros usuários, a página inicial padrão é /
        } else {
            // Se não houver usuário, redireciona para /login
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    // O Outlet ou children só é renderizado se houver usuário
    return user ? children : null;
}

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

      {/* A rota pai agora usa o PrivateRoute para gerenciar o redirecionamento inicial */}
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        {/* --- NOVA ROTA PARA O PONTO --- */}
        <Route path="ponto" element={
            <RoleBasedRoute allowedRoles={['admin', 'freelancer_ponto']}>
                <PontoPage />
            </RoleBasedRoute>
        } />

        {/* --- ATUALIZADO: Rota do Quadro de Avisos agora é protegida --- */}
        <Route index element={
            <RoleBasedRoute allowedRoles={['admin', 'planejamento', 'logistica', 'manutencao']}>
                <QuadroDeAviso />
            </RoleBasedRoute>
        } />
        
        {/* O resto das rotas não muda */}
        <Route path="eventos" element={<RoleBasedRoute allowedRoles={['admin', 'planejamento']}><EventList /></RoleBasedRoute>} />
        <Route path="eventos/:id" element={<RoleBasedRoute allowedRoles={['admin', 'planejamento']}><EventDetail /></RoleBasedRoute>} />
        <Route path="logistica" element={<RoleBasedRoute allowedRoles={['admin', 'logistica']}><LogisticsDashboard /></RoleBasedRoute>} />
        <Route path="logistica/operacao/:id" element={<RoleBasedRoute allowedRoles={['admin', 'logistica']}><ConferencePage /></RoleBasedRoute>} />
        <Route path="equipamentos" element={<RoleBasedRoute allowedRoles={['admin','logistica', 'manutencao']}><EquipmentList /></RoleBasedRoute>} />
        <Route path="manutencao" element={<RoleBasedRoute allowedRoles={['admin', 'logistica', 'manutencao']}><MaintenanceDashboard /></RoleBasedRoute>} />
        
        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;