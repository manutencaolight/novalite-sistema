// Em: src/QuadroDeAviso.js (Versão com Cores de Status na Lista)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Paper, Typography, Container, Grid, Box, List,
    ListItem, ListItemText, ListItemIcon, Divider, Alert, ListItemButton
} from '@mui/material';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ptBR } from 'date-fns/locale';
import EventIcon from '@mui/icons-material/Event';
import ConstructionIcon from '@mui/icons-material/Construction';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

// --- 1. IMPORTAÇÃO ATUALIZADA ---
// Agora importamos o STATUS_CONFIG para ter acesso direto às cores e nomes
import { getStatusCalendarColor, STATUS_CONFIG } from './utils/colorUtils';
import StatusLegend from './components/StatusLegend';

function QuadroDeAviso() {
    const [stats, setStats] = useState({ proximos_eventos: [], em_manutencao: 0, total_equipamentos: 0 });
    const [avariasRecentes, setAvariasRecentes] = useState([]);
    const [eventosDoCalendario, setEventosDoCalendario] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        // As suas chamadas fetch continuam as mesmas
        fetch('https://novalite-sistema.onrender.com/api/dashboard-stats/')
            .then(res => res.ok ? res.json() : Promise.reject('Falha ao carregar estatísticas.'))
            .then(data => setStats(data))
            .catch(err => setError("Não foi possível carregar os dados. Verifique o servidor."));

        fetch('https://novalite-sistema.onrender.com/api/eventos/')
            .then(res => res.ok ? res.json() : Promise.reject('Falha ao carregar eventos.'))
            .then(data => setEventosDoCalendario(data.results || data))
            .catch(err => console.error(err));

        fetch('https://novalite-sistema.onrender.com/api/relatorio-avarias/')
            .then(res => res.ok ? res.json() : Promise.reject('Falha ao carregar avarias.'))
            .then(data => setAvariasRecentes(data))
            .catch(err => console.error(err));
    }, []);

    const modifiers = {};
    const modifiersStyles = {};
    eventosDoCalendario.forEach(evento => {
        if (evento.data_evento) {
            const date = new Date(evento.data_evento.replace(/-/g, '/'));
            const modifierName = `status_${evento.status}_${evento.id}`;
            modifiers[modifierName] = date;
            modifiersStyles[modifierName] = { color: 'white', backgroundColor: getStatusCalendarColor(evento.status) };
        }
    });

    const calendarStyles = {
        caption: { fontSize: '1.2rem', paddingBottom: '1rem', color: '#1976d2' },
        head_cell: { fontSize: '1rem', width: '60px', fontWeight: 'bold' },
        day: { fontSize: '1rem', margin: '0.5rem' },
        root: { width: '100%' }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Quadro de Aviso
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                        <DayPicker mode="single" locale={ptBR} modifiers={modifiers} modifiersStyles={modifiersStyles} styles={calendarStyles} />
                        <Box sx={{ mt: 4, width: '100%', display: 'flex', justifyContent: 'center' }}>
                           <StatusLegend />
                        </Box>
                    </Paper>
                </Grid>

                <Grid item container xs={12} md={4} spacing={3} direction="column">
                    <Grid item>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Inventário</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><InventoryIcon color="primary" sx={{ mr: 2 }} /><Typography variant="body1"><strong>{stats.total_equipamentos}</strong> Equipamentos em Estoque</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}><ConstructionIcon color="warning" sx={{ mr: 2 }} /><Typography variant="body1"><strong>{stats.em_manutencao}</strong> Equipamentos em Manutenção</Typography></Box>
                        </Paper>
                    </Grid>
                    <Grid item>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Próximas Operações</Typography>
                            <List>
                                {(stats.proximos_eventos || []).map((evento, index) => (
                                    <React.Fragment key={evento.id}>
                                        <ListItemButton component={Link} to={`/eventos/${evento.id}`}>
                                            <ListItemIcon><EventIcon color="action" /></ListItemIcon>
                                            
                                            {/* --- 2. LÓGICA DE EXIBIÇÃO ATUALIZADA --- */}
                                            <ListItemText 
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {/* O círculo colorido */}
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: '50%',
                                                                backgroundColor: STATUS_CONFIG[evento.status]?.calendarColor || '#bdbdbd',
                                                                mr: 1.5,
                                                                border: '1px solid rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                        {/* O nome do evento */}
                                                        {evento.nome || "Operação Sem Nome"}
                                                    </Box>
                                                }
                                                secondary={`${new Date(evento.data_evento.replace(/-/g, '/')).toLocaleDateString('pt-BR')} - ${evento.cliente?.empresa}`}
                                            />
                                        </ListItemButton>
                                        {index < stats.proximos_eventos.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                                {stats.proximos_eventos.length === 0 && <Typography sx={{p:2}} variant="body2" color="text.secondary">Nenhuma operação agendada.</Typography>}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>

            {/* --- SEÇÃO DE AVARIAS --- */}
            {avariasRecentes.length > 0 && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    <Typography variant="h6">Atenção: Itens com Avaria Recentes</Typography>
                    <List dense>
                        {avariasRecentes.map(avaria => (
                            <ListItem key={avaria.id}>
                                <ListItemIcon><ReportProblemIcon fontSize="small" /></ListItemIcon>
                                <ListItemText 
                                    primary={`${avaria.quantidade}x ${avaria.material_evento.equipamento.modelo} - ${avaria.condicao_display}`}
                                    secondary={`Da operação: ${avaria.evento.nome}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Alert>
            )}
        </Container>
    );
}

export default QuadroDeAviso;