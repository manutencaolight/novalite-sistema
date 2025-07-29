// Em: src/MaintenanceDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { authFetch } from './api';
import ManageMaintenanceModal from './ManageMaintenanceModal';
// --- 1. IMPORTE O NOVO MODAL ---
import SendToMaintenanceModal from './SendToMaintenanceModal'; 

function MaintenanceDashboard() {
    const [maintenanceItems, setMaintenanceItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    // --- 2. ADICIONE O ESTADO PARA O NOVO MODAL ---
    const [isSendModalOpen, setSendModalOpen] = useState(false);
    const [error, setError] = useState(null);

    const fetchMaintenanceItems = useCallback(() => {
        authFetch('/manutencao/')
            .then(res => res.ok ? res.json() : Promise.reject('Falha ao carregar itens.'))
            .then(data => setMaintenanceItems(data.results || data))
            .catch(err => setError(err.message));
    }, []);

    useEffect(() => {
        fetchMaintenanceItems();
    }, [fetchMaintenanceItems]);

    const handleSuccess = () => {
        setSelectedItem(null);
        setSendModalOpen(false); // Fecha o novo modal também
        fetchMaintenanceItems();
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {selectedItem && <ManageMaintenanceModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={handleSuccess} />}
            {/* --- 3. ADICIONE O NOVO MODAL AO JSX --- */}
            {isSendModalOpen && <SendToMaintenanceModal onClose={() => setSendModalOpen(false)} onSuccess={handleSuccess} />}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Painel de Manutenção
                </Typography>
                {/* --- 4. ADICIONE O NOVO BOTÃO --- */}
                <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setSendModalOpen(true)}>
                    Enviar para Manutenção
                </Button>
            </Box>

            {error && <Typography color="error">{error}</Typography>}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
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
            </TableContainer>
        </Container>
    );
}

export default MaintenanceDashboard;