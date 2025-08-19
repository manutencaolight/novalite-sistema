// Em: src/TeamManagementPage.js (Versão com importação corrigida)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Grid, List, ListItemButton,
    ListItemText, Divider, CircularProgress, Alert, FormControl,
    InputLabel, Select, MenuItem, Button, ListItem, IconButton, Tooltip
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit'; // --- IMPORTAÇÃO ADICIONADA AQUI ---
import { authFetch } from './api';
import { useAuth } from './AuthContext';
import ScheduleModal from './ScheduleModal';

function TeamManagementPage() {
    const { user } = useAuth();
    const [eventos, setEventos] = useState([]);
    const [allFuncionarios, setAllFuncionarios] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [escalaAtual, setEscalaAtual] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [modalState, setModalState] = useState({ open: false, funcionario: null, escala: null });

    const fetchData = useCallback(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                authFetch('/eventos/').then(res => res.json()),
                authFetch('/funcionarios/').then(res => res.json())
            ])
            .then(([eventosData, funcionariosData]) => {
                setEventos(eventosData.results || eventosData);
                setAllFuncionarios(funcionariosData.results || funcionariosData);
            })
            .catch(() => setError('Falha ao carregar dados iniciais.'))
            .finally(() => setLoading(false));
        }
    }, [user]);

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
                handleSelectEvento(selectedEvento.id);
            })
            .catch(err => setError(err.message || err));
    };
    
    const handleRemoveMember = (escalaId) => {
        if (window.confirm('Remover este membro da escala?')) {
            authFetch(`/escalas/${escalaId}/`, { method: 'DELETE' })
                .then(() => handleSelectEvento(selectedEvento.id));
        }
    };

    const handleSetLeader = (funcionarioId) => {
        authFetch(`/eventos/${selectedEvento.id}/set-leader/`, {
            method: 'POST',
            body: JSON.stringify({ funcionario_id: funcionarioId }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => handleSelectEvento(selectedEvento.id))
        .catch(err => setError(err.error || 'Erro ao definir líder.'));
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }
    
    const funcionariosNaEscalaIds = selectedEvento?.escala_equipe?.map(e => e.funcionario.id) || [];
    const funcionariosDisponiveis = allFuncionarios.filter(
        func => !funcionariosNaEscalaIds.includes(func.id)
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestão de Escala por Evento
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
                        <Typography variant="h6">Selecione uma Operação</Typography>
                        <List>
                            {eventos.map(evento => (
                                <ListItemButton
                                    key={evento.id}
                                    selected={selectedEvento?.id === evento.id}
                                    onClick={() => handleSelectEvento(evento.id)}
                                >
                                    <ListItemText
                                        primary={evento.nome || "Operação Sem Nome"}
                                        secondary={`Data: ${new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')}`}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
                        {selectedEvento ? (
                            <>
                                <Typography variant="h6">Escala de: {selectedEvento.nome}</Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', my: 2 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Adicionar e Agendar</InputLabel>
                                        <Select
                                            value={''}
                                            label="Adicionar e Agendar"
                                            onChange={e => {
                                                const func = allFuncionarios.find(f => f.id === e.target.value);
                                                if (func) handleOpenModal(func);
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
                                    {(selectedEvento.escala_equipe || []).map(escala => (
                                        <ListItem key={escala.id} secondaryAction={
                                            <>
                                                <Tooltip title="Definir como Chefe de Equipe">
                                                    <IconButton onClick={() => handleSetLeader(escala.funcionario.id)}>
                                                        <StarIcon color={selectedEvento.chefe_de_equipe?.id === escala.funcionario.id ? "warning" : "inherit"} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar Agenda">
                                                    <IconButton onClick={() => handleOpenModal(escala.funcionario, escala)}><EditIcon /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Remover da Escala">
                                                    <IconButton onClick={() => handleRemoveMember(escala.id)}><DeleteIcon color="error" /></IconButton>
                                                </Tooltip>
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
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography color="text.secondary">Selecione um evento à esquerda para gerenciar a escala.</Typography>
                            </Box>
                        )}
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