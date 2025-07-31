// Em: src/ReinforcementModal.js (Versão Final e Definitiva)

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, Box,
    Typography, List, ListItem, ListItemText, IconButton, Paper,
    Select, MenuItem, FormControl, InputLabel, TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { authFetch } from './api';

function ReinforcementModal({ evento, onClose, onSuccess }) {
    const [reforcoItens, setReforcoItens] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    
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
            setReforcoItens(prevItems => [...prevItems, newItem]);
            setEquipamentoId('');
            setQuantidade(1);
        }
    };

    const handleRemoveItemFromList = (index) => {
        setReforcoItens(prevItems => prevItems.filter((_, i) => i !== index));
    };

    const generateReinforcementNote = (itemsParaGuia) => {
        // --- CORREÇÃO AQUI: Removido o bloco de código 'fetch' duplicado e incorreto ---
        // Agora, usa apenas authFetch
        authFetch(`/reports/evento/${evento.id}/guia-reforco/`, {
            method: 'POST',
            body: JSON.stringify({ itens: itemsParaGuia })
        })
        .then(response => {
            if (response.ok) return response.blob();
            throw new Error('Falha ao gerar PDF de reforço.');
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Guia_Reforco_${evento.nome || 'Operacao'}_${new Date().toISOString().slice(0,10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => alert(`Erro ao gerar PDF: ${error.message}`));
    };

    const handleSubmitReinforcement = () => {
        if (reforcoItens.length === 0) {
            alert("Nenhum item de reforço foi adicionado.");
            return;
        }
        const payload = {
            materiais: reforcoItens.map(item => ({
                equipamento_id: item.equipamento_id,
                quantidade: item.quantidade,
            }))
        };

        authFetch(`/eventos/${evento.id}/adicionar_reforco/`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => {
            // A LÓGICA CORRETA ESTÁ AQUI:
            if(window.confirm(data.status + ". Deseja gerar a Guia de Saída para este reforço?")) {
                const itemsParaGuia = reforcoItens.map(item => ({
                    modelo: item.equipamento.modelo,
                    qtd: item.quantidade
                }));
                generateReinforcementNote(itemsParaGuia);
            }
            onSuccess();
        })
        .catch(error => alert(`Erro ao salvar reforço: ${error.error || 'Ocorreu um problema.'}`));
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Adicionar Material Extra (Reforço)</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2 }}>
                    Adicione os itens e quantidades necessários. O estoque será deduzido e a saída será registrada.
                </Typography>
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
                {reforcoItens.length > 0 && (
                    <Paper sx={{ p: 1 }}>
                        <Typography variant="subtitle1" sx={{ ml: 2 }}>Itens para Reforço:</Typography>
                        <List dense>
                            {reforcoItens.map((item, index) => (
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
                <Button onClick={handleSubmitReinforcement} variant="contained">Confirmar Saída do Reforço</Button>
            </DialogActions>
        </Dialog>
    );
}

export default ReinforcementModal;