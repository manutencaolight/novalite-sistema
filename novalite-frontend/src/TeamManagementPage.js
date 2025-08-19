// Em: src/TeamManagementPage.js (VERSÃO COMPLETAMENTE REESCRITA)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Grid, List, ListItemButton,
    ListItemText, Divider, CircularProgress, Alert, FormControl,
    InputLabel, Select, MenuItem, Button, ListItem, IconButton, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { authFetch } from './api';
import { useAuth } from './AuthContext';
import ScheduleModal from './ScheduleModal';

function TeamManagementPage() {
    const { user } = useAuth();
    const [eventos, setEventos] = useState([]);
    const [allFuncionarios, setAllFuncionarios] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [escalaAtual, setEscalaAtual] = useState([]);
    const [funcionarioParaAdicionar, setFuncionarioParaAdicionar] = useState('');
    const [modalState, setModalState] = useState({ open: false, funcionario: null, escala: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(() => { /* ... (a mesma que antes) ... */ });
    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSelectEvento = (eventoId) => {
        const evento = eventos.find(e => e.id === eventoId);
        setSelectedEvento(evento);
        if (evento) {
            authFetch(`/escalas/?evento_id=${eventoId}`)
                .then(res => res.json())
                .then(data => setEscalaAtual(data.results || data));
        }
    };

    const handleOpenModal = (funcionario, escala = null) => {
        setModalState({ open: true, funcionario, escala });
    };
    
    const handleCloseModal = () => {
        setModalState({ open: false, funcionario: null, escala: null });
    };

    const handleSaveSchedule = (scheduleData) => {
        const { funcionario, escala } = modalState;
        const url = escala ? `/escalas/${escala.id}/` : '/escalas/';
        const method = escala ? 'PUT' : 'POST';
        const body = {
            ...scheduleData,
            evento: selectedEvento.id,
            funcionario: funcionario.id
        };

        authFetch(url, { method, body: JSON.stringify(body) })
            .then(res => res.ok ? res.json() : Promise.reject('Falha ao salvar escala.'))
            .then(() => {
                handleCloseModal();
                handleSelectEvento(selectedEvento.id); // Recarrega a escala
            })
            .catch(err => setError(err.message || err));
    };
    
    const handleRemoveMember = (escalaId) => {
        if (window.confirm('Remover este membro da escala?')) {
            authFetch(`/escalas/${escalaId}/`, { method: 'DELETE' })
                .then(() => handleSelectEvento(selectedEvento.id));
        }
    };

    const funcionariosDisponiveis = allFuncionarios.filter(
        func => !escalaAtual.some(e => e.funcionario.id === func.id)
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* ... Título e Alertas ... */}
            <Grid container spacing={3}>
                {/* ... Coluna de Eventos ... */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2 }}>
                        {selectedEvento ? (
                            <>
                                <Typography variant="h6">Escala de: {selectedEvento.nome}</Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', my: 2 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Adicionar e Agendar</InputLabel>
                                        <Select
                                            value={funcionarioParaAdicionar}
                                            label="Adicionar e Agendar"
                                            onChange={e => {
                                                const func = allFuncionarios.find(f => f.id === e.target.value);
                                                if (func) handleOpenModal(func);
                                                setFuncionarioParaAdicionar(e.target.value);
                                            }}
                                        >
                                            <MenuItem value=""><em>Selecione um membro...</em></MenuItem>
                                            {funcionariosDisponiveis.map(func => (
                                                <MenuItem key={func.id} value={func.id}>{func.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Divider />
                                <List>
                                    {escalaAtual.map(escala => (
                                        <ListItem key={escala.id} secondaryAction={
                                            <>
                                                <IconButton onClick={() => handleOpenModal(escala.funcionario, escala)}><EditIcon /></IconButton>
                                                <IconButton onClick={() => handleRemoveMember(escala.id)}><DeleteIcon color="error" /></IconButton>
                                            </>
                                        }>
                                            <ListItemText 
                                                primary={escala.funcionario.nome}
                                                secondary={`De ${escala.data_inicio} ${escala.hora_inicio} até ${escala.data_fim} ${escala.hora_fim}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        ) : ( /* ... Mensagem para selecionar evento ... */ )}
                    </Paper>
                </Grid>
            </Grid>
            <ScheduleModal 
                open={modalState.open}
                onClose={handleCloseModal}
                onSave={handleSaveSchedule}
                funcionario={modalState.funcionario}
                evento={selectedEvento}
                escala={modalState.escala}
            />
        </Container>
    );
}
export default TeamManagementPage;