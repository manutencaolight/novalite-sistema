// Em: src/ManageMaintenanceModal.js (Versão Final e Corrigida)

import React, { useState } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button,
    TextField, Select, MenuItem, FormControl, InputLabel, Typography
} from '@mui/material';
import { authFetch } from './api'; // 1. Importa a função correta

function ManageMaintenanceModal({ item, onClose, onSuccess }) {
    const [status, setStatus] = useState(item.status);
    const [solucao, setSolucao] = useState(item.solucao_aplicada || '');

    const handleSave = () => {
        const payload = {
            status: status,
            solucao_aplicada: solucao,
        };
        // CORREÇÃO: A string da URL agora usa crase (`) no início e no fim
        // para permitir o uso da variável ${item.id}
        authFetch(`/manutencao/${item.id}/atualizar_status/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => {
            alert(data.status);
            onSuccess();
        })
        .catch(error => alert(`Erro: ${error.error || 'Ocorreu um problema.'}`));
    };

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Gerenciar Manutenção</DialogTitle>
            <DialogContent>
                <Typography variant="h6" gutterBottom>{item.equipamento.modelo}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <strong>Problema Reportado:</strong> {item.descricao_problema}
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Status do Reparo</InputLabel>
                    <Select value={status} label="Status do Reparo" onChange={e => setStatus(e.target.value)}>
                        <MenuItem value="AGUARDANDO_AVALIACAO">Aguardando Avaliação</MenuItem>
                        <MenuItem value="EM_REPARO">Em Reparo</MenuItem>
                        <MenuItem value="AGUARDANDO_PECAS">Aguardando Peças</MenuItem>
                        <MenuItem value="REPARADO">Reparado / Devolver ao Estoque</MenuItem>
                    </Select>
                </FormControl>
                <TextField 
                    label="Solução Aplicada / Observações"
                    fullWidth multiline rows={4}
                    value={solucao}
                    onChange={e => setSolucao(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained">Salvar Alterações</Button>
            </DialogActions>
        </Dialog>
    );
}
export default ManageMaintenanceModal;
// CORREÇÃO: Removida a chave '}' extra que estava aqui no final