// Em: src/EquipmentList.js (Versão Final com Melhoria de Feedback)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
    Collapse, Tooltip, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import AddEquipmentForm from './AddEquipmentForm';
import ReturnFromMaintenanceModal from './ReturnFromMaintenanceModal';
import { authFetch } from './api';

function EquipmentList() {
    const [equipamentos, setEquipamentos] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [itemToReturn, setItemToReturn] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // --- MODIFICAÇÃO: Estado de erro para o filtro de categoria ---
    const [categoryError, setCategoryError] = useState(null);

    useEffect(() => {
        // --- MODIFICAÇÃO: Tratamento de erro aprimorado ---
        authFetch('/equipamentos/categorias/')
            .then(res => {
                if (!res.ok) throw new Error('Falha ao carregar categorias.');
                return res.json();
            })
            .then(data => setCategories(data))
            .catch(err => {
                console.error("Erro ao buscar categorias:", err);
                setCategoryError(err.message);
            });
    }, []);

    // O restante do seu código, que já estava correto, permanece o mesmo.
    const fetchEquipamentos = useCallback(() => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory) params.append('categoria', selectedCategory);
        const url = `/equipamentos/?${params.toString()}`;
        
        authFetch(url)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha ao buscar dados dos equipamentos.')))
            .then(data => setEquipamentos(data.results || data))
            .catch(err => setError(err.message));
    }, [searchQuery, selectedCategory]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEquipamentos();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedCategory, fetchEquipamentos]);

    // Funções handleSave, handleDelete, etc. permanecem as mesmas...
    const handleSave = (equipamentoData, equipamentoId) => {
        const isEditing = !!equipamentoId;
        const url = isEditing ? `/equipamentos/${equipamentoId}/` : '/equipamentos/';
        const method = isEditing ? 'PUT' : 'POST';

        authFetch(url, {
            method,
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
            authFetch(`/equipamentos/${id}/`, { method: 'DELETE' })
              .then(response => {
                  if (response.ok) {
                    fetchEquipamentos();
                  } else {
                    alert('Falha ao excluir.');
                  }
              });
         }
    };
    
    const handleEditClick = (equipamento) => setEditingItem(equipamento); setShowForm(true);
    const handleCancelEdit = () => {setEditingItem(null); setShowForm(false);}
    const handleAddNewClick = () => {setEditingItem(null); setShowForm(!showForm);}

    if (error) return <Typography color="error" sx={{m: 4}}>{`Erro ao carregar equipamentos: ${error}`}</Typography>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
             {itemToReturn && <ReturnFromMaintenanceModal equipamento={itemToReturn} onClose={() => setItemToReturn(null)} onSuccess={() => { fetchEquipamentos(); setItemToReturn(null); }} />}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">Gestão de Equipamentos</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNewClick}>{showForm && !editingItem ? 'Cancelar' : 'Cadastro de Equipamento'}</Button>
            </Box>

            <Collapse in={showForm}>
                <AddEquipmentForm onSave={handleSave} editingItem={editingItem} onCancelEdit={handleCancelEdit} />
            </Collapse>

            <Paper sx={{ p: 2, mb: 2, mt: 2, display: 'flex', gap: 2 }}>
                <TextField fullWidth label="Buscar por Modelo ou Fabricante" variant="outlined" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <FormControl sx={{ minWidth: 250 }} error={!!categoryError}>
                    <InputLabel>Filtrar por Categoria</InputLabel>
                    <Select value={selectedCategory} label="Filtrar por Categoria" onChange={(e) => setSelectedCategory(e.target.value)}>
                        <MenuItem value=""><em>Todas as Categorias</em></MenuItem>
                        {categories.map((cat) => (<MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>))}
                    </Select>
                    {/* --- MODIFICAÇÃO: Exibe a mensagem de erro se a busca falhar --- */}
                    {categoryError && <Typography variant="caption" color="error" sx={{pl:2}}>{categoryError}</Typography>}
                </FormControl>
            </Paper>
            
            <TableContainer component={Paper}>
                {/* O restante da sua tabela de equipamentos permanece igual */}
            </TableContainer>
        </Container>
    );
}
export default EquipmentList;