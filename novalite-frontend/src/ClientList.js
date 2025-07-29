// Em: src/ClientList.js (Versão Final e Corrigida)

import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Container, Box, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, Collapse // Adiciona o Collapse para a animação
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// --- COMPONENTE DO FORMULÁRIO ---
function AddClientForm({ onSave, editingItem, onCancelEdit }) {
    const [empresa, setEmpresa] = useState('');
    const [representante, setRepresentante] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (editingItem) {
            setEmpresa(editingItem.empresa);
            setRepresentante(editingItem.representante);
            setTelefone(editingItem.telefone || '');
            setEmail(editingItem.email || '');
        } else {
            setEmpresa('');
            setRepresentante('');
            setTelefone('');
            setEmail('');
        }
    }, [editingItem]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({ empresa, representante, telefone, email }, editingItem ? editingItem.id : null);
    };

    return (
        <Paper elevation={3} sx={{ padding: '2rem', marginBottom: '2rem' }}>
            <Typography variant="h6" component="h3" gutterBottom>
                {editingItem ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField label="Nome da Empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} required fullWidth />
                <TextField label="Nome do Representante" value={representante} onChange={e => setRepresentante(e.target.value)} required fullWidth />
                <TextField label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} fullWidth />
                <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button type="submit" variant="contained" color="primary">
                        {editingItem ? 'Atualizar Cliente' : 'Adicionar Cliente'}
                    </Button>
                    {editingItem && (
                        <Button variant="outlined" onClick={onCancelEdit}>
                            Cancelar
                        </Button>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
function ClientList() {
    const [clientes, setClientes] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showForm, setShowForm] = useState(false); // Novo estado para controlar a visibilidade

    const fetchClientes = () => {
        fetch('http://127.0.0.1:8000/api/clientes/')
          .then(res => res.json())
          .then(data => setClientes(data));
    };

    useEffect(() => { fetchClientes(); }, []);

    const handleSave = (clientData, clientId) => {
        const isEditing = !!clientId;
        const url = isEditing ? `http://127.0.0.1:8000/api/clientes/${clientId}/` : 'http://127.0.0.1:8000/api/clientes/';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData),
        }).then(() => {
          fetchClientes();
          setEditingItem(null);
          setShowForm(false); // Fecha o formulário após salvar
        });
    };
    
    const handleDelete = (id) => {
         if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            fetch(`http://127.0.0.1:8000/api/clientes/${id}/`, { method: 'DELETE' })
              .then(response => {
                  if (response.ok) {
                      fetchClientes();
                  } else {
                      alert('Falha ao excluir. O cliente pode estar associado a uma operação.');
                  }
              });
         }
    };
    
    const handleEditClick = (cliente) => {
        setEditingItem(cliente);
        setShowForm(true); // Abre o formulário ao clicar em editar
    }

    const handleCancelEdit = () => {
        setEditingItem(null);
        setShowForm(false);
    }
    
    const handleAddNewClick = () => {
        setEditingItem(null); // Garante que não estamos editando
        setShowForm(!showForm); // Abre ou fecha o formulário
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestão de Clientes
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNewClick}>
                    {showForm && !editingItem ? 'Cancelar' : 'Novo Cliente'}
                </Button>
            </Box>

            {/* O formulário agora é renderizado dentro de um Collapse */}
            <Collapse in={showForm}>
                <AddClientForm 
                    onSave={handleSave} 
                    editingItem={editingItem}
                    onCancelEdit={handleCancelEdit}
                />
            </Collapse>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Empresa</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Representante</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Telefone</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clientes.map((cliente) => (
                            <TableRow key={cliente.id} hover>
                                <TableCell>{cliente.empresa}</TableCell>
                                <TableCell>{cliente.representante}</TableCell>
                                <TableCell>{cliente.telefone}</TableCell>
                                <TableCell>{cliente.email}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEditClick(cliente)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(cliente.id)} color="error">
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
export default ClientList;