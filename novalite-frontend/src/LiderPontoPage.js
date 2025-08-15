// Em: src/LiderPontoPage.js (Versão Final para Confirmação pelo Líder)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, List, ListItem, ListItemText,
    Checkbox, Button, Accordion, AccordionSummary, AccordionDetails,
    CircularProgress, Alert, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { authFetch } from './api';
import { useAuth } from './AuthContext';

function LiderPontoPage() {
    const { user } = useAuth();
    const [eventosLiderados, setEventosLiderados] = useState([]);
    const [presentes, setPresentes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = useCallback(() => {
        if (user) {
            setLoading(true);
            authFetch('/lider/meus-eventos/')
                .then(res => res.ok ? res.json() : Promise.reject('Falha ao buscar eventos.'))
                .then(data => {
                    setEventosLiderados(data);
                    const initialPresentes = {};
                    data.forEach(evento => {
                        initialPresentes[evento.id] = evento.confirmacoes_presenca
                            .filter(c => c.confirmado_pelo_lider)
                            .map(c => c.funcionario);
                    });
                    setPresentes(initialPresentes);
                })
                .catch(err => setError(err.message || err))
                .finally(() => setLoading(false));
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleTogglePresenca = (eventoId, funcId) => {
        const currentPresentes = presentes[eventoId] || [];
        const index = currentPresentes.indexOf(funcId);
        let novosPresentes;
        if (index > -1) {
            novosPresentes = currentPresentes.filter(id => id !== funcId);
        } else {
            novosPresentes = [...currentPresentes, funcId];
        }
        setPresentes({ ...presentes, [eventoId]: novosPresentes });
    };

    const handleSaveChanges = (eventoId) => {
        const membros_ids = presentes[eventoId] || [];
        setError('');
        setSuccess('');
        authFetch(`/eventos/${eventoId}/leader-confirm/`, {
            method: 'POST',
            body: JSON.stringify({ membros_ids }),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => setSuccess(data.status))
        .catch(err => setError(err.error || 'Falha ao salvar.'));
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{p: 3}}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Área do Líder - Lista de Presença
                </Typography>
                {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ my: 2 }}>{success}</Alert>}

                {eventosLiderados.length > 0 ? eventosLiderados.map(evento => (
                    <Accordion key={evento.id} defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{evento.nome}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List>
                                {evento.equipe.map(membro => {
                                    const confirmacao = evento.confirmacoes_presenca.find(c => c.funcionario === membro.id);
                                    const isConfirmedByMember = confirmacao?.confirmado_pelo_membro;
                                    return (
                                        <ListItem key={membro.id}>
                                            <Checkbox
                                                edge="start"
                                                checked={(presentes[evento.id] || []).includes(membro.id)}
                                                onChange={() => handleTogglePresenca(evento.id, membro.id)}
                                                tabIndex={-1}
                                            />
                                            <ListItemText primary={membro.nome} />
                                            {isConfirmedByMember && (
                                                <Tooltip title="Presença confirmada pelo próprio membro">
                                                    <Typography variant="caption" color="success.main">
                                                        (Confirmado)
                                                    </Typography>
                                                </Tooltip>
                                            )}
                                        </ListItem>
                                    );
                                })}
                            </List>
                            <Button variant="contained" onClick={() => handleSaveChanges(evento.id)}>
                                Salvar Presenças para este Evento
                            </Button>
                        </AccordionDetails>
                    </Accordion>
                )) : (
                    <Typography sx={{ p: 2, textAlign: 'center' }}>
                        Você não foi definido como chefe de equipe em nenhum evento.
                    </Typography>
                )}
            </Paper>
        </Container>
    );
}

export default LiderPontoPage;