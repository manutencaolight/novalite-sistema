// Em: src/AddEquipmentForm.js (Versão com Design Profissional)

import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Button, Select, MenuItem, FormControl,
    InputLabel, Typography, Grid
} from '@mui/material';

function AddEquipmentForm({ onSave, editingItem, onCancelEdit }) {
    const [modelo, setModelo] = useState('');
    const [fabricante, setFabricante] = useState('');
    const [categoria, setCategoria] = useState('');
    const [quantidadeEstoque, setQuantidadeEstoque] = useState(0);
    const [quantidadeManutencao, setQuantidadeManutencao] = useState(0);
    const [peso, setPeso] = useState(0); // <-- 1. Estado para o peso


    const categoriasDisponiveis = [
        "Acessórios em Geral", "Adaptadores", "Consoles", "Efeitos", "Estruturas", 
        "Iluminação Convencional", "LEDs", "Moving Lights", "Prolongas e Chicotes", 
        "Rack Dimmer", "Sonorização", "Vídeo", "Outros"
    ];
    categoriasDisponiveis.sort();

    useEffect(() => {
        if (editingItem) {
            setModelo(editingItem.modelo || '');
            setFabricante(editingItem.fabricante || '');
            setCategoria(editingItem.categoria || '');
            setQuantidadeEstoque(editingItem.quantidade_estoque || 0);
            setQuantidadeManutencao(editingItem.quantidade_manutencao || 0);
        } else {
            setModelo(''); setFabricante(''); setCategoria(''); 
            setQuantidadeEstoque(0); setQuantidadeManutencao(0);
            setPeso(0); // <-- Limpa o peso ao criar novo
        }
    }, [editingItem]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({ 
            modelo, fabricante, categoria, 
            quantidade_estoque: quantidadeEstoque, 
            quantidade_manutencao: quantidadeManutencao,
            peso: peso // <-- 3. Envia o peso ao salvar
        }, editingItem ? editingItem.id : null);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="h6" gutterBottom>
                {editingItem ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                    <TextField label="Modelo" value={modelo} onChange={e => setModelo(e.target.value)} required fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Fabricante" value={fabricante} onChange={e => setFabricante(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth required>
                        <InputLabel>Categoria</InputLabel>
                        <Select value={categoria} label="Categoria" onChange={e => setCategoria(e.target.value)}>
                            {categoriasDisponiveis.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Quantidade em Estoque" type="number" value={quantidadeEstoque} onChange={e => setQuantidadeEstoque(parseInt(e.target.value, 10) || 0)} required fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Quantidade em Manutenção" type="number" value={quantidadeManutencao} onChange={e => setQuantidadeManutencao(parseInt(e.target.value, 10) || 0)} required fullWidth />
                </Grid>
                {/* --- 4. CAMPO DE PESO ADICIONADO AQUI --- */}
                <Grid item xs={12} sm={4}>
                    <TextField label="Peso (kg)" type="number" step="0.1" value={peso} onChange={e => setPeso(parseFloat(e.target.value) || 0)} fullWidth />
                </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" color="primary">
                    {editingItem ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outlined" onClick={onCancelEdit}>
                    Cancelar
                </Button>
            </Box>
        </Box>
    );
}
export default AddEquipmentForm;