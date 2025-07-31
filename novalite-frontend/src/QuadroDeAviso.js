// Em: src/QuadroDeAviso.js (Versão Final Corrigida com authFetch)

import { authFetch } from './api'; // 1. IMPORTA A FUNÇÃO CORRETA
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
import { getStatusCalendarColor, STATUS_CONFIG } from './utils/colorUtils';
import StatusLegend from './components/StatusLegend';

function QuadroDeAviso() {
    const [stats, setStats] = useState({ proximos_eventos: [], em_manutencao: 0, total_equipamentos: 0 });
    const [avariasRecentes, setAvariasRecentes] = useState([]);
    const [eventosDoCalendario, setEventosDoCalendario] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // --- 2. TODAS AS CHAMADAS AGORA USAM authFetch ---
                const statsPromise = authFetch('/dashboard-stats/').then(res => res.json());
                const eventosPromise = authFetch('/eventos/').then(res => res.json());
                const avariasPromise = authFetch('/relatorio-avarias/').then(res => res.json());

                // Aguarda todas as chamadas terminarem
                const [statsData, eventosData, avariasData] = await Promise.all([
                    statsPromise, eventosPromise, avariasPromise
                ]);

                setStats(statsData);
                setEventosDoCalendario(eventosData.results || eventosData);
                setAvariasRecentes(avariasData);

            } catch (err) {
                setError("Não foi possível carregar os dados. Verifique o servidor.");
                console.error("Erro ao buscar dados do quadro de aviso:", err);
            }
        };

        fetchData();
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
    
    // O restante do seu JSX para renderizar a página continua o mesmo
    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
           {/* ... seu JSX aqui ... */}
        </Container>
    );
}

export default QuadroDeAviso;