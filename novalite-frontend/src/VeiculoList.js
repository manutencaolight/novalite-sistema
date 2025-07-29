// Em: src/VeiculoList.js (Versão com Material-UI)

import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Container, Box, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddVeiculoForm from './AddVeiculoForm';

function VeiculoList() {
    const [veiculos, setVeiculos] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const fetchVeiculos = () => {
        fetch('http://127.0.0.1:8000/api/veiculos/')
            .then(res => res.json())
            .then(data => setVeiculos(data));
    };

    useEffect(() => { fetchVeiculos(); }, []);

    const handleSave = (veiculoData, veiculoId) => {
        const isEditing = !!veiculoId;
        const url = isEditing ? `http://127.0.0.1:8000/api/veiculos/${veiculoId}/` : 'http://127.0.0.1:8000/api/veiculos/';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(veiculoData),
        }).then(() => {
            fetchVeiculos();
            setEditingItem(null);
            setShowForm(false);
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
            fetch(`http://127.0.0.1:8000/api/veiculos/${id}/`, { method: 'DELETE' })
                .then(response => {
                    if (response.ok) {
                        fetchVeiculos();
                    } else {
                        alert('Falha ao excluir. O veículo pode estar associado a uma operação.');
                    }
                });
        }
    };

    const handleEditClick = (veiculo) => {
        setEditingItem(veiculo);
        setShowForm(true);
    }

    const handleCancelEdit = () => {
        setEditingItem(null);
        setShowForm(false);
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestão de Veículos
                </Typography>
                <Button variant="contained" onClick={() => { setShowForm(!showForm); setEditingItem(null); }}>
                    {showForm && !editingItem ? 'Cancelar' : '+ Novo Veículo'}
                </Button>
            </Box>

            {showForm && (
                <Paper elevation={3} sx={{ padding: '2rem', marginBottom: '2rem' }}>
                    <AddVeiculoForm
                        onSave={handleSave}
                        editingItem={editingItem}
                        onCancelEdit={handleCancelEdit}
                    />
                </Paper>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nome/Apelido</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Placa</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {veiculos.map((v) => (
                            <TableRow key={v.id} hover>
                                <TableCell>{v.nome}</TableCell>
                                <TableCell>{v.placa}</TableCell>
                                <TableCell>{v.tipo}</TableCell>
                                <TableCell>{v.status}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEditClick(v)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(v.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}

export default VeiculoList;