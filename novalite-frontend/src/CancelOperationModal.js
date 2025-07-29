// Em: src/CancelOperationModal.js (Versão Corrigida com Autenticação)

import React, { useState } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button,
    TextField, Typography, Box
} from '@mui/material';

// --- 1. IMPORTE A FUNÇÃO authFetch ---
import { authFetch } from './api';

function CancelOperationModal({ evento, onClose, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        setError('');
        if (!motivo || !password) {
            setError('Todos os campos são obrigatórios.');
            return;
        }

        // --- 2. SUBSTITUA 'fetch' POR 'authFetch' ---
        // Note que a URL agora é relativa, pois a base já está no authFetch.
        authFetch(`/eventos/${evento.id}/cancelar_operacao/`, {
            method: 'POST',
            body: JSON.stringify({ motivo, password }),
        })
        .then(async res => {
            const data = await res.json();
            if (res.ok) {
                return data;
            } else {
                // Se a resposta não for OK, lança um erro com a mensagem do backend
                throw new Error(data.error || `Erro ${res.status}`);
            }
        })
        .then(data => {
            alert(data.status);
            onSuccess();
        })
        .catch(err => {
            setError(err.message);
        });
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Cancelar Operação: {evento.nome}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2 }} color="text.secondary">
                    Atenção: Esta ação é irreversível e requer permissão de administrador.
                </Typography>
                <Box component="form" noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        multiline
                        rows={3}
                        label="Motivo do Cancelamento"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        type="password"
                        label="Sua Senha de Administrador"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
                <Button onClick={handleSubmit} variant="contained" color="error">
                    Confirmar Cancelamento
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CancelOperationModal;