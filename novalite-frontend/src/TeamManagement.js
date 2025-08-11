// Em: src/TeamManagement.js (Versão Melhorada)

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, FormControl, InputLabel, Select,
    MenuItem, Button, Paper, List, ListItem, ListItemText,
    IconButton, Divider
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { authFetch } from './api';

function TeamManagement({ evento, onTeamUpdate }) {
    const [allFuncionarios, setAllFuncionarios] = useState([]);
    const [selectedFuncionarioId, setSelectedFuncionarioId] = useState('');
    const [error, setError] = useState('');

    // Busca todos os funcionários disponíveis no sistema
    useEffect(() => {
        authFetch('/funcionarios/')
            .then(res => res.ok ? res.json() : Promise.reject('Falha ao carregar funcionários.'))
            .then(data => setAllFuncionarios(data.results || data))
            .catch(err => setError(err.message || err));
    }, []);

    // Função para adicionar um membro à equipe
    const handleAddMember = () => {
        if (!selectedFuncionarioId) return;
        setError('');
        authFetch(`/eventos/${evento.id}/add-member/`, {
            method: 'POST',
            body: JSON.stringify({ funcionario_id: selectedFuncionarioId }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => {
            setSelectedFuncionarioId(''); // Limpa o seletor
            onTeamUpdate(); // Atualiza a página principal para mostrar o novo membro
        })
        .catch(err => setError(err.error || 'Ocorreu um erro ao adicionar.'));
    };

    // Função para remover um membro da equipe
    const handleRemoveMember = (funcionarioId) => {
        setError('');
        authFetch(`/eventos/${evento.id}/remove-member/`, {
            method: 'POST',
            body: JSON.stringify({ funcionario_id: funcionarioId }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => {
            onTeamUpdate(); // Atualiza a página principal
        })
        .catch(err => setError(err.error || 'Ocorreu um erro ao remover.'));
    };
    
    // Filtra para mostrar apenas funcionários que ainda não estão na equipe
    const funcionariosDisponiveis = allFuncionarios.filter(
        func => !evento.equipe.some(membro => membro.id === func.id)
    );

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Equipe Designada</Typography>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

            {/* Seção para adicionar novos membros */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>Adicionar Membro</InputLabel>
                    <Select
                        value={selectedFuncionarioId}
                        label="Adicionar Membro"
                        onChange={e => setSelectedFuncionarioId(e.target.value)}
                    >
                        <MenuItem value=""><em>Selecione...</em></MenuItem>
                        {funcionariosDisponiveis.map((func) => (
                            <MenuItem key={func.id} value={func.id}>
                                {func.nome}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    onClick={handleAddMember}
                    startIcon={<AddCircleIcon />}
                    disabled={!selectedFuncionarioId}
                >
                    Adicionar
                </Button>
            </Box>

            <Divider />

            {/* Lista dos membros que já estão na equipe */}
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Membros Atuais:</Typography>
            <List>
                {evento.equipe.length > 0 ? (
                    evento.equipe.map(membro => (
                        <ListItem
                            key={membro.id}
                            secondaryAction={
                                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveMember(membro.id)}>
                                    <DeleteIcon color="error" />
                                </IconButton>
                            }
                        >
                            <ListItemText primary={membro.nome} secondary={membro.funcao} />
                        </ListItem>
                    ))
                ) : (
                    <Typography color="text.secondary" sx={{ p: 2 }}>Nenhum membro na equipe ainda.</Typography>
                )}
            </List>
        </Paper>
    );
}

export default TeamManagement;