// Em: src/ScheduleModal.js (NOVO ARQUIVO)

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid } from '@mui/material';

function ScheduleModal({ open, onClose, onSave, funcionario, evento, escala }) {
    const [scheduleData, setScheduleData] = useState({
        data_inicio: '',
        hora_inicio: '08:00',
        data_fim: '',
        hora_fim: '18:00'
    });

    useEffect(() => {
        if (escala) { // Se estiver editando uma escala existente
            setScheduleData({
                data_inicio: escala.data_inicio,
                hora_inicio: escala.hora_inicio,
                data_fim: escala.data_fim,
                hora_fim: escala.hora_fim,
            });
        } else if (evento) { // Se estiver criando uma nova
            setScheduleData({
                data_inicio: evento.data_evento,
                hora_inicio: '08:00',
                data_fim: evento.data_termino || evento.data_evento,
                hora_fim: '18:00',
            });
        }
    }, [escala, evento, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setScheduleData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = () => {
        onSave(scheduleData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Agendar {funcionario?.nome}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={6}>
                        <TextField
                            name="data_inicio" label="Data de Início" type="date"
                            value={scheduleData.data_inicio} onChange={handleChange}
                            InputLabelProps={{ shrink: true }} fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            name="hora_inicio" label="Hora de Início" type="time"
                            value={scheduleData.hora_inicio} onChange={handleChange}
                            InputLabelProps={{ shrink: true }} fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            name="data_fim" label="Data de Fim" type="date"
                            value={scheduleData.data_fim} onChange={handleChange}
                            InputLabelProps={{ shrink: true }} fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            name="hora_fim" label="Hora de Fim" type="time"
                            value={scheduleData.hora_fim} onChange={handleChange}
                            InputLabelProps={{ shrink: true }} fullWidth
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSaveClick} variant="contained">Salvar Agenda</Button>
            </DialogActions>
        </Dialog>
    );
}
export default ScheduleModal;