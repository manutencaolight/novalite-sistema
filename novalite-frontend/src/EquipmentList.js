// Em: src/EquipmentList.js (Versão Final e 100% Corrigida)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
    Collapse, Tooltip, TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import AddEquipmentForm from './AddEquipmentForm';
import ReturnFromMaintenanceModal from './ReturnFromMaintenanceModal';

function EquipmentList() {
    const [equipamentos, setEquipamentos] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [itemToReturn, setItemToReturn] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState(null);

    const fetchEquipamentos = useCallback(() => {
        let url = 'http://127.0.0.1:8000/api/equipamentos/';
        if (searchQuery) {
            url += `?search=${searchQuery}`;
        }

        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Falha ao buscar dados. Verifique se o servidor Django está rodando.');
                }
                return res.json();
            })
            .then(data => {
                // --- CORREÇÃO APLICADA AQUI ---
                // Garante que estamos lendo a lista de dentro de 'results'
                if (data && Array.isArray(data.results)) {
                    setEquipamentos(data.results);
                } else if (Array.isArray(data)) {
                    setEquipamentos(data); // Para o caso de a API não ser paginada
                }
            })
            .catch(err => {
                setError(err.message);
                console.error("Erro na busca:", err);
            });
    }, [searchQuery]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEquipamentos();
        }, 300); // Adiciona um pequeno atraso para não sobrecarregar a API ao digitar
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, fetchEquipamentos]);

    const handleSave = (equipamentoData, equipamentoId) => {
        const isEditing = !!equipamentoId;
        const url = isEditing ? `http://127.0.0.1:8000/api/equipamentos/${equipamentoId}/` : 'http://127.0.0.1:8000/api/equipamentos/';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(equipamentoData),
        })
        .then(response => {
            if (!response.ok) throw new Error('Falha ao salvar equipamento.');
            fetchEquipamentos();
            setEditingItem(null);
            setShowForm(false);
        })
        .catch(error => alert(`Erro: ${error.message}`));
    };
    
    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir este equipamento?')) {
            fetch(`http://127.0.0.1:8000/api/equipamentos/${id}/`, { method: 'DELETE' })
              .then(response => {
                  if (response.ok) fetchEquipamentos();
                  else alert('Falha ao excluir.');
              });
         }
    };
    
    const handleEditClick = (equipamento) => {
        setEditingItem(equipamento);
        setShowForm(true);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setShowForm(false);
    };
    
    const handleAddNewClick = () => {
        setEditingItem(null);
        setShowForm(!showForm);
    };
    
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {itemToReturn && <ReturnFromMaintenanceModal equipamento={itemToReturn} onClose={() => setItemToReturn(null)} onSuccess={() => { fetchEquipamentos(); setItemToReturn(null); }} />}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestão de Equipamentos
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNewClick}>
                    {showForm && !editingItem ? 'Cancelar' : 'Cadastro de Equipamento'}
                </Button>
            </Box>

            <Collapse in={showForm}>
                <AddEquipmentForm 
                    onSave={handleSave} 
                    editingItem={editingItem}
                    onCancelEdit={handleCancelEdit}
                />
            </Collapse>

            <Paper sx={{ p: 2, mb: 2, mt: 2 }}>
                <TextField
                    fullWidth
                    label="Buscar Equipamento por Modelo ou Fabricante"
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </Paper>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Modelo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fabricante</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Categoria</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estoque</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Manutenção</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(equipamentos || []).map((eq) => (
                            <TableRow key={eq.id} hover>
                                <TableCell>{eq.modelo}</TableCell>
                                <TableCell>{eq.fabricante}</TableCell>
                                <TableCell>{eq.categoria}</TableCell>
                                <TableCell>{eq.quantidade_estoque}</TableCell>
                                <TableCell>{eq.quantidade_manutencao}</TableCell>
                                <TableCell align="right">
                                    {eq.quantidade_manutencao > 0 && (
                                        <Tooltip title="Retornar da Manutenção">
                                            <IconButton onClick={() => setItemToReturn(eq)} color="warning">
                                                <BuildIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Editar Equipamento">
                                        <IconButton onClick={() => handleEditClick(eq)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Excluir Equipamento">
                                        <IconButton onClick={() => handleDelete(eq.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}
export default EquipmentList;