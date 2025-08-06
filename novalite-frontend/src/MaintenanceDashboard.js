// Em: src/MaintenanceDashboard.js (Versão Final com O.S. e Correção de Auth)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, Divider
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { authFetch } from './api';
import ManageMaintenanceModal from './ManageMaintenanceModal';
import SendToMaintenanceModal from './SendToMaintenanceModal';
import { useAuth } from './AuthContext'; // 1. Correção de Auth

function MaintenanceDashboard() {
    const { user } = useAuth(); // 2. Correção de Auth
    const [maintenanceItems, setMaintenanceItems] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSendModalOpen, setSendModalOpen] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(() => {
        setError(null);
        Promise.all([
            authFetch('/manutencao/').then(res => res.json()),
            authFetch('/manutencao-historico/').then(res => res.json())
        ])
        .then(([activeData, historyData]) => {
            setMaintenanceItems(activeData.results || activeData);
            setHistoryItems(historyData.results || historyData);
        })
        .catch(err => setError('Falha ao carregar dados da manutenção.'));
    }, []);

    // 3. Correção de Auth
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    const handleSuccess = () => {
        setSelectedItem(null);
        setSendModalOpen(false);
        fetchData(); 
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {selectedItem && <ManageMaintenanceModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={handleSuccess} />}
            {isSendModalOpen && <SendToMaintenanceModal onClose={() => setSendModalOpen(false)} onSuccess={handleSuccess} />}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Painel de Manutenção
                </Typography>
                <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setSendModalOpen(true)}>
                    Enviar para Manutenção
                </Button>
            </Box>

            {error && <Typography color="error">{error}</Typography>}

            {/* Tabela de Itens Ativos */}
            <Typography variant="h5" component="h2" gutterBottom>Itens em Reparo</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {/* --- COLUNA DA O.S. ADICIONADA --- */}
                            <TableCell sx={{ fontWeight: 'bold' }}>Nº da O.S.</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Equipamento</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Problema Reportado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Data de Entrada</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(maintenanceItems || []).map((item) => (
                            <TableRow key={item.id} hover>
                                {/* --- DADO DA O.S. ADICIONADO --- */}
                                <TableCell>{item.os_number}</TableCell>
                                <TableCell>{item.equipamento?.modelo}</TableCell>
                                <TableCell>{item.descricao_problema}</TableCell>
                                <TableCell>{new Date(item.data_entrada).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>{item.status_display}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Gerir Reparo">
                                        <IconButton onClick={() => setSelectedItem(item)} color="primary">
                                            <BuildIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {maintenanceItems.length === 0 && <Typography sx={{p: 2, textAlign: 'center'}}>Nenhum item em manutenção.</Typography>}
            </TableContainer>

            <Divider sx={{ my: 4 }} />

            {/* Tabela de Histórico */}
            <Typography variant="h5" component="h2" gutterBottom>Histórico de Reparos Concluídos</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                             {/* --- COLUNA DA O.S. ADICIONADA --- */}
                            <TableCell sx={{ fontWeight: 'bold' }}>Nº da O.S.</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Equipamento</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Solução Aplicada</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Data de Entrada</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Data de Saída</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(historyItems || []).map((item) => (
                            <TableRow key={item.id} hover>
                                {/* --- DADO DA O.S. ADICIONADO --- */}
                                <TableCell>{item.os_number}</TableCell>
                                <TableCell>{item.equipamento?.modelo}</TableCell>
                                <TableCell>{item.solucao_aplicada || "N/A"}</TableCell>
                                <TableCell>{new Date(item.data_entrada).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>{item.data_saida ? new Date(item.data_saida).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {historyItems.length === 0 && <Typography sx={{p: 2, textAlign: 'center'}}>Nenhum reparo concluído ainda.</Typography>}
            </TableContainer>
        </Container>
    );
}

export default MaintenanceDashboard;