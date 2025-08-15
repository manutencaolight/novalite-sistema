// Em: src/TeamManagementPage.js (Versão Melhorada com "Salvar em Bloco")

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- NOVO ESTADO para a equipe em edição ---
    const [currentTeam, setCurrentTeam] = useState([]);
    const [funcionarioParaAdicionar, setFuncionarioParaAdicionar] = useState('');

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
        const eventoCompleto = eventos.find(e => e.id === eventoId);
        setSelectedEvento(eventoCompleto);
        // Inicializa o estado de edição com a equipe atual do evento
        setCurrentTeam(eventoCompleto ? eventoCompleto.equipe : []);
    };
    
    // --- Funções de adicionar/remover AGORA SÓ MUDAM O ESTADO LOCAL ---
    const handleAddMember = () => {
        if (!funcionarioParaAdicionar) return;
        const funcionarioObj = allFuncionarios.find(f => f.id === funcionarioParaAdicionar);
        if (funcionarioObj && !currentTeam.some(m => m.id === funcionarioObj.id)) {
            setCurrentTeam([...currentTeam, funcionarioObj]);
        }
        setFuncionarioParaAdicionar('');
    };

    const handleRemoveMember = (funcionarioId) => {
        setCurrentTeam(currentTeam.filter(m => m.id !== funcionarioId));
    };

    // --- NOVA FUNÇÃO para salvar tudo de uma vez no backend ---
    const handleSaveTeam = () => {
        setError('');
        setSuccess('');
        if (!selectedEvento) return;

        const funcionario_ids = currentTeam.map(m => m.id);
        
        authFetch(`/eventos/${selectedEvento.id}/manage-team/`, {
            method: 'POST',
            body: JSON.stringify({ funcionario_ids }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then((data) => {
            setSuccess(data.status || 'Equipe salva com sucesso!');
            // Atualiza os dados do evento para refletir o estado salvo
            authFetch(`/eventos/${selectedEvento.id}/`).then(res => res.json()).then(updatedEvento => {
                setSelectedEvento(updatedEvento);
                setEventos(prevEventos => prevEventos.map(e => e.id === updatedEvento.id ? updatedEvento : e));
            });
        })
        .catch(err => setError(err.error || 'Ocorreu um erro ao salvar a equipe.'));
    };

    const handleSetLeader = (funcionarioId) => {
        // ... (esta função continua a salvar imediatamente, pois é uma ação singular)
        authFetch(`/eventos/${selectedEvento.id}/set-leader/`, {
            method: 'POST',
            body: JSON.stringify({ funcionario_id: funcionarioId }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => {
            authFetch(`/eventos/${selectedEvento.id}/`).then(res => res.json()).then(updatedEvento => {
                setSelectedEvento(updatedEvento);
                setCurrentTeam(updatedEvento.equipe);
                setEventos(prevEventos => prevEventos.map(e => e.id === updatedEvento.id ? updatedEvento : e));
            });
        })
        .catch(err => setError(err.error || 'Erro ao definir líder.'));
    };


    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    const funcionariosDisponiveis = selectedEvento
        ? allFuncionarios.filter(func => !currentTeam.some(membro => membro.id === func.id))
        : [];

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestão de Equipes por Evento
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

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
                    <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
                        {selectedEvento ? (
                            <>
                                <Box flexGrow={1} overflow="auto">
                                    <Typography variant="h6">Editando Equipe de: {selectedEvento.nome}</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', my: 2 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Adicionar Membro</InputLabel>
                                            <Select
                                                value={funcionarioParaAdicionar}
                                                label="Adicionar Membro"
                                                onChange={e => setFuncionarioParaAdicionar(e.target.value)}
                                            >
                                                <MenuItem value=""><em>Selecione...</em></MenuItem>
                                                {funcionariosDisponiveis.map(func => (
                                                    <MenuItem key={func.id} value={func.id}>{func.nome}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Button
                                            variant="outlined"
                                            onClick={handleAddMember}
                                            disabled={!funcionarioParaAdicionar}
                                        >
                                            <AddCircleIcon />
                                        </Button>
                                    </Box>
                                    <Divider />
                                    <List>
                                        {currentTeam.map(membro => (
                                            <ListItem
                                                key={membro.id}
                                                secondaryAction={
                                                    <Box>
                                                        <Tooltip title="Definir como Chefe de Equipe">
                                                            <IconButton edge="end" onClick={() => handleSetLeader(membro.id)}>
                                                                <StarIcon color={selectedEvento.chefe_de_equipe?.id === membro.id ? "warning" : "inherit"} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Remover da Equipe">
                                                            <IconButton edge="end" onClick={() => handleRemoveMember(membro.id)}>
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
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button variant="contained" onClick={handleSaveTeam}>
                                        Salvar Alterações na Equipe
                                    </Button>
                                </Box>
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