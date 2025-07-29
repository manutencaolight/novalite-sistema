// Em: src/FuncionarioList.js (Versão Final, 100% Completa e Funcional)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
    TextField, Select, MenuItem, FormControl, InputLabel, Collapse, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// --- COMPONENTE DO FORMULÁRIO (DENTRO DO MESMO ARQUIVO) ---
function AddFuncionarioForm({ onSave, editingItem, onCancelEdit }) {
    const [nome, setNome] = useState('');
    const [funcao, setFuncao] = useState('');
    const [tipo, setTipo] = useState('funcionario');
    const [contato, setContato] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (editingItem) {
            setNome(editingItem.nome || '');
            setFuncao(editingItem.funcao || '');
            setTipo(editingItem.tipo || 'funcionario');
            setContato(editingItem.contato || '');
            setEmail(editingItem.email || '');
        } else {
            setNome(''); setFuncao(''); setTipo('funcionario'); setContato(''); setEmail('');
        }
    }, [editingItem]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({ nome, funcao, tipo, contato, email }, editingItem ? editingItem.id : null);
    };

    return (
        <Paper elevation={3} sx={{ padding: '2rem', marginBottom: '2rem' }}>
            <Typography variant="h6" component="h3" gutterBottom>
                {editingItem ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField label="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} required fullWidth />
                <TextField label="Função" value={funcao} onChange={e => setFuncao(e.target.value)} fullWidth />
                <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select value={tipo} label="Tipo" onChange={e => setTipo(e.target.value)}>
                        <MenuItem value="funcionario">Funcionário</MenuItem>
                        <MenuItem value="freelancer">Freelancer</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Telefone/WhatsApp" value={contato} onChange={e => setContato(e.target.value)} fullWidth />
                <TextField label="E-mail para Notificações" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button type="submit" variant="contained" color="primary">{editingItem ? 'Atualizar' : 'Salvar'}</Button>
                    <Button variant="outlined" onClick={onCancelEdit}>Cancelar</Button>
                </Box>
            </Box>
        </Paper>
    );
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
function FuncionarioList() {
    const [funcionarios, setFuncionarios] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);

    const fetchFuncionarios = useCallback(() => {
        fetch('http://127.0.0.1:8000/api/funcionarios/')
          .then(res => {
              if (!res.ok) throw new Error('Falha ao buscar dados.');
              return res.json();
          })
          .then(data => {
              setFuncionarios(data.results || data);
          })
          .catch(() => setError("Não foi possível carregar os funcionários. Verifique o servidor."));
    }, []);

    useEffect(() => {
        fetchFuncionarios();
    }, [fetchFuncionarios]);

    const handleSave = (funcionarioData, funcionarioId) => {
        const isEditing = !!funcionarioId;
        const url = isEditing ? `http://127.0.0.1:8000/api/funcionarios/${funcionarioId}/` : 'http://127.0.0.1:8000/api/funcionarios/';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(funcionarioData),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    const errorMessages = Object.entries(errData).map(([key, value]) => `${key}: ${value}`).join('\n');
                    throw new Error(errorMessages || 'Falha ao salvar funcionário.');
                });
            }
            return response.json();
        })
        .then(() => {
            fetchFuncionarios();
            setEditingItem(null);
            setShowForm(false);
        })
        .catch(error => alert(`Erro:\n${error.message}`));
    };
    
    const handleDelete = (id) => {
         if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
            fetch(`http://127.0.0.1:8000/api/funcionarios/${id}/`, { method: 'DELETE' })
              .then(response => {
                  if (response.ok) {
                      fetchFuncionarios();
                  } else {
                      alert('Falha ao excluir. O funcionário pode estar associado a uma operação.');
                  }
              });
         }
    };
    
    const handleEditClick = (funcionario) => {
        setEditingItem(funcionario);
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
    
    if (error) return <p style={{color: 'red'}}>{error}</p>

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestão de Funcionários
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNewClick}>
                    {showForm && !editingItem ? 'Cancelar' : 'Novo Colaborador'}
                </Button>
            </Box>

            <Collapse in={showForm}>
                <AddFuncionarioForm 
                    onSave={handleSave} 
                    editingItem={editingItem}
                    onCancelEdit={handleCancelEdit}
                />
            </Collapse>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Função</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Contato</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(funcionarios || []).map((func) => (
                            <TableRow key={func.id} hover>
                                <TableCell>{func.nome}</TableCell>
                                <TableCell>{func.funcao}</TableCell>
                                <TableCell>{func.tipo}</TableCell>
                                <TableCell>{func.contato}</TableCell>
                                <TableCell>{func.email}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Editar Funcionário">
                                        <IconButton onClick={() => handleEditClick(func)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Excluir Funcionário">
                                        <IconButton onClick={() => handleDelete(func.id)} color="error">
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
export default FuncionarioList;