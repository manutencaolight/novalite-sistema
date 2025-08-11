// Em: src/PontoPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Button,
    Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert
} from '@mui/material';
import { authFetch } from './api';
import { useAuth } from './AuthContext';

function PontoPage() {
    const { user } = useAuth();
    const [meusEventos, setMeusEventos] = useState([]);
    const [registrosPonto, setRegistrosPonto] = useState([]);
    const [selectedEventoId, setSelectedEventoId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = useCallback(() => {
        if (user) {
            authFetch('/meus-eventos/')
                .then(res => res.ok ? res.json() : Promise.reject('Falha ao buscar seus eventos.'))
                .then(data => {
                    setMeusEventos(data.eventos || []);
                    setRegistrosPonto(data.registros_ponto || []);
                    // Seleciona o evento mais recente por padrão, se houver
                    if (data.eventos && data.eventos.length > 0) {
                        setSelectedEventoId(data.eventos[0].id);
                    }
                })
                .catch(err => setError(err.message || err));
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePontoAction = (action) => {
        setError('');
        setSuccess('');
        if (!selectedEventoId) {
            setError('Por favor, selecione um evento.');
            return;
        }

        authFetch(`/eventos/${selectedEventoId}/${action}/`, { method: 'POST' })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
            .then(data => {
                setSuccess(data.status);
                fetchData(); // Atualiza os dados após a ação
            })
            .catch(err => setError(err.error || 'Ocorreu um erro.'));
    };

    const eventoAtual = meusEventos.find(e => e.id === selectedEventoId);
    const pontoAberto = registrosPonto.find(r => r.evento === selectedEventoId && r.status === 'PRESENTE');
    const registrosDoEvento = registrosPonto.filter(r => r.evento === selectedEventoId);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Registro de Ponto
                </Typography>
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <FormControl fullWidth sx={{ my: 2 }}>
                    <InputLabel>Selecione o Evento</InputLabel>
                    <Select value={selectedEventoId} label="Selecione o Evento" onChange={e => setSelectedEventoId(e.target.value)}>
                        {(meusEventos || []).map(evento => (
                            <MenuItem key={evento.id} value={evento.id}>
                                {evento.nome || `Evento em ${new Date(evento.data_evento).toLocaleDateString()}`}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {eventoAtual && (
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, textAlign: 'center' }}>
                        {pontoAberto ? (
                            <>
                                <Typography variant="h6" color="primary">
                                    Você está trabalhando neste evento.
                                </Typography>
                                <Typography>
                                    Entrada registrada em: {new Date(pontoAberto.data_hora_entrada).toLocaleString('pt-BR')}
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="error"
                                    sx={{ mt: 2 }}
                                    onClick={() => handlePontoAction('clock-out')}
                                >
                                    Registrar Saída
                                </Button>
                            </>
                        ) : (
                            <>
                                <Typography variant="h6">
                                    Pronto para começar?
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="success"
                                    sx={{ mt: 2 }}
                                    onClick={() => handlePontoAction('clock-in')}
                                >
                                    Registrar Entrada
                                </Button>
                            </>
                        )}
                    </Box>
                )}

                {registrosDoEvento.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h5" gutterBottom>Seus Registros para este Evento</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Entrada</TableCell>
                                        <TableCell>Saída</TableCell>
                                        <TableCell>Duração</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {registrosDoEvento.map(reg => (
                                        <TableRow key={reg.id}>
                                            <TableCell>{new Date(reg.data_hora_entrada).toLocaleString('pt-BR')}</TableCell>
                                            <TableCell>{reg.data_hora_saida ? new Date(reg.data_hora_saida).toLocaleString('pt-BR') : '---'}</TableCell>
                                            <TableCell>{reg.duracao}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default PontoPage;