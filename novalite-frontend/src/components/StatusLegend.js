// Em: src/components/StatusLegend.js (Versão Correta)

import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

// Importa a configuração central de status do seu arquivo de utils
import { STATUS_CONFIG } from '../utils/colorUtils';

function StatusLegend() {
    return (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', width: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                Legenda de Cores
            </Typography>
            <Grid container spacing={1}>
                {Object.values(STATUS_CONFIG).map((status) => {
                    // Ignora o status 'DEFAULT' na legenda
                    if (status.label === 'Desconhecido') return null;
                    
                    return (
                        <Grid item xs={6} sm={4} md={6} key={status.label}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Box
                                    component="span"
                                    sx={{
                                        width: 16,
                                        height: 16,
                                        backgroundColor: status.calendarColor,
                                        borderRadius: '4px',
                                        mr: 1.5,
                                        border: '1px solid rgba(0,0,0,0.2)'
                                    }}
                                />
                                <Typography variant="body2">{status.label}</Typography>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Paper>
    );
}

export default StatusLegend;