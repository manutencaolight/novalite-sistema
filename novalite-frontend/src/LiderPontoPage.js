// Em: src/LiderPontoPage.js (NOVO ARQUIVO)

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemText, Checkbox, Button, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { authFetch } from './api';
import { useAuth } from './AuthContext';

function LiderPontoPage() {
    const { user } = useAuth();
    const [eventosLiderados, setEventosLiderados] = useState([]);
    const [presentes, setPresentes] = useState({});

    const fetchData = useCallback(() => {
        if (user) {
            authFetch('/lider/meus-eventos/')
                .then(res => res.json())
                .then(data => {
                    setEventosLiderados(data);
                    // Inicializa o estado de presença
                    const initialPresentes = {};
                    data.forEach(evento => {
                        initialPresentes[evento.id] = evento.confirmacoes_presenca
                            .filter(c => c.confirmado_pelo_lider)
                            .map(c => c.funcionario);
                    });
                    setPresentes(initialPresentes);
                });
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleTogglePresenca = (eventoId, funcId) => {
        const novosPresentes = [...(presentes[eventoId] || [])];
        const index = novosPresentes.indexOf(funcId);
        if (index > -1) {
            novosPresentes.splice(index, 1);
        } else {
            novosPresentes.push(funcId);
        }
        setPresentes({ ...presentes, [eventoId]: novosPresentes });
    };

    const handleSaveChanges = (eventoId) => {
        const membros_ids = presentes[eventoId] || [];
        authFetch(`/eventos/${eventoId}/leader-confirm/`, {
            method: 'POST',
            body: JSON.stringify({ membros_ids }),
        }).then(() => alert('Lista de presença salva!'));
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Área do Líder - Lista de Presença
            </Typography>
            {eventosLiderados.map(evento => (
                <Accordion key={evento.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{evento.nome}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List>
                            {evento.equipe.map(membro => (
                                <ListItem key={membro.id}>
                                    <Checkbox
                                        checked={(presentes[evento.id] || []).includes(membro.id)}
                                        onChange={() => handleTogglePresenca(evento.id, membro.id)}
                                    />
                                    <ListItemText primary={membro.nome} />
                                </ListItem>
                            ))}
                        </List>
                        <Button variant="contained" onClick={() => handleSaveChanges(evento.id)}>Salvar Presença</Button>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Container>
    );
}

export default LiderPontoPage;