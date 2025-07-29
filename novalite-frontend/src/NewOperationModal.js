// Em: src/NewOperationModal.js (Versão Corrigida com Autenticação)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog, DialogTitle, DialogContent, Box, Button, List, Paper,
    ListItemButton, ListItemText, TextField, DialogActions, Typography,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
// --- 1. IMPORTA A FUNÇÃO authFetch ---
import { authFetch } from './api';

// O formulário de "Criar Lista Nova" agora vive aqui dentro.
function NewListForm({ onSave, onCancel }) {
    const [nome, setNome] = useState('');
    const [clienteId, setClienteId] = useState('');
    const [tipoEvento, setTipoEvento] = useState('PROPRIO');
    const [clientes, setClientes] = useState([]);
    const [local, setLocal] = useState('');
    const [dataEvento, setDataEvento] = useState('');
    const [dataTermino, setDataTermino] = useState('');

    useEffect(() => {
        // --- 2. USA authFetch PARA BUSCAR OS CLIENTES ---
        authFetch('/clientes/')
            .then(res => res.json())
            .then(data => setClientes(data.results || data));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const eventoData = {
            nome, local, cliente_id: clienteId, tipo_evento: tipoEvento,
            data_evento: dataEvento,
            data_termino: dataTermino || null,
        };
        onSave(eventoData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth required>
                <InputLabel>Tipo de Operação</InputLabel>
                <Select value={tipoEvento} label="Tipo de Operação" onChange={e => setTipoEvento(e.target.value)}>
                    <MenuItem value="PROPRIO">Evento Próprio</MenuItem>
                    <MenuItem value="SUBLOCACAO">Sublocação</MenuItem>
                    <MenuItem value="EMPRESTIMO">Empréstimo</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth required>
                <InputLabel>Cliente/Empresa</InputLabel>
                <Select value={clienteId} label="Cliente/Empresa" onChange={e => setClienteId(e.target.value)}>
                    {(clientes || []).map(c => <MenuItem key={c.id} value={c.id}>{c.empresa}</MenuItem>)}
                </Select>
            </FormControl>
            <TextField label="Nome/Descrição (Opcional)" value={nome} onChange={e => setNome(e.target.value)} fullWidth />
            <TextField label="Local (Opcional)" value={local} onChange={e => setLocal(e.target.value)} fullWidth />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField label="Data Início/Saída" type="date" value={dataEvento} onChange={e => setDataEvento(e.target.value)} InputLabelProps={{ shrink: true }} required fullWidth />
                <TextField label="Data Término/Retorno" type="date" value={dataTermino} onChange={e => setDataTermino(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained">Criar</Button>
                <Button variant="outlined" onClick={onCancel}>Voltar</Button>
            </Box>
        </Box>
    );
}

function NewOperationModal({ onClose, onCreated }) {
    const [view, setView] = useState('choice'); // choice, new, clone
    const [eventos, setEventos] = useState([]);
    const [selectedEventToClone, setSelectedEventToClone] = useState(null);
    const [novoNome, setNovoNome] = useState('');
    const [novaDataInicio, setNovaDataInicio] = useState('');
    const [novaDataTermino, setNovaDataTermino] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (view === 'clone') {
            // --- 3. USA authFetch TAMBÉM AQUI ---
            authFetch('/eventos/')
                .then(res => res.json())
                .then(data => setEventos(data.results || data));
        }
    }, [view]);

    useEffect(() => {
        if (selectedEventToClone) {
            setNovoNome(`Cópia de - ${selectedEventToClone.nome || 'Operação'}`);
        }
    }, [selectedEventToClone]);

    const handleClone = () => {
        if (!selectedEventToClone || !novaDataInicio) {
            alert('Selecione uma operação e preencha a nova data de início.');
            return;
        }
        const payload = {
            novo_nome: novoNome,
            nova_data_evento: novaDataInicio,
            nova_data_termino: novaDataTermino || null
        };
        // --- 4. USA authFetch PARA A AÇÃO DE CLONAR ---
        authFetch(`/eventos/${selectedEventToClone.id}/clone/`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        .then(res => res.ok ? res.json() : Promise.reject('Falha ao duplicar.'))
        .then(newEvento => {
            alert(`Operação duplicada com sucesso!`);
            onCreated();
            navigate(`/eventos/${newEvento.id}`);
        })
        .catch(error => alert(`Erro: ${error.message}`));
    };
    
    const handleSaveNew = (eventoData) => {
        // --- 5. USA authFetch PARA CRIAR A NOVA OPERAÇÃO ---
        authFetch('/eventos/', {
            method: 'POST',
            body: JSON.stringify(eventoData),
        }).then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then((novoEvento) => {
            alert('Operação criada com sucesso!');
            onCreated();
            navigate(`/eventos/${novoEvento.id}`);
        })
        .catch(error => alert(`Erro: ${error.detail || "Falha ao criar operação."}`));
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Criar Nova Operação</DialogTitle>
            <DialogContent>
                {view === 'choice' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, p: 4 }}>
                        <Button variant="contained" size="large" onClick={() => setView('new')}>Criar Lista Nova</Button>
                        <Button variant="outlined" size="large" onClick={() => setView('clone')}>Usar Lista Existente</Button>
                    </Box>
                )}
                {view === 'new' && (
                    <NewListForm onSave={handleSaveNew} onCancel={() => setView('choice')} />
                )}
                {view === 'clone' && (
                    <Box sx={{pt: 2}}>
                        <Typography sx={{ mb: 1 }}>1. Selecione uma operação para duplicar:</Typography>
                        <Paper sx={{ maxHeight: 200, overflow: 'auto', mb: 2, border: '1px solid #ddd' }}>
                            <List>
                                {(eventos || []).map(evento => (
                                    <ListItemButton key={evento.id} selected={selectedEventToClone?.id === evento.id} onClick={() => setSelectedEventToClone(evento)}>
                                        <ListItemText primary={evento.nome} secondary={new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>
                        <Typography sx={{ mb: 2 }}>2. Edite as informações da nova operação:</Typography>
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                           <TextField label="Novo Nome/Descrição" value={novoNome} onChange={e => setNovoNome(e.target.value)} fullWidth />
                           <Box sx={{ display: 'flex', gap: 2}}>
                              <TextField label="Nova Data de Início/Saída" type="date" value={novaDataInicio} onChange={e => setNovaDataInicio(e.target.value)} InputLabelProps={{ shrink: true }} required fullWidth />
                              <TextField label="Nova Data de Término/Retorno" type="date" value={novaDataTermino} onChange={e => setNovaDataTermino(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                           </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={view === 'choice' ? onClose : () => setView('choice')}>
                    {view === 'choice' ? 'Fechar' : 'Voltar'}
                </Button>
                {view === 'clone' && <Button onClick={handleClone} variant="contained">Criar Cópia</Button>}
            </DialogActions>
        </Dialog>
    );
}
export default NewOperationModal;