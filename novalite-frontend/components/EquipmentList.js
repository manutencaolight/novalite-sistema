import React, { useState, useEffect } from 'react';

function EquipmentList() {
  const [equipamentos, setEquipamentos] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/equipamentos/')
      .then(response => response.json())
      .then(data => setEquipamentos(data))
      .catch(error => console.error('Erro ao buscar equipamentos:', error));
  }, []);

  return (
    <div>
      <h2>Lista de Equipamentos</h2>
      <table border="1" width="100%" cellPadding="5">
        <thead>
          <tr>
            <th>Modelo</th>
            <th>Fabricante</th>
            <th>Categoria</th>
            <th>Estoque</th>
          </tr>
        </thead>
        <tbody>
          {equipamentos.map(equip => (
            <tr key={equip.id}>
              <td>{equip.modelo}</td>
              <td>{equip.fabricante}</td>
              <td>{equip.categoria}</td>
              <td>{equip.quantidade_estoque}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EquipmentList;