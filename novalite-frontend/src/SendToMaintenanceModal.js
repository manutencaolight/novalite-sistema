// Em: src/SendToMaintenanceModal.js

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button,
    TextField, Typography, Box, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { authFetch } from './api';

function SendToMaintenanceModal({ onClose, onSuccess }) {
    const [allEquipment, setAllEquipment] = useState([]);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [descricaoProblema, setDescricaoProblema] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Busca apenas equipamentos que têm estoque para poderem ser enviados
        authFetch('/equipamentos/?quantidade_estoque__gt=0')
            .then(res => res.json())
            .then(data => setAllEquipment(data.results || data));
    }, []);

    const getSelectedEquipment = () => {
        return allEquipment.find(eq => eq.id === selectedEquipmentId);
    };

    const handleSubmit = () => {
        setError('');
        const equipamento = getSelectedEquipment();
        if (!equipamento || quantidade <= 0 || !descricaoProblema) {
            setError('Todos os campos são obrigatórios.');
            return;
        }
        if (quantidade > equipamento.quantidade_estoque) {
            setError(`Quantidade excede o estoque de ${equipamento.quantidade_estoque} unidades.`);
            return;
        }

        const payload = {
            quantidade,
            descricao_problema: descricaoProblema,
        };

        authFetch(`/equipamentos/${selectedEquipmentId}/enviar_para_manutencao/`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        .then(async res => {
            const data = await res.json();
            if (res.ok) return data;
            throw new Error(data.error || `Erro ${res.status}`);
        })
        .then(data => {
            alert(data.status);
            onSuccess();
        })
        .catch(err => {
            setError(err.message);
        });
    };

    const selectedEquipment = getSelectedEquipment();

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Enviar Equipamento para Manutenção</DialogTitle>
            <DialogContent>
                <Box component="form" noValidate sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth required>
                        <InputLabel>Equipamento</InputLabel>
                        <Select value={selectedEquipmentId} label="Equipamento" onChange={e => setSelectedEquipmentId(e.target.value)}>
                            {(allEquipment || []).map(eq => (
                                <MenuItem key={eq.id} value={eq.id}>
                                    {eq.modelo} (Estoque: {eq.quantidade_estoque})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Quantidade para Enviar"
                        type="number"
                        required
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value))}
                        InputProps={{ inputProps: { min: 1, max: selectedEquipment?.quantidade_estoque } }}
                    />
                    <TextField
                        label="Descrição do Problema"
                        multiline
                        rows={3}
                        required
                        value={descricaoProblema}
                        onChange={(e) => setDescricaoProblema(e.target.value)}
                    />
                    {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" color="warning">
                    Confirmar Envio
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SendToMaintenanceModal;