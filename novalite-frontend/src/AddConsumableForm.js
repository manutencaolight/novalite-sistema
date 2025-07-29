// Em: src/AddConsumableForm.js (Versão Final com Lógica de Atualização)

import React, { useState, useEffect } from 'react';
import { 
    Box, TextField, Button, Select, MenuItem, FormControl, 
    InputLabel, Typography 
} from '@mui/material';
import { authFetch } from './api';

// Adicionamos a nova prop 'existingConsumables'
function AddConsumableForm({ eventoId, onConsumableAdded, existingConsumables }) {
    const [allConsumables, setAllConsumables] = useState([]);
    const [selectedConsumableId, setSelectedConsumableId] = useState('');
    const [quantidade, setQuantidade] = useState(1);

    useEffect(() => {
        authFetch('/consumiveis/').then(res => res.json()).then(data => setAllConsumables(data.results || data));
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!selectedConsumableId) return alert("Por favor, selecione um item.");
        
        // --- LÓGICA DE ATUALIZAÇÃO / CRIAÇÃO ---
        const existingItem = existingConsumables.find(
            item => item.consumivel.id === selectedConsumableId
        );

        if (existingItem) {
            // Se o item JÁ EXISTE, atualizamos a quantidade (PATCH)
            const newQuantity = existingItem.quantidade + quantidade;
            authFetch(`/consumiveis-evento/${existingItem.id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ quantidade: newQuantity }),
            }).then(res => {
                if (res.ok) {
                    onConsumableAdded();
                    setSelectedConsumableId('');
                    setQuantidade(1);
                } else {
                    alert("Falha ao atualizar a quantidade do consumível.");
                }
            });
        } else {
            // Se o item NÃO EXISTE, criamos um novo (POST)
            const consumableData = {
                evento: eventoId,
                consumivel_id: selectedConsumableId,
                quantidade: quantidade,
            };
            authFetch('/consumiveis-evento/', {
                method: 'POST',
                body: JSON.stringify(consumableData),
            }).then(res => {
                if (res.ok) {
                    onConsumableAdded();
                    setSelectedConsumableId('');
                    setQuantidade(1);
                } else {
                    alert("Falha ao adicionar novo consumível.");
                }
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Adicionar Consumível</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Item Consumível</InputLabel>
                <Select value={selectedConsumableId} label="Item Consumível" onChange={e => setSelectedConsumableId(e.target.value)}>
                    {(allConsumables || []).map(c => <MenuItem key={c.id} value={c.id}>{c.nome} ({c.unidade_medida})</MenuItem>)}
                </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField label="Qtd." type="number" value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value, 10) || 1)} sx={{ width: 150 }} InputProps={{ inputProps: { min: 1 } }} size="small" />
                <Button type="submit" variant="contained">Adicionar / Atualizar</Button>
            </Box>
        </Box>
    );
}

export default AddConsumableForm;