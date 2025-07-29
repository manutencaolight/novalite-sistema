// Em: src/ReturnMaterialModal.js (Versão Final com Atualização em Tempo Real)

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button,
    TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { authFetch } from './api';

function ReturnMaterialModal({ evento, onClose, onSuccess }) {
    const [materiaisPendentes, setMateriaisPendentes] = useState([]);
    // --- 1. CRIAMOS UM ESTADO LOCAL PARA O HISTÓRICO ---
    const [returnedItemsHistory, setReturnedItemsHistory] = useState([]);

    // Campos do formulário
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [condicao, setCondicao] = useState('OK');
    const [observacao, setObservacao] = useState('');

    // --- 2. USAMOS useEffect PARA ATUALIZAR O ESTADO LOCAL ---
    // Este hook irá executar sempre que o 'evento' (passado pelo pai) for atualizado.
    useEffect(() => {
        // Atualiza a lista de materiais pendentes
        const pending = (evento.materialevento_set || [])
            .filter(item => item.equipamento && item.quantidade_separada > (item.quantidade_retornada_ok + item.quantidade_retornada_defeito));
        setMateriaisPendentes(pending);

        // Atualiza a lista do histórico de retornos
        const history = (evento.materialevento_set || []).flatMap(m => 
            (m.itens_retornados || []).map(ret => ({
                ...ret,
                equipamento_modelo: m.equipamento?.modelo || 'Item Avulso'
            }))
        );
        setReturnedItemsHistory(history);

    }, [evento]); // A dependência [evento] é a chave para a atualização em tempo real

    const getPendenteLabel = (item) => {
        const pendente = item.quantidade_separada - (item.quantidade_retornada_ok + item.quantidade_retornada_defeito);
        return `${item.equipamento.modelo} (Pendente: ${pendente})`;
    };

    const handleSubmitReturn = () => {
        if (!selectedMaterialId || quantidade <= 0) {
            alert("Selecione um item e especifique uma quantidade válida.");
            return;
        }
        const payload = {
            retornos: [{
                material_evento_id: selectedMaterialId,
                quantidade: quantidade,
                condicao: condicao,
                observacao: observacao,
            }]
        };

        authFetch(`/eventos/${evento.id}/registrar_retorno/`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => {
            alert(data.status);
            // Limpa o formulário para o próximo registo
            setSelectedMaterialId('');
            setQuantidade(1);
            setCondicao('OK');
            setObservacao('');
            // Chama a função para atualizar os dados na página principal
            onSuccess();
        })
        .catch(error => alert(`Erro: ${error.error || 'Ocorreu um problema.'}`));
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Registar Retorno de Material</DialogTitle>
            <DialogContent>
                <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Adicionar Registo de Retorno</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <FormControl fullWidth size="small" sx={{ flex: 3, minWidth: '250px' }}>
                            <InputLabel>Item Pendente</InputLabel>
                            <Select value={selectedMaterialId} label="Item Pendente" onChange={e => setSelectedMaterialId(e.target.value)}>
                                {materiaisPendentes.map(item => (
                                    <MenuItem key={item.id} value={item.id}>{getPendenteLabel(item)}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField label="Qtd." type="number" value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value))} size="small" sx={{ width: 100 }}/>
                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Condição</InputLabel>
                            <Select value={condicao} label="Condição" onChange={e => setCondicao(e.target.value)}>
                                <MenuItem value="OK">Bom Estado</MenuItem>
                                <MenuItem value="DEFEITO">Com Defeito</MenuItem>
                                <MenuItem value="QUEBRADO">Quebrado</MenuItem>
                                <MenuItem value="PERDIDO">Perdido/Sumiu</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <TextField label="Observação (ex: lente trincada, etc.)" value={observacao} onChange={e => setObservacao(e.target.value)} fullWidth multiline rows={2} sx={{ mt: 2 }} size="small"/>
                    <Button onClick={handleSubmitReturn} variant="contained" startIcon={<AddCircleIcon />} sx={{ mt: 2 }}>
                        Registar este Retorno
                    </Button>
                </Box>
                
                <Typography variant="h6" gutterBottom>Histórico de Itens Retornados</Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow><TableCell>Item</TableCell><TableCell>Qtd.</TableCell><TableCell>Condição</TableCell><TableCell>Observação</TableCell></TableRow>
                        </TableHead>
                        <TableBody>
                            {/* --- 3. A TABELA AGORA USA O ESTADO LOCAL --- */}
                            {returnedItemsHistory.map(ret => (
                                <TableRow key={ret.id}>
                                    <TableCell>{ret.equipamento_modelo}</TableCell>
                                    <TableCell>{ret.quantidade}</TableCell>
                                    <TableCell>{ret.condicao_display}</TableCell>
                                    <TableCell>{ret.observacao}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}
export default ReturnMaterialModal;