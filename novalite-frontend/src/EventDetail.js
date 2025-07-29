// Em: src/EventDetail.js (Versão Final com Gestão de Consumíveis)

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
import AddMaterialForm from './AddMaterialForm';
import CancelOperationModal from './CancelOperationModal';
import { getStatusChipColor } from './utils/colorUtils';
import { useAuth } from './AuthContext';
import { authFetch } from './api';
import AddConsumableForm from './AddConsumableForm'; // <-- 1. IMPORTA O NOVO FORMULÁRIO

function EventDetail() {
    const [evento, setEvento] = useState(null);
    const [editingMaterialId, setEditingMaterialId] = useState(null);
    const [editingQuantity, setEditingQuantity] = useState('');
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [error, setError] = useState('');
    const { id } = useParams();
    const { user } = useAuth();

    const fetchData = useCallback(() => {
        authFetch(`/eventos/${id}/`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha ao carregar a operação.')))
            .then(data => setEvento(data))
            .catch(err => setError(err.message));
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

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
    
    // --- 2. NOVA FUNÇÃO PARA REMOVER CONSUMÍVEIS ---
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

    const isPlanning = evento.status === 'PLANEJAMENTO';
    const canBeCancelled = ['PLANEJAMENTO', 'AGUARDANDO_CONFERENCIA', 'AGUARDANDO_SAIDA'].includes(evento.status);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {isCancelModalOpen && <CancelOperationModal evento={evento} onClose={() => setCancelModalOpen(false)} onSuccess={() => { setCancelModalOpen(false); fetchData(); }} />}
            
            <Button component={Link} to="/eventos" sx={{ mb: 2 }}>← Voltar para a Lista</Button>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4">{evento.nome || "Operação Sem Nome"}</Typography>
                    <Chip label={evento.status_display} color={getStatusChipColor(evento.status)} />
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                    {evento.cliente?.empresa} - {new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                </Typography>
            </Paper>

            {evento.status === 'CANCELADO' && <Alert severity="error" sx={{ mb: 3 }}><strong>Operação Cancelada:</strong> {evento.motivo_cancelamento}</Alert>}
            {isPlanning && evento.observacao_correcao && <Alert severity="warning" sx={{ mb: 3 }}><strong>Retornado pela Logística:</strong> {evento.observacao_correcao}</Alert>}

            {/* --- 3. LAYOUT ATUALIZADO PARA DUAS COLUNAS --- */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Gerir Equipamentos { !isPlanning && "(Lista Travada)" }</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead><TableRow><TableCell>Item</TableCell><TableCell>Qtd.</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {(evento.materialevento_set || []).map((mat) => (
                                        <TableRow key={mat.id} hover>
                                            <TableCell>{mat.equipamento?.modelo || mat.item_descricao}</TableCell>
                                            <TableCell>{editingMaterialId === mat.id ? (<TextField type="number" value={editingQuantity} onChange={(e) => setEditingQuantity(parseInt(e.target.value))} size="small" sx={{ width: '80px' }} />) : (mat.quantidade)}</TableCell>
                                            <TableCell align="right">
                                                {isPlanning && (editingMaterialId === mat.id ? (<Tooltip title="Confirmar"><IconButton color="success" size="small" onClick={() => handleUpdateMaterial(mat.id)}><CheckIcon /></IconButton></Tooltip>) : (<Tooltip title="Editar"><IconButton color="primary" size="small" onClick={() => handleEditClick(mat)}><EditIcon /></IconButton></Tooltip>))}
                                                {isPlanning && (editingMaterialId === mat.id ? (<Tooltip title="Cancelar"><IconButton size="small" onClick={handleCancelEdit}><CloseIcon /></IconButton></Tooltip>) : (<Tooltip title="Remover"><IconButton color="error" size="small" onClick={() => handleRemoveMaterial(mat.id)}><DeleteIcon /></IconButton></Tooltip>))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {isPlanning && <AddMaterialForm eventoId={id} onMaterialAdded={fetchData} />}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Gerir Consumíveis { !isPlanning && "(Travado)" }</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead><TableRow><TableCell>Item</TableCell><TableCell>Qtd.</TableCell>{isPlanning && <TableCell align="right">Ações</TableCell>}</TableRow></TableHead>
                                <TableBody>
                                    {(evento.consumiveis_set || []).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.consumivel.nome}</TableCell>
                                            <TableCell>{item.quantidade}</TableCell>
                                            {isPlanning && (<TableCell align="right"><Tooltip title="Remover"><IconButton size="small" color="error" onClick={() => handleRemoveConsumable(item.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></TableCell>)}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {isPlanning && <AddConsumableForm 
        eventoId={id} 
        onConsumableAdded={fetchData} 
        // --- ADICIONE ESTA NOVA PROP ---
        existingConsumables={evento.consumiveis_set || []}
    />
}
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ p: 3, mt: 8 }}>
                <Typography variant="h6" gutterBottom>Ações da Operação</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {isPlanning && (<Button variant="contained" onClick={() => handleAction('enviar_para_conferencia', {}, 'Tem a certeza que deseja enviar para a conferência da Logística?')}>✔️ Enviar para Logística</Button>)}
                    {user.role === 'admin' && canBeCancelled && (<Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setCancelModalOpen(true)}>Cancelar Operação</Button>)}
                </Box>
            </Paper>
        </Container>
    );
}

export default EventDetail;