// Em: src/AddVeiculoForm.js

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function AddVeiculoForm({ onSave, editingItem, onCancelEdit }) {
    const [nome, setNome] = useState('');
    const [placa, setPlaca] = useState('');
    const [tipo, setTipo] = useState('');
    const [status, setStatus] = useState('Disponível');

    useEffect(() => {
        if (editingItem) {
            setNome(editingItem.nome || '');
            setPlaca(editingItem.placa || '');
            setTipo(editingItem.tipo || '');
            setStatus(editingItem.status || 'Disponível');
        } else {
            setNome('');
            setPlaca('');
            setTipo('');
            setStatus('Disponível');
        }
    }, [editingItem]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({ nome, placa, tipo, status }, editingItem ? editingItem.id : null);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nome/Apelido do Veículo" value={nome} onChange={e => setNome(e.target.value)} required fullWidth />
            <TextField label="Placa" value={placa} onChange={e => setPlaca(e.target.value)} required fullWidth />
            <TextField label="Tipo (ex: Van, Caminhão, Carro)" value={tipo} onChange={e => setTipo(e.target.value)} fullWidth />
            <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={e => setStatus(e.target.value)}>
                    <MenuItem value="Disponível">Disponível</MenuItem>
                    <MenuItem value="Em Viagem">Em Viagem</MenuItem>
                    <MenuItem value="Em Manutenção">Em Manutenção</MenuItem>
                </Select>
            </FormControl>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" color="primary">
                    {editingItem ? 'Atualizar' : 'Adicionar'}
                </Button>
                {editingItem && (
                    <Button variant="outlined" onClick={onCancelEdit}>
                        Cancelar
                    </Button>
                )}
            </Box>
        </Box>
    );
}
export default AddVeiculoForm;