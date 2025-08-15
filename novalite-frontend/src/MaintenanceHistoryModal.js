// Em: src/MaintenanceHistoryModal.js

import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
    Box, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function MaintenanceHistoryModal({ item, onClose }) {
    if (!item) return null;

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Histórico Completo da O.S. {item.os_number}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">{item.equipamento?.modelo}</Typography>
                    <Typography variant="body1" color="text.secondary">
                        <strong>Problema Original:</strong> {item.descricao_problema}
                    </Typography>
                </Box>
                <Divider />
                <List>
                    {(item.historico_detalhado || []).map((hist, index) => (
                        <ListItem key={hist.id} alignItems="flex-start" divider={index < item.historico_detalhado.length - 1}>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" component="span">
                                            {hist.status_novo ? `Status alterado para: ${hist.status_novo}` : "Observação Adicionada"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {format(new Date(hist.data_atualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {hist.usuario_nome}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block', mt: 1 }}>
                                        <strong>Observação:</strong> {hist.observacao}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}

export default MaintenanceHistoryModal;