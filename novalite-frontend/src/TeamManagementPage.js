// Em: src/TeamManagementPage.js (Versão Final e Corrigida)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Grid, List, ListItemButton,
    ListItemText, Divider, CircularProgress, Alert, FormControl,
    InputLabel, Select, MenuItem, Button, ListItem, IconButton, Tooltip
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { authFetch } from './api';
import { useAuth } from './AuthContext';

function TeamManagementPage() {
    const { user } = useAuth();
    const [eventos, setEventos] = useState([]);
    const [allFuncionarios, setAllFuncionarios] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [selectedFuncionarioId, setSelectedFuncionarioId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        // Busca a versão mais recente do evento para garantir dados atualizados
        authFetch(`/eventos/${eventoId}/`)
            .then(res => res.json())
            .then(data => setSelectedEvento(data));
    };

    const handleTeamAction = (action, eventoId, funcionarioId) => {
        if (!funcionarioId) return;
        setError('');
        
        authFetch(`/eventos/${eventoId}/${action}/`, {
            method: 'POST',
            body: JSON.stringify({ funcionario_id: funcionarioId }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => {
            handleSelectEvento(eventoId);
            setSelectedFuncionarioId(''); 
        })
        .catch(err => setError(err.error || `Ocorreu um erro.`));
    };
    
    const handleSetLeader = (eventoId, funcionarioId) => {
        authFetch(`/eventos/${eventoId}/set-leader/`, {
            method: 'POST',
            body: JSON.stringify({ funcionario_id: funcionarioId }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => handleSelectEvento(eventoId))
        .catch(err => setError(err.error || 'Erro ao definir líder.'));
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    const funcionariosDisponiveis = selectedEvento
        ? allFuncionarios.filter(func => !selectedEvento.equipe.some(membro => membro.id === func.id))
        : [];

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestão de Equipes por Evento
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
                                <Typography variant="h6">Equipe de: {selectedEvento.nome}</Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', my: 2 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Adicionar Membro</InputLabel>
                                        <Select
                                            value={selectedFuncionarioId}
                                            label="Adicionar Membro"
                                            onChange={e => setSelectedFuncionarioId(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Selecione...</em></MenuItem>
                                            {funcionariosDisponiveis.map(func => (
                                                <MenuItem key={func.id} value={func.id}>{func.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleTeamAction('add-member', selectedEvento.id, selectedFuncionarioId)}
                                        disabled={!selectedFuncionarioId}
                                    >
                                        <AddCircleIcon />
                                    </Button>
                                </Box>
                                <Divider />
                                <List>
                                    {selectedEvento.equipe.map(membro => (
                                        <ListItem
                                            key={membro.id}
                                            secondaryAction={
                                                <Box>
                                                    <Tooltip title="Definir como Chefe de Equipe">
                                                        <IconButton edge="end" onClick={() => handleSetLeader(selectedEvento.id, membro.id)}>
                                                            <StarIcon color={selectedEvento.chefe_de_equipe?.id === membro.id ? "warning" : "inherit"} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Remover da Equipe">
                                                        <IconButton edge="end" onClick={() => handleTeamAction('remove-member', selectedEvento.id, membro.id)}>
                                                            <DeleteIcon color="error" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            }
                                        >
                                            <ListItemText primary={membro.nome} secondary={membro.funcao} />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography color="text.secondary">Selecione um evento à esquerda para gerenciar a equipe.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default TeamManagementPage;