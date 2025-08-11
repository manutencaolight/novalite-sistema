// Em: src/EventList.js (Versão com Botão de Imprimir)

import { authFetch } from './api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Container, Typography, Box, Button, Paper, Table, TableContainer, 
    TableHead, TableRow, TableCell, TableBody, Chip, Tooltip, IconButton 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PrintIcon from '@mui/icons-material/Print'; // --- 1. ÍCONE ADICIONADO ---
import NewOperationModal from './NewOperationModal';

// ... (função getStatusChipColor não muda) ...
const getStatusChipColor = (status) => {
    const colors = {
        EM_ANDAMENTO: "primary", FINALIZADO: "success", CANCELADO: "error",
        AGUARDANDO_CONFERENCIA: "info", AGUARDANDO_SAIDA: "warning", 
        PLANEJAMENTO: "secondary", default: "default"
    };
    return colors[status] || colors.default;
};

function EventList() {
    const [eventos, setEventos] = useState([]);
    const [showNewOpModal, setShowNewOpModal] = useState(false);

    const fetchEventos = () => {
        authFetch('/eventos/')
            .then(res => res.json())
            .then(data => setEventos(data));
    };

    useEffect(() => { fetchEventos(); }, []);

    // --- 2. FUNÇÃO PARA LIDAR COM A IMPRESSÃO ---
    const handlePrint = (eventoId, eventoNome) => {
        // Chama o endpoint do backend que gera o PDF
        authFetch(`/reports/evento/${eventoId}/`)
            .then(response => {
                if (response.ok) {
                    return response.blob(); // Converte a resposta para um arquivo binário (blob)
                }
                throw new Error('Falha ao gerar o relatório.');
            })
            .then(blob => {
                // Cria uma URL temporária para o arquivo PDF
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                // Define o nome do arquivo que será baixado
                a.download = `Relatorio_${eventoNome.replace(/ /g, '_') || 'Evento'}.pdf`;
                document.body.appendChild(a);
                a.click(); // Simula o clique no link para iniciar o download
                window.URL.revokeObjectURL(url); // Libera a memória
                document.body.removeChild(a);
            })
            .catch(error => alert(`Erro ao imprimir: ${error.message}`));
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {showNewOpModal && <NewOperationModal onClose={() => setShowNewOpModal(false)} onCreated={fetchEventos} />}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">Listas de Materiais</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowNewOpModal(true)}>
                    Criar Nova Lista
                </Button>
            </Box>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nome/Descrição</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Criado por</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {eventos.map((evento) => (
                            <TableRow key={evento.id} hover sx={{
                                backgroundColor: evento.status === 'PLANEJAMENTO' && evento.observacao_correcao ? '#fffbe6' : 'inherit'
                            }}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {evento.status === 'PLANEJAMENTO' && evento.observacao_correcao && (
                                            <Tooltip title={`Correção necessária: ${evento.observacao_correcao}`}>
                                                <IconButton color="warning" size="small" sx={{ mr: 1 }}>
                                                    <WarningAmberIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {evento.nome || "Operação Sem Nome"}
                                    </Box>
                                </TableCell>
                                <TableCell>{evento.cliente?.empresa}</TableCell>
                                <TableCell>{new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell align="center">
                                    <Chip label={evento.status_display} color={getStatusChipColor(evento.status)} size="small" />
                                </TableCell>
                                <TableCell>{evento.criado_por?.username || 'N/A'}</TableCell>
                                <TableCell align="right">
                                    {/* --- 3. BOTÃO DE IMPRIMIR ADICIONADO AQUI --- */}
                                    <Tooltip title="Imprimir Relatório Completo">
                                        <IconButton onClick={() => handlePrint(evento.id, evento.nome)} color="secondary">
                                            <PrintIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Button component={Link} to={`/eventos/${evento.id}`} size="small">
                                        Gerenciar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}

export default EventList;