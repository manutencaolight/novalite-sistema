// Em: src/LogisticsDashboard.js (Versão Corrigida)

import { authFetch } from './api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Chip, Button } from '@mui/material';
import { getStatusChipColor } from './utils/colorUtils';

function LogisticsDashboard() {
    const [operations, setOperations] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        authFetch('/dashboard-stats/')
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha ao carregar as operações.')))
            .then(data => {
                // --- CORREÇÃO APLICADA AQUI ---
                // O filtro agora é aplicado na lista 'proximos_eventos' que vem dentro do objeto 'data'
                const relevantOperations = (data.proximos_eventos || []).filter(op => 
                    op.status !== 'PLANEJAMENTO' && 
                    !(op.status === 'FINALIZADO' && !op.tem_avarias)
                );
                setOperations(relevantOperations);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
            });
    }, []);

    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Painel de Logística
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Operações que requerem ação da equipe de logística.
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Operação</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {operations.map((evento) => (
                            <TableRow key={evento.id} hover>
                                <TableCell>{evento.nome || "Operação Sem Nome"}</TableCell>
                                <TableCell>{evento.cliente?.empresa}</TableCell>
                                <TableCell>{new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell align="center">
                                    <Chip label={evento.status_display} color={getStatusChipColor(evento.status)} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <Button component={Link} to={`/logistica/operacao/${evento.id}`} size="small">
                                        Conferir / Agir
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {operations.length === 0 && <Typography sx={{p: 2, textAlign: 'center'}}>Nenhuma operação pendente.</Typography>}
            </TableContainer>
        </Container>
    );
}

export default LogisticsDashboard;