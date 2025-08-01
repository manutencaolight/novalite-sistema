// Em: src/EventDetail.js (Versão com Correção na Exibição das Tabelas)

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
import AditivoModal from './AditivoModal';

function EventDetail() {
    const [evento, setEvento] = useState(null);
    const [editingMaterialId, setEditingMaterialId] = useState(null);
    const [editingQuantity, setEditingQuantity] = useState('');
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [error, setError] = useState('');
    const { id } = useParams();
    const { user } = useAuth();
    const [isAditivoModalOpen, setAditivoModalOpen] = useState(false);

    const fetchData = useCallback(() => {
        authFetch(`/eventos/${id}/`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha ao carregar a operação.')))
            .then(data => setEvento(data))
            .catch(err => setError(err.message));
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // O restante das suas funções (handleAction, etc.) permanecem as mesmas...
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

    const isPlanning = evento.status === 'PLANEJAMENTO';
    const isOwner = user && evento.criado_por && user.user_id === evento.criado_por.id;
    const isAdmin = user && user.role === 'admin';
    const podeEditar = (isOwner || isAdmin) && isPlanning;
    const canBeCancelled = ['PLANEJAMENTO', 'AGUARDANDO_CONFERENCIA', 'AGUARDANDO_SAIDA'].includes(evento.status);
    const podeCriarAditivo = (isOwner || isAdmin) && ['AGUARDANDO_CONFERENCIA', 'AGUARDANDO_SAIDA', 'EM_ANDAMENTO'].includes(evento.status);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {isCancelModalOpen && <CancelOperationModal evento={evento} onClose={() => setCancelModalOpen(false)} onSuccess={() => { setCancelModalOpen(false); fetchData(); }} />}
            {isAditivoModalOpen && <AditivoModal evento={evento} onClose={() => setAditivoModalOpen(false)} onSuccess={fetchData} />}

            <Button component={Link} to="/eventos" sx={{ mb: 2 }}>← Voltar para a Lista</Button>
            
            {/* --- SEÇÃO DO CABEÇALHO --- */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4">{evento.nome || "Operação Sem Nome"}</Typography>
                        <Chip label={evento.status_display} color={getStatusChipColor(evento.status)} />
                    </Box>
                    {podeCriarAditivo && (
                        <Button variant="outlined" color="secondary" startIcon={<AddCircleOutlineIcon />} onClick={() => setAditivoModalOpen(true)}>
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
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Gerir Equipamentos { !podeEditar && "(Lista Travada)" }</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{fontWeight: 'bold'}}>Item</TableCell>
                                        <TableCell sx={{fontWeight: 'bold'}}>Qtd.</TableCell>
                                        <TableCell align="right" sx={{fontWeight: 'bold'}}>Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* --- CORREÇÃO APLICADA AQUI --- */}
                                    {(evento.materialevento_set || []).map((mat) => (
                                        <TableRow key={mat.id} hover>
                                            <TableCell>{mat.equipamento?.modelo || mat.item_descricao}</TableCell>
                                            <TableCell>
                                                {editingMaterialId === mat.id ? (
                                                    <TextField type="number" value={editingQuantity} onChange={(e) => setEditingQuantity(parseInt(e.target.value))} size="small" sx={{ width: '80px' }} />
                                                ) : (mat.quantidade)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {podeEditar && (
                                                    editingMaterialId === mat.id ? (
                                                        <>
                                                            <Tooltip title="Confirmar"><IconButton color="success" size="small" onClick={() => handleUpdateMaterial(mat.id)}><CheckIcon /></IconButton></Tooltip>
                                                            <Tooltip title="Cancelar"><IconButton size="small" onClick={handleCancelEdit}><CloseIcon /></IconButton></Tooltip>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Tooltip title="Editar"><IconButton color="primary" size="small" onClick={() => handleEditClick(mat)}><EditIcon /></IconButton></Tooltip>
                                                            <Tooltip title="Remover"><IconButton color="error" size="small" onClick={() => handleRemoveMaterial(mat.id)}><DeleteIcon /></IconButton></Tooltip>
                                                        </>
                                                    )
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {podeEditar && <AddMaterialForm eventoId={id} onMaterialAdded={fetchData} />}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Gerir Consumíveis { !podeEditar && "(Travado)" }</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{fontWeight: 'bold'}}>Item</TableCell>
                                        <TableCell sx={{fontWeight: 'bold'}}>Qtd.</TableCell>
                                        {podeEditar && <TableCell align="right" sx={{fontWeight: 'bold'}}>Ações</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* --- CORREÇÃO APLICADA AQUI --- */}
                                    {(evento.consumiveis_set || []).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.consumivel.nome}</TableCell>
                                            <TableCell>{item.quantidade}</TableCell>
                                            {podeEditar && (
                                                <TableCell align="right">
                                                    <Tooltip title="Remover">
                                                        <IconButton size="small" color="error" onClick={() => handleRemoveConsumable(item.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {podeEditar && <AddConsumableForm eventoId={id} onConsumableAdded={fetchData} existingConsumables={evento.consumiveis_set || []} />}
                    </Paper>
                </Grid>
            </Grid>
            
            {/* --- SEÇÃO DOS BOTÕES DE AÇÃO --- */}
            <Paper sx={{ p: 3, mt: 8 }}>
                <Typography variant="h6" gutterBottom>Ações da Operação</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {isPlanning && podeEditar && (
                        <Button variant="contained" onClick={() => handleAction('enviar_para_conferencia', {}, 'Tem a certeza que deseja enviar para a conferência da Logística?')}>
                            ✔️ Enviar para Logística
                        </Button>
                    )}
                    {isAdmin && canBeCancelled && (
                        <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setCancelModalOpen(true)}>
                            Cancelar Operação
                        </Button>
                    )}
                    {!((isPlanning && podeEditar) || (isAdmin && canBeCancelled)) && (
                        <Typography variant="body2" color="text.secondary">Nenhuma ação principal disponível para o status atual.</Typography>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}
export default EventDetail;