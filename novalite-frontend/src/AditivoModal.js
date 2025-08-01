// Em: src/AditivoModal.js

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, Box,
    Typography, List, ListItem, ListItemText, IconButton, Paper,
    Select, MenuItem, FormControl, InputLabel, TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { authFetch } from './api';

function AditivoModal({ evento, onClose, onSuccess }) {
    const [aditivoItens, setAditivoItens] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    const [descricao, setDescricao] = useState('');
    
    // Estados para o formulário de adicionar item
    const [equipamentoId, setEquipamentoId] = useState('');
    const [quantidade, setQuantidade] = useState(1);

    useEffect(() => {
        authFetch('/equipamentos/')
            .then(res => res.json())
            .then(data => setAllEquipment(data.results || data));
    }, []);

    const handleAddItemToList = () => {
        if (!equipamentoId || quantidade <= 0) {
            alert("Selecione um equipamento e uma quantidade válida.");
            return;
        }
        const equipamento = allEquipment.find(eq => eq.id === equipamentoId);
        if (equipamento) {
            const newItem = { equipamento, equipamento_id: equipamento.id, quantidade };
            setAditivoItens(prevItems => [...prevItems, newItem]);
            // Limpa os campos para o próximo item
            setEquipamentoId('');
            setQuantidade(1);
        }
    };

    const handleRemoveItemFromList = (index) => {
        setAditivoItens(prevItems => prevItems.filter((_, i) => i !== index));
    };

    const handleSubmitAditivo = () => {
        if (aditivoItens.length === 0) {
            alert("Nenhum item foi adicionado ao aditivo.");
            return;
        }
        if (!descricao) {
            alert("Uma descrição para o aditivo é obrigatória.");
            return;
        }
        const payload = {
            operacao_original: evento.id,
            descricao: descricao,
            materiais_aditivo: aditivoItens.map(item => ({
                equipamento_id: item.equipamento_id,
                quantidade: item.quantidade,
            }))
        };

        authFetch(`/aditivos/`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => {
            alert('Aditivo criado com sucesso!');
            onSuccess(); // Atualiza a página de detalhes
        })
        .catch(error => alert(`Erro ao salvar aditivo: ${error.detail || 'Ocorreu um problema.'}`));
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Criar Aditivo para: {evento.nome}</DialogTitle>
            <DialogContent>
                <TextField
                    label="Descrição do Aditivo (ex: Pedido extra do cliente)"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    required
                    sx={{ my: 2 }}
                />
                
                <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Selecione o Equipamento</InputLabel>
                        <Select value={equipamentoId} label="Selecione o Equipamento" onChange={e => setEquipamentoId(e.target.value)}>
                            {(allEquipment || []).map(eq => (
                                <MenuItem key={eq.id} value={eq.id}>{eq.modelo} (Estoque: {eq.quantidade_estoque})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField label="Qtd." type="number" value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value))} size="small" sx={{ width: 100 }} />
                    <Button variant="outlined" onClick={handleAddItemToList} startIcon={<AddCircleIcon />}>Adicionar</Button>
                </Box>

                {aditivoItens.length > 0 && (
                    <Paper sx={{ p: 1 }}>
                        <Typography variant="subtitle1" sx={{ ml: 2 }}>Itens no Aditivo:</Typography>
                        <List dense>
                            {aditivoItens.map((item, index) => (
                                <ListItem key={index} secondaryAction={
                                    <IconButton edge="end" onClick={() => handleRemoveItemFromList(index)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }>
                                    <ListItemText primary={`${item.quantidade}x ${item.equipamento.modelo}`} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmitAditivo} variant="contained">Salvar Aditivo</Button>
            </DialogActions>
        </Dialog>
    );
}

export default AditivoModal;