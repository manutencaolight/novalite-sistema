// Em: src/ReturnFromMaintenanceModal.js

import React, { useState } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle,
    Button, TextField, Typography
} from '@mui/material';
import { authFetch } from './api'; // USA AUTH FETCH

function ReturnFromMaintenanceModal({ equipamento, onClose, onSuccess }) {
    const [quantidade, setQuantidade] = useState(equipamento.quantidade_manutencao);

    const handleConfirm = () => {
        if (quantidade <= 0 || quantidade > equipamento.quantidade_manutencao) {
            alert(`Por favor, insira uma quantidade válida (entre 1 e ${equipamento.quantidade_manutencao}).`);
            return;
        }

        authFetch(`/equipamentos/${equipamento.id}/retornar_da_manutencao/`, {
            method: 'POST',
            body: JSON.stringify({ quantidade: quantidade }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(() => {
            alert('Equipamento retornado para o estoque com sucesso!');
            onSuccess();
        })
        .catch(error => alert(`Erro: ${error.error || 'Ocorreu um problema.'}`));
    };

    return (
        <Dialog open={true} onClose={onClose}>
            <DialogTitle>Retornar da Manutenção</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2 }}>
                    Quantos itens de <strong>{equipamento.modelo}</strong> voltaram para o estoque?
                </Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    label={`Quantidade (Máx: ${equipamento.quantidade_manutencao})`}
                    type="number"
                    fullWidth
                    variant="standard"
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseInt(e.target.value))}
                    InputProps={{
                        inputProps: { 
                            min: 1, 
                            max: equipamento.quantidade_manutencao 
                        }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleConfirm} variant="contained">Confirmar Retorno</Button>
            </DialogActions>
        </Dialog>
    );
}

export default ReturnFromMaintenanceModal;