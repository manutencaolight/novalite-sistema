// Em: src/EventList.js (Versão com Alerta de Correção)

import { authFetch } from './api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Container, Typography, Box, Button, Paper, Table, TableContainer, 
    TableHead, TableRow, TableCell, TableBody, Chip, Tooltip, IconButton 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // Importa o ícone de alerta
import NewOperationModal from './NewOperationModal';

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
        authFetch('/eventos/') // <-- Correção aqui
            .then(res => res.json())
            .then(data => setEventos(data));
    };

    useEffect(() => { fetchEventos(); }, []);

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
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {eventos.map((evento) => (
                            <TableRow key={evento.id} hover sx={{
                                // Destaca a linha inteira se precisar de correção
                                backgroundColor: evento.status === 'PLANEJAMENTO' && evento.observacao_correcao ? '#fffbe6' : 'inherit'
                            }}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {/* --- ÍCONE DE ALERTA ADICIONADO AQUI --- */}
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
                                <TableCell align="right">
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