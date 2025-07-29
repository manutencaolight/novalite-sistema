// Em: src/DispatchMaterialModal.js

import React, { useState, useEffect } from 'react';

function DispatchMaterialModal({ evento, onClose, onDispatchSuccess }) {
  const [itemsToDispatch, setItemsToDispatch] = useState([]);

  useEffect(() => {
    const pendingItems = (evento.materialevento_set || [])
      .filter(item => item.quantidade > item.quantidade_separada)
      .map(item => ({
        ...item,
        pending: item.quantidade - item.quantidade_separada,
        dispatching_qty: item.quantidade - item.quantidade_separada,
      }));
    setItemsToDispatch(pendingItems);
  }, [evento]);

  const handleQuantityChange = (id, value) => {
    const numericValue = parseInt(value, 10) || 0;
    setItemsToDispatch(itemsToDispatch.map(item =>
      item.id === id ? { ...item, dispatching_qty: numericValue } : item
    ));
  };

  const handleSubmit = () => {
    const payload = {
      materiais: itemsToDispatch
        .filter(item => item.dispatching_qty > 0) // Envia apenas itens com quantidade > 0
        .map(item => ({
          id: item.id,
          qtd: item.dispatching_qty,
          modelo: item.equipamento.modelo // Enviamos o modelo para o PDF
        }))
    };

    if (payload.materiais.length === 0) {
        alert("Nenhuma quantidade foi especificada para a saída.");
        return;
    }

    fetch(`https://novalite-sistema.onrender.com/api/eventos/${evento.id}/dar_saida/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) { return response.json().then(err => {throw new Error(err.error)}); }
      return response.json();
    })
    .then(() => {
        // Pergunta se deseja gerar a guia de saída
        if(window.confirm("Saída registrada com sucesso! Deseja gerar a Guia de Saída em PDF?")) {
            generateDispatchNote(payload.materiais);
        }
        onDispatchSuccess();
    })
    .catch(error => alert(`Erro: ${error.message}`));
  };

  const generateDispatchNote = (dispatchedItems) => {
    fetch(`http://127.0.0.1:8000/reports/guia-saida/${evento.id}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: dispatchedItems })
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('Falha ao gerar PDF.');
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Guia_Saida_${evento.nome || 'Operacao'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Dar Saída de Material - {evento.nome || "Operação"}</h3>
        {itemsToDispatch.length > 0 ? (
            <table className="styled-table" width="100%">
              <thead>
                  <tr><th>Item</th><th>Qtd. Pendente</th><th>Qtd. para Saída</th></tr>
              </thead>
              <tbody>
                  {itemsToDispatch.map(item => (
                  <tr key={item.id}>
                      <td>{item.equipamento.modelo}</td>
                      <td>{item.pending}</td>
                      <td><input type="number" value={item.dispatching_qty} onChange={e => handleQuantityChange(item.id, e.target.value)} min="0" max={item.pending} style={{width: '70px'}}/></td>
                  </tr>
                  ))}
              </tbody>
            </table>
        ) : <p>Nenhum material pendente para saída.</p>}
        <div className="modal-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSubmit} className="confirm-btn">Confirmar Saída e Gerar Guia</button>
        </div>
      </div>
    </div>
  );
}

export default DispatchMaterialModal;