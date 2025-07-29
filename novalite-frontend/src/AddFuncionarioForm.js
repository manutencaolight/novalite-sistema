// Em: src/AddFuncionarioForm.js

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function AddFuncionarioForm({ onSave, editingItem, onCancelEdit }) {
    const [nome, setNome] = useState('');
    const [funcao, setFuncao] = useState('');
    const [tipo, setTipo] = useState('funcionario');
    const [contato, setContato] = useState('');

    useEffect(() => {
        if (editingItem) {
            setNome(editingItem.nome || '');
            setFuncao(editingItem.funcao || '');
            setTipo(editingItem.tipo || 'funcionario');
            setContato(editingItem.contato || '');
        } else {
            setNome('');
            setFuncao('');
            setTipo('funcionario');
            setContato('');
        }
    }, [editingItem]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({ nome, funcao, tipo, contato }, editingItem ? editingItem.id : null);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} required fullWidth />
            <TextField label="Função" value={funcao} onChange={e => setFuncao(e.target.value)} fullWidth />
            <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={tipo} label="Tipo" onChange={e => setTipo(e.target.value)}>
                    <MenuItem value="funcionario">Funcionário</MenuItem>
                    <MenuItem value="freelancer">Freelancer</MenuItem>
                </Select>
            </FormControl>
            <TextField label="Contato (Telefone)" value={contato} onChange={e => setContato(e.target.value)} fullWidth />
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

export default AddFuncionarioForm;