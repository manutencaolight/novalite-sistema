// Em: src/ClienteSelect.js

import React, { useState, useEffect } from 'react';

// Este componente recebe duas "props":
// - value: o cliente atualmente selecionado
// - onChange: uma função para ser chamada quando o usuário selecionar um novo cliente
function ClienteSelect({ value, onChange }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // CORRIGIDO: Usa authFetch e trata a resposta da API corretamente
    authFetch('/clientes/')
      .then(response => {
        if (!response.ok) throw new Error('Falha ao buscar clientes');
        return response.json();
      })
      .then(data => {
        setClientes(data.results || data); // Funciona com e sem paginação
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []); // O array vazio [] garante que a busca aconteça apenas uma vez

  if (loading) {
    return <p>Carregando clientes...</p>;
  }

  if (error) {
    return <p>Erro ao carregar clientes: {error}</p>;
  }

  return (
    <select value={value} onChange={onChange} required>
      <option value="">-- Selecione um Cliente --</option>
      {clientes.map(cliente => (
        <option key={cliente.id} value={cliente.id}>
          {cliente.empresa}
        </option>
      ))}
    </select>
  );
}

export default ClienteSelect;