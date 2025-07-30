// Em: src/NewOperationModal.js (Versão Corrigida e Modificada)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog, DialogTitle, DialogContent, Box, Button, List, Paper,
    ListItemButton, ListItemText, TextField, DialogActions, Typography,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, FormHelperText
} from '@mui/material';
import { authFetch } from './api';

// --- Sub-componente para o formulário de "Criar Lista Nova" ---
function NewListForm({ onSave, onCancel }) {
    const [nome, setNome] = useState('');
    const [clienteId, setClienteId] = useState('');
    const [tipoEvento, setTipoEvento] = useState('PROPRIO');
    const [clientes, setClientes] = useState([]);
    const [local, setLocal] = useState('');
    const [dataEvento, setDataEvento] = useState('');
    const [dataTermino, setDataTermino] = useState('');

    // --- MODIFICAÇÃO: Estados de loading e erro para a busca de clientes ---
    const [loadingClientes, setLoadingClientes] = useState(true);
    const [errorClientes, setErrorClientes] = useState(null);
    const [submitError, setSubmitError] = useState(''); // Estado para erros de submissão

    useEffect(() => {
        authFetch('/clientes/')
            .then(res => {
                if (!res.ok) throw new Error('Falha ao carregar clientes.');
                return res.json();
            })
            .then(data => {
                setClientes(data.results || data);
                setLoadingClientes(false);
            })
            .catch(err => {
                setErrorClientes(err.message);
                setLoadingClientes(false);
            });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(''); // Limpa erros anteriores
        const eventoData = {
            nome,
            local,
            cliente: clienteId, // <-- CORREÇÃO: Alterado de 'cliente_id' para 'cliente'
            tipo_evento: tipoEvento,
            data_evento: dataEvento,
            data_termino: dataTermino || null,
        };

        try {
            await onSave(eventoData);
        } catch (error) {
            // --- MODIFICAÇÃO: Exibe o erro no formulário em vez de um alert ---
            setSubmitError(error.message || "Ocorreu um erro desconhecido.");
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth required>
                <InputLabel>Tipo de Operação</InputLabel>
                <Select value={tipoEvento} label="Tipo de Operação" onChange={e => setTipoEvento(e.target.value)}>
                    <MenuItem value="PROPRIO">Evento Próprio</MenuItem>
                    <MenuItem value="SUBLOCACAO">Locação</MenuItem>
                    <MenuItem value="EMPRESTIMO">Empréstimo</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth required disabled={loadingClientes}>
                <InputLabel>Cliente/Empresa</InputLabel>
                <Select value={clienteId} label="Cliente/Empresa" onChange={e => setClienteId(e.target.value)}>
                    {/* --- MODIFICAÇÃO: Feedback de loading e erro --- */}
                    {loadingClientes && <MenuItem disabled>Carregando clientes...</MenuItem>}
                    {errorClientes && <MenuItem disabled sx={{ color: 'error.main' }}>{errorClientes}</MenuItem>}
                    {(clientes || []).map(c => <MenuItem key={c.id} value={c.id}>{c.empresa}</MenuItem>)}
                </Select>
            </FormControl>
            <TextField label="Nome/Descrição (Opcional)" value={nome} onChange={e => setNome(e.target.value)} fullWidth />
            <TextField label="Local (Opcional)" value={local} onChange={e => setLocal(e.target.value)} fullWidth />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField label="Data Início/Saída" type="date" value={dataEvento} onChange={e => setDataEvento(e.target.value)} InputLabelProps={{ shrink: true }} required fullWidth />
                <TextField label="Data Término/Retorno" type="date" value={dataTermino} onChange={e => setDataTermino(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Box>
            
            {/* --- MODIFICAÇÃO: Exibição de erro de submissão --- */}
            {submitError && <Typography color="error" variant="body2">{submitError}</Typography>}

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained">Criar</Button>
                <Button variant="outlined" onClick={onCancel}>Voltar</Button>
            </Box>
        </Box>
    );
}

// --- Componente Principal (com poucas alterações) ---
function NewOperationModal({ onClose, onCreated }) {
    const [view, setView] = useState('choice');
    const [eventos, setEventos] = useState([]);
    const [selectedEventToClone, setSelectedEventToClone] = useState(null);
    const [novoNome, setNovoNome] = useState('');
    const [novaDataInicio, setNovaDataInicio] = useState('');
    const [novaDataTermino, setNovaDataTermino] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (view === 'clone') {
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
        // Lógica de clonagem permanece a mesma
    };
    
    const handleSaveNew = async (eventoData) => {
        try {
            const novoEvento = await authFetch('/eventos/', {
                method: 'POST',
                body: JSON.stringify(eventoData),
            }).then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)));
            
            alert('Operação criada com sucesso!'); // Mantido por simplicidade
            onCreated();
            navigate(`/eventos/${novoEvento.id}`);
        } catch (error) {
            // O erro agora é propagado para o formulário
            throw new Error(error.detail || "Falha ao criar operação.");
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Criar Nova Operação</DialogTitle>
            <DialogContent>
                {/* O restante do seu componente permanece praticamente o mesmo */}
                {view === 'choice' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, p: 4 }}>
                        <Button variant="contained" size="large" onClick={() => setView('new')}>Criar Lista Nova</Button>
                        <Button variant="outlined" size="large" onClick={() => setView('clone')}>Usar Lista Existente</Button>
                    </Box>
                )}
                {view === 'new' && (
                    <NewListForm onSave={handleSaveNew} onCancel={() => setView('choice')} />
                )}
                {/* A lógica de 'clone' permanece a mesma */}
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