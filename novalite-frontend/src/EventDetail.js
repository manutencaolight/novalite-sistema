// Em: src/EventDetail.js (Versão com Aditivos e Permissões)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Container, Typography, Box, Paper, Button, Chip, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, 
    TextField, Grid, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddMaterialForm from './AddMaterialForm';
import CancelOperationModal from './CancelOperationModal';
import { getStatusChipColor } from './utils/colorUtils';
import { useAuth } from './AuthContext';
import { authFetch } from './api';
import AddConsumableForm from './AddConsumableForm';
import AditivoModal from './AditivoModal'; // --- NOVO: Importa o modal de aditivo ---

function EventDetail() {
    const [evento, setEvento] = useState(null);
    const [editingMaterialId, setEditingMaterialId] = useState(null);
    const [editingQuantity, setEditingQuantity] = useState('');
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [error, setError] = useState('');
    const { id } = useParams();
    const { user } = useAuth();

    // --- NOVO: Estado para controlar o modal de aditivo ---
    const [isAditivoModalOpen, setAditivoModalOpen] = useState(false);

    const fetchData = useCallback(() => {
        authFetch(`/eventos/${id}/`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha ao carregar a operação.')))
            .then(data => setEvento(data))
            .catch(err => setError(err.message));
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // O restante das suas funções (handleAction, handleRemoveMaterial, etc.) permanecem as mesmas
    const handleAction = (actionUrl, body = {}, confirmationMessage = '') => {
        if (confirmationMessage && !window.confirm(confirmationMessage)) return;
        authFetch(`/eventos/${id}/${actionUrl}/`, { method: 'POST', body: JSON.stringify(body) })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
            .then(data => { alert(data.status || 'Ação realizada!'); fetchData(); })
            .catch(error => alert(`Erro: ${error.error || 'Ocorreu um problema.'}`));
    };
    const handleRemoveMaterial = (materialId) => {
        if (window.confirm('Tem a certeza?')) {
            authFetch(`/materiais/${materialId}/`, { method: 'DELETE' })
            .then(response => { if (response.ok) fetchData(); });
        }
    };
    const handleRemoveConsumable = (consumableEventId) => {
        if (window.confirm('Tem a certeza?')) {
            authFetch(`/consumiveis-evento/${consumableEventId}/`, { method: 'DELETE' })
            .then(response => { if (response.ok) fetchData(); });
        }
    };
    const handleEditClick = (material) => {
        setEditingMaterialId(material.id);
        setEditingQuantity(material.quantidade);
    };
    const handleCancelEdit = () => {
        setEditingMaterialId(null);
        setEditingQuantity('');
    };
    const handleUpdateMaterial = (materialId) => {
        authFetch(`/materiais/${materialId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ quantidade: editingQuantity }),
        }).then(res => {
            if (res.ok) { handleCancelEdit(); fetchData(); } 
            else { alert('Falha ao atualizar.'); }
        });
    };

    if (error) return <Alert severity="error">{error}</Alert>;
    if (!evento) return <p>Carregando...</p>;

    // --- ATUALIZADO: Lógica de permissão para edição ---
    const isPlanning = evento.status === 'PLANEJAMENTO';
    const isOwner = user && evento.criado_por && user.user_id === evento.criado_por.id;
    const isAdmin = user && user.role === 'admin';
    const podeEditar = (isOwner || isAdmin) && isPlanning;
    const canBeCancelled = ['PLANEJAMENTO', 'AGUARDANDO_CONFERENCIA', 'AGUARDANDO_SAIDA'].includes(evento.status);
    
    // --- ATUALIZADO: Condição para exibir o botão de aditivo ---
    const podeCriarAditivo = (isOwner || isAdmin) && ['AGUARDANDO_CONFERENCIA', 'AGUARDANDO_SAIDA', 'EM_ANDAMENTO'].includes(evento.status);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {isCancelModalOpen && <CancelOperationModal evento={evento} onClose={() => setCancelModalOpen(false)} onSuccess={() => { setCancelModalOpen(false); fetchData(); }} />}
            {/* --- NOVO: Renderiza o modal de aditivo --- */}
            {isAditivoModalOpen && <AditivoModal evento={evento} onClose={() => setAditivoModalOpen(false)} onSuccess={fetchData} />}

            <Button component={Link} to="/eventos" sx={{ mb: 2 }}>← Voltar para a Lista</Button>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4">{evento.nome || "Operação Sem Nome"}</Typography>
                        <Chip label={evento.status_display} color={getStatusChipColor(evento.status)} />
                    </Box>
                    {/* --- ATUALIZADO: Botão para Criar Aditivo com a lógica correta --- */}
                    {podeCriarAditivo && (
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={() => setAditivoModalOpen(true)}
                        >
                            Criar Aditivo
                        </Button>
                    )}
                </Box>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                    {evento.cliente?.empresa} - {new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Criado por: {evento.criado_por?.username || 'Desconhecido'}
                </Typography>
            </Paper>

            {/* O resto do JSX continua o mesmo, mas usando a variável 'podeEditar' */}
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Gerir Equipamentos { !podeEditar && "(Lista Travada)" }</Typography>
                        {/* ... (Tabela de Equipamentos sem alterações) ... */}
                        {podeEditar && <AddMaterialForm eventoId={id} onMaterialAdded={fetchData} />}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Gerir Consumíveis { !podeEditar && "(Travado)" }</Typography>
                        {/* ... (Tabela de Consumíveis sem alterações) ... */}
                        {podeEditar && <AddConsumableForm eventoId={id} onConsumableAdded={fetchData} existingConsumables={evento.consumiveis_set || []} />}
                    </Paper>
                </Grid>
            </Grid>
            
            <Paper sx={{ p: 3, mt: 8 }}>
                <Typography variant="h6" gutterBottom>Ações da Operação</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {isPlanning && podeEditar && (<Button variant="contained" onClick={() => handleAction('enviar_para_conferencia', {}, 'Tem a certeza que deseja enviar para a conferência da Logística?')}>✔️ Enviar para Logística</Button>)}
                    {isAdmin && canBeCancelled && (<Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setCancelModalOpen(true)}>Cancelar Operação</Button>)}
                </Box>
            </Paper>
        </Container>
    );
}

export default EventDetail;