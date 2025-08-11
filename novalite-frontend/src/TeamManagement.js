import React, { useState, useEffect } from 'react';
import {
    Box, Typography, FormControl, InputLabel, Select,
    MenuItem, OutlinedInput, Chip, Button, Paper // --- 'Paper' ADICIONADO AQUI ---
} from '@mui/material';
import { authFetch } from './api';

function TeamManagement({ evento, onTeamUpdate }) {
    const [allFuncionarios, setAllFuncionarios] = useState([]);
    const [selectedFuncionarioIds, setSelectedFuncionarioIds] = useState([]);
    const [error, setError] = useState('');

    // Busca todos os funcionários disponíveis no sistema
    useEffect(() => {
        authFetch('/funcionarios/')
            .then(res => res.ok ? res.json() : Promise.reject('Falha ao carregar funcionários.'))
            .then(data => setAllFuncionarios(data.results || data))
            .catch(err => setError(err.message || err));
    }, []);

    // Define a equipe atual quando o evento é carregado
    useEffect(() => {
        if (evento?.equipe) {
            setSelectedFuncionarioIds(evento.equipe.map(f => f.id));
        }
    }, [evento]);

    const handleSelectionChange = (event) => {
        const { target: { value } } = event;
        setSelectedFuncionarioIds(
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleSaveTeam = () => {
        setError('');
        authFetch(`/eventos/${evento.id}/manage-team/`, {
            method: 'POST',
            body: JSON.stringify({ funcionario_ids: selectedFuncionarioIds }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => {
            alert('Equipe atualizada com sucesso!');
            onTeamUpdate(); // Atualiza a página principal
        })
        .catch(err => setError(err.error || 'Ocorreu um erro ao salvar a equipe.'));
    };

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Equipe Designada</Typography>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            <FormControl fullWidth>
                <InputLabel id="team-select-label">Selecione os Membros da Equipe</InputLabel>
                <Select
                    labelId="team-select-label"
                    multiple
                    value={selectedFuncionarioIds}
                    onChange={handleSelectionChange}
                    input={<OutlinedInput label="Selecione os Membros da Equipe" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((id) => {
                                const func = allFuncionarios.find(f => f.id === id);
                                return <Chip key={id} label={func?.nome || id} />;
                            })}
                        </Box>
                    )}
                >
                    {allFuncionarios.map((func) => (
                        <MenuItem key={func.id} value={func.id}>
                            {func.nome}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleSaveTeam}
            >
                Salvar Equipe
            </Button>
        </Paper>
    );
}

export default TeamManagement;