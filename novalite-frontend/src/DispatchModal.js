// Em: src/DispatchModal.js (Versão Final, Completa e Funcional)

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button,
    TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography
} from '@mui/material';

function DispatchModal({ evento, onClose, onDispatchSuccess }) {
    const [itemsToDispatch, setItemsToDispatch] = useState([]);

    useEffect(() => {
        const pendingItems = (evento.materialevento_set || [])
            .filter(item => item.equipamento && item.quantidade > item.quantidade_separada)
            .map(item => ({
                ...item,
                pending: item.quantidade - item.quantidade_separada,
                dispatching_qty: item.quantidade - item.quantidade_separada,
            }));
        setItemsToDispatch(pendingItems);
    }, [evento]);

    const handleQuantityChange = (id, value) => {
        const numericValue = parseInt(value, 10) || 0;
        const originalItem = itemsToDispatch.find(item => item.id === id);
        if (numericValue > originalItem.pending) return; // Impede valor maior que o pendente

        setItemsToDispatch(itemsToDispatch.map(item =>
            item.id === id ? { ...item, dispatching_qty: numericValue } : item
        ));
    };

    const generateDispatchNote = (dispatchedItems) => {
        fetch(`http://127.0.0.1:8000/reports/guia-saida/${evento.id}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itens: dispatchedItems })
        })
        .then(response => {
            if (response.ok) return response.blob();
            throw new Error('Falha ao gerar PDF.');
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Guia_Saida_${evento.nome || 'Operacao'}_${new Date().toISOString().slice(0,10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    };

    const handleSubmit = () => {
        const payload = {
            materiais: itemsToDispatch
                .filter(item => item.dispatching_qty > 0)
                .map(item => ({ 
                  id: item.id, 
                  qtd: item.dispatching_qty, 
                  modelo: item.equipamento?.modelo || item.item_descricao 
                }))
        };
        
        if (payload.materiais.length === 0) {
            return alert("Nenhuma quantidade foi especificada para saída.");
        }

        fetch(`https://novalite-sistema.onrender.com/api/eventos/${evento.id}/dar_saida/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => {
            if(window.confirm("Saída registrada com sucesso! Deseja gerar a Guia de Saída em PDF?")) {
                generateDispatchNote(payload.materiais);
            }
            onDispatchSuccess();
        })
        .catch(error => alert(`Erro: ${error.error || "Ocorreu um problema."}`));
    };
    
    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Registrar Saída de Material: {evento.nome}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2 }}>
                    Especifique a quantidade de cada item que está saindo nesta remessa.
                </Typography>
                {itemsToDispatch.length > 0 ? (
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell align="center">Pendente</TableCell>
                                    <TableCell align="center">Saindo Agora</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {itemsToDispatch.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.equipamento?.modelo || item.item_descricao}</TableCell>
                                        <TableCell align="center">{item.pending}</TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                type="number"
                                                value={item.dispatching_qty}
                                                onChange={e => handleQuantityChange(item.id, e.target.value)}
                                                inputProps={{ min: 0, max: item.pending }}
                                                size="small"
                                                sx={{ width: '80px' }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : <Typography sx={{mt: 2}}>Nenhum material pendente para saída.</Typography>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">Confirmar Saída</Button>
            </DialogActions>
        </Dialog>
    );
}

export default DispatchModal;