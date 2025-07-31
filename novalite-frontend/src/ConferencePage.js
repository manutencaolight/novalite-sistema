// Em: src/ConferencePage.js (Versão com Checkbox em Consumíveis)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Grid // Certifique-se que Checkbox está aqui
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DispatchModal from './DispatchModal';
import ReturnMaterialModal from './ReturnMaterialModal';
import ReinforcementModal from './ReinforcementModal';
import { getStatusChipColor } from './utils/colorUtils';
import { authFetch } from './api';

function ConferencePage() {
    const [evento, setEvento] = useState(null);
    const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [isReinforcementModalOpen, setReinforcementModalOpen] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    const fetchData = useCallback(() => {
        authFetch(`/eventos/${id}/`)
            .then(res => res.ok ? res.json() : Promise.reject('Evento não encontrado'))
            .then(data => setEvento(data))
            .catch(() => navigate('/logistica'));
    }, [id, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = (actionUrl, body, confirmationMessage) => {
        if (confirmationMessage && !window.confirm(confirmationMessage)) return;
        authFetch(`/eventos/${id}/${actionUrl}/`, {
            method: 'POST',
            body: JSON.stringify(body),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => { alert(data.status); fetchData(); })
        .catch(error => alert(`Erro: ${error.error || 'Ocorreu um problema.'}`));
    };

    const handleReturnForCorrection = () => {
        const observacao = prompt("Por favor, descreva o motivo da rejeição:");
        if (observacao && observacao.trim() !== '') {
            handleAction('retornar_para_correcao', { observacao }, 'Tem a certeza que deseja retornar esta lista?');
        }
    };

    const handleToggleConferenciaMaterial = (materialId) => {
         authFetch(`/materiais/${materialId}/toggle_conferencia/`, { method: 'POST' })
         .then(res => { if(res.ok) fetchData(); });
    };

    // --- NOVA FUNÇÃO PARA CONFERIR CONSUMÍVEIS (BACKEND PRECISA SER IMPLEMENTADO) ---
    const handleToggleConferenciaConsumivel = (consumivelEventoId) => {
        authFetch(`/consumiveis-evento/${consumivelEventoId}/toggle_conferencia/`, { method: 'POST' })
        .then(res => { if(res.ok) fetchData(); });
    };

    const handleGenerateDamageReport = () => {
        // CORRIGIDO: Usa authFetch para garantir a autenticação
        authFetch(`/reports/avarias/${id}/`)
        .then(response => {
            if (response.ok) return response.blob();
            if (response.status === 404) {
                 alert("Nenhum item com avaria foi registado para esta operação.");
                 return null;
            }
            throw new Error('Falha ao gerar relatório.');
        })
        .then(blob => {
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Relatorio_Avarias_${evento.nome || 'Operacao'}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        });
    };

    const handleSuccess = (modalSetter) => {
        fetchData();
        modalSetter(false);
    };

    if (!evento) return <p>Carregando...</p>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {isDispatchModalOpen && <DispatchModal evento={evento} onClose={() => setDispatchModalOpen(false)} onDispatchSuccess={() => handleSuccess(setDispatchModalOpen)} />}
            {isReturnModalOpen && <ReturnMaterialModal evento={evento} onClose={() => setReturnModalOpen(false)} onSuccess={fetchData} />}
            {isReinforcementModalOpen && <ReinforcementModal evento={evento} onClose={() => setReinforcementModalOpen(false)} onSuccess={() => handleSuccess(setReinforcementModalOpen)} />}

            <Button component={Link} to="/logistica" sx={{ mb: 2 }}>← Voltar para Painel</Button>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1">Logística: {evento.nome || "Operação"}</Typography>
                <Chip label={evento.status_display} color={getStatusChipColor(evento.status)} />
            </Paper>

            <Paper elevation={3} sx={{ p: 2, mt: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Ações de Logística</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {evento.status === 'AGUARDANDO_CONFERENCIA' && <>
                        <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleAction('aprovar_lista', {}, 'Aprovar lista e libertar para saída?')}>Aprovar Lista</Button>
                        <Button variant="contained" color="error" startIcon={<CancelIcon />} onClick={handleReturnForCorrection}>Retornar p/ Correção</Button>
                    </>}
                    {evento.status === 'AGUARDANDO_SAIDA' && <Button variant="contained" onClick={() => setDispatchModalOpen(true)} startIcon={<LocalShippingIcon />}>Registar Saída de Material</Button>}
                    {evento.status === 'EM_ANDAMENTO' && <>
                        <Button variant="outlined" onClick={() => setDispatchModalOpen(true)} startIcon={<LocalShippingIcon />}>Registar Saída Parcial</Button>
                        <Button variant="contained" onClick={() => setReturnModalOpen(true)} startIcon={<AssignmentReturnIcon />}>Registar Retorno de Material</Button>
                        <Button variant="outlined" color="secondary" onClick={() => setReinforcementModalOpen(true)} startIcon={<AddCircleOutlineIcon />}>Adicionar Extra</Button>
                    </>}
                    {evento.status === 'FINALIZADO' && (
                        <Button variant="contained" color="secondary" onClick={handleGenerateDamageReport} startIcon={<ReportProblemIcon />}>
                            Gerar Relatório de Avarias
                        </Button>
                    )}
                </Box>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6">Equipamentos para Conferência</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Conferido</TableCell>
                                        <TableCell>Item</TableCell>
                                        <TableCell align="center">Qtd.</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(evento.materialevento_set || []).map((mat) => (
                                    <TableRow key={mat.id} hover sx={{ bgcolor: mat.conferido ? 'rgba(40, 167, 69, 0.1)' : 'transparent' }}>
                                        <TableCell align="center"><Checkbox checked={mat.conferido} onChange={() => handleToggleConferenciaMaterial(mat.id)} disabled={evento.status !== 'AGUARDANDO_CONFERENCIA'} /></TableCell>
                                        <TableCell>{mat.equipamento?.modelo || mat.item_descricao}</TableCell>
                                        <TableCell align="center">{mat.quantidade}</TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6">Consumíveis</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Conferido</TableCell> {/* NOVA COLUNA */}
                                        <TableCell>Item</TableCell>
                                        <TableCell align="center">Qtd.</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(evento.consumiveis_set || []).map((item) => (
                                        <TableRow key={item.id} hover sx={{ bgcolor: item.conferido ? 'rgba(40, 167, 69, 0.1)' : 'transparent' }}>
                                            <TableCell align="center">
                                                {/* CHECKBOX PARA CONSUMÍVEIS */}
                                                <Checkbox
                                                    checked={item.conferido}
                                                    onChange={() => handleToggleConferenciaConsumivel(item.id)}
                                                    disabled={evento.status !== 'AGUARDANDO_CONFERENCIA'}
                                                />
                                            </TableCell>
                                            <TableCell>{item.consumivel.nome}</TableCell>
                                            <TableCell align="center">{item.quantidade}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
export default ConferencePage;