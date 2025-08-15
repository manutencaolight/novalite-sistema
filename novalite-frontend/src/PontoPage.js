// Em: src/PontoPage.js (Versão com Lista de Eventos Automática)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Button,
    List, ListItem, ListItemText, Divider, Alert, CircularProgress
} from '@mui/material';
import { authFetch } from './api';
import { useAuth } from './AuthContext';

function PontoPage() {
    const { user } = useAuth();
    const [meusEventos, setMeusEventos] = useState([]);
    const [registrosPonto, setRegistrosPonto] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = useCallback(() => {
        if (user) {
            setLoading(true);
            authFetch('/ponto/meus-dados/') // Usando a rota que sabemos que funciona
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => Promise.reject(err.error || 'Falha ao buscar seus eventos.'));
                    }
                    return res.json();
                })
                .then(data => {
                    setMeusEventos(data.eventos || []);
                    setRegistrosPonto(data.registros_ponto || []);
                })
                .catch(err => setError(err.message || err))
                .finally(() => setLoading(false));
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePontoAction = (action, eventoId) => {
        setError('');
        setSuccess('');
        
        authFetch(`/eventos/${eventoId}/${action}/`, { method: 'POST' })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
            .then(data => {
                setSuccess(data.status);
                fetchData(); // Atualiza a lista de eventos e registros após a ação
            })
            .catch(err => setError(err.error || 'Ocorreu um erro ao registrar o ponto.'));
    };
    
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Meus Eventos e Ponto
                </Typography>
                
                {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ my: 2 }}>{success}</Alert>}

                <List>
                    {meusEventos.length > 0 ? meusEventos.map((evento, index) => {
                        // Para cada evento, verifica se há um ponto em aberto
                        const pontoAberto = registrosPonto.find(r => r.evento === evento.id && r.status === 'PRESENTE');
                        
                        return (
                            <React.Fragment key={evento.id}>
                                <ListItem>
                                    <ListItemText
                                        primary={evento.nome || "Evento Sem Nome"}
                                        secondary={`Data: ${new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')}`}
                                    />
                                    <Box sx={{ textAlign: 'right' }}>
                                        {pontoAberto ? (
                                            <>
                                                <Typography variant="caption" color="primary" display="block">
                                                    Entrada em: {new Date(pontoAberto.data_hora_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handlePontoAction('clock-out', evento.id)}
                                                >
                                                    Registrar Saída
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                onClick={() => handlePontoAction('clock-in', evento.id)}
                                            >
                                                Registrar Entrada
                                            </Button>
                                        )}
                                    </Box>
                                </ListItem>
                                {index < meusEventos.length - 1 && <Divider />}
                            </React.Fragment>
                        );
                    }) : (
                        <Typography sx={{ p: 2, textAlign: 'center' }}>
                            Você não foi designado para nenhum evento no momento.
                        </Typography>
                    )}
                </List>
            </Paper>
        </Container>
    );
}

export default PontoPage;