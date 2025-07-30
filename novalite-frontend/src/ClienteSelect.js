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
    // Busca a lista de clientes da sua API do backend
    fetch('https://novalite-sistema.onrender.com/api/clientes/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Falha ao buscar clientes');
        }
        return response.json();
      })
      .then(data => {
        setClientes(data); // Armazena a lista de clientes
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro buscando clientes:", error);
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