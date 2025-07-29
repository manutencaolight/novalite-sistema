// Em: src/AddMaterialForm.js (Versão com Lista por Categoria)

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { authFetch } from './api'; // Usar authFetch para requisições autenticadas

function AddMaterialForm({ eventoId, onMaterialAdded }) {
    const [allEquipment, setAllEquipment] = useState([]);
    const [filteredEquipment, setFilteredEquipment] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [quantidade, setQuantidade] = useState(1);

    // Lista de categorias, agora ordenada e com "Todos" no topo
    const categoriasDisponiveis = ["Todos", "Acessórios em Geral", "Adaptadores", "Consoles", "Efeitos", "Estruturas", "Iluminação Convencional", "LEDs", "Moving Lights", "Prolongas e Chicotes", "Rack Dimmer", "Sonorização", "Vídeo", "Outros"];
    categoriasDisponiveis.sort((a, b) => {
        if (a === 'Todos') return -1;
        if (b === 'Todos') return 1;
        return a.localeCompare(b);
    });

    useEffect(() => {
        authFetch('/equipamentos/').then(res => res.json()).then(data => setAllEquipment(data.results || data));
    }, []);

    useEffect(() => {
        let items = allEquipment;
        if (selectedCategory !== 'Todos') {
            items = items.filter(eq => eq.categoria === selectedCategory);
        }
        if (searchQuery.trim() !== '') {
            items = items.filter(eq => eq.modelo.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredEquipment(items);
    }, [searchQuery, selectedCategory, allEquipment]);

    const handleSelectEquipment = (equipment) => {
        setSelectedEquipment(equipment);
        setSearchQuery(equipment.modelo); // Preenche o campo de busca com o item selecionado
        setFilteredEquipment([]); // Esconde a lista de resultados
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        // Melhoria de usabilidade: limpa a busca ao mudar a categoria
        setSearchQuery(''); 
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!selectedEquipment) {
            alert("Por favor, selecione um equipamento da lista de resultados.");
            return;
        }
        
        const materialData = {
            evento: eventoId,
            equipamento_id: selectedEquipment.id,
            quantidade: quantidade,
        };

        authFetch('/materiais/', {
            method: 'POST',
            body: JSON.stringify(materialData),
        }).then(res => {
            if (res.ok) {
                onMaterialAdded(); // Atualiza a lista principal
                // Limpa o formulário para a próxima adição
                setSearchQuery('');
                setSelectedEquipment(null);
                setQuantidade(1);
                setSelectedCategory('Todos');
            } else {
                alert("Falha ao adicionar material. Verifique se o item já não está na lista.");
            }
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Filtrar Categoria</InputLabel>
                    <Select value={selectedCategory} label="Filtrar Categoria" onChange={handleCategoryChange}>
                        {categoriasDisponiveis.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                    </Select>
                </FormControl>
                <Box sx={{ position: 'relative', flexGrow: 1 }}>
                    <TextField 
                        fullWidth 
                        label="Ou digite para buscar..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        size="small" 
                        // Limpa o item selecionado se o utilizador apagar a busca
                        onFocus={() => setSelectedEquipment(null)} 
                    />
                    
                    {/* --- ALTERAÇÃO PRINCIPAL AQUI --- */}
                    {/* A lista agora aparece se houver resultados E se uma categoria foi escolhida OU se algo foi digitado */}
                    {filteredEquipment.length > 0 && (searchQuery || selectedCategory !== 'Todos') && (
                        <Paper sx={{ position: 'absolute', width: '100%', zIndex: 10, maxHeight: 200, overflow: 'auto' }}>
                            <List dense>
                                {filteredEquipment.map(eq => (
                                    <ListItemButton key={eq.id} onClick={() => handleSelectEquipment(eq)}>
                                        <ListItemText primary={eq.modelo} secondary={`Estoque: ${eq.quantidade_estoque}`} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField label="Qtd." type="number" value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value, 10) || 1)} sx={{ width: 100 }} InputProps={{ inputProps: { min: 1 } }} size="small" />
                <Button type="submit" variant="contained">Adicionar</Button>
            </Box>
        </Box>
    );
}
export default AddMaterialForm;