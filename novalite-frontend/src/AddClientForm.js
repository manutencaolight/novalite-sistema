// Em: src/components/AddClientForm.js

import React, { useState, useEffect } from 'react';

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
    const clientData = { empresa, representante, telefone, email };
    onSave(clientData, editingItem ? editingItem.id : null);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '2rem' }}>
      <h3>{editingItem ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nome da Empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} required />
        <input type="text" placeholder="Nome do Representante" value={representante} onChange={e => setRepresentante(e.target.value)} required />
        <input type="text" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <button type="submit">{editingItem ? 'Atualizar' : 'Adicionar'}</button>
        {editingItem && <button type="button" onClick={onCancelEdit} style={{ marginLeft: '10px' }}>Cancelar</button>}
      </form>
    </div>
  );
}

export default AddClientForm;