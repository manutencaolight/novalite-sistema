// Em: src/PontoPage.js (Versão Final para Confirmação de Presença)

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [funcionarioId, setFuncionarioId] = useState(null);

    const fetchData = useCallback(() => {
        if (user) {
            setLoading(true);
            authFetch('/ponto/meus-dados/')
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => Promise.reject(err.error || 'Falha ao buscar seus eventos.'));
                    }
                    return res.json();
                })
                .then(data => {
                    setMeusEventos(data.eventos || []);
                    // Armazena o ID do funcionário logado para facilitar as verificações
                    if (data.eventos.length > 0 && data.eventos[0].equipe.length > 0) {
                        const self = data.eventos[0].equipe.find(f => f.email === user.email);
                        if (self) setFuncionarioId(self.id);
                    }
                })
                .catch(err => setError(err.message || err))
                .finally(() => setLoading(false));
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleMemberConfirm = (eventoId) => {
        setError('');
        setSuccess('');
        authFetch(`/eventos/${eventoId}/member-confirm/`, { method: 'POST' })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
            .then(data => {
                setSuccess(data.status);
                fetchData(); // Atualiza a lista para refletir a confirmação
            })
            .catch(err => setError(err.error || 'Ocorreu um erro ao confirmar a presença.'));
    };
    
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Confirmar Presença nos Eventos
                </Typography>
                
                {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ my: 2 }}>{success}</Alert>}

                <List>
                    {meusEventos.length > 0 ? meusEventos.map((evento, index) => {
                        const confirmacao = evento.confirmacoes_presenca.find(c => c.funcionario === funcionarioId);
                        const isConfirmedByMember = confirmacao?.confirmado_pelo_membro;
                        const isConfirmedByLeader = confirmacao?.confirmado_pelo_lider;

                        return (
                            <React.Fragment key={evento.id}>
                                <ListItem>
                                    <ListItemText
                                        primary={evento.nome || "Evento Sem Nome"}
                                        secondary={
                                            <Box component="span">
                                                <Typography component="span" display="block" variant="body2">
                                                    Data: {new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                                                </Typography>
                                                {isConfirmedByLeader && 
                                                    <Typography component="span" variant="caption" color="success.main">
                                                        Presença confirmada pelo líder.
                                                    </Typography>
                                                }
                                            </Box>
                                        }
                                    />
                                    <Button
                                        variant={isConfirmedByMember ? "outlined" : "contained"}
                                        color="success"
                                        size="small"
                                        onClick={() => handleMemberConfirm(evento.id)}
                                        disabled={isConfirmedByMember}
                                    >
                                        {isConfirmedByMember ? "Presença Confirmada" : "Confirmar Minha Presença"}
                                    </Button>
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