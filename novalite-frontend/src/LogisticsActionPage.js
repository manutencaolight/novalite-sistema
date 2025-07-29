// Em: src/LogisticsActionPage.js

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DispatchModal from './DispatchModal';
import ReturnMaterialModal from './ReturnMaterialModal';
import './EventDetail.css'; // Reutiliza o mesmo estilo

function LogisticsActionPage() {
    const [evento, setEvento] = useState(null);
    const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    const fetchData = () => {
        fetch(`http://127.0.0.1:8000/api/eventos/${id}/`)
            .then(res => res.ok ? res.json() : Promise.reject('Evento não encontrado'))
            .then(data => setEvento(data))
            .catch(error => alert(error.message));
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleAction = (actionUrl, body, confirmationMessage) => {
        if (confirmationMessage && !window.confirm(confirmationMessage)) return;
        fetch(`http://127.0.0.1:8000/api/eventos/${id}/${actionUrl}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => { alert(data.status); fetchData(); })
        .catch(error => alert(`Erro: ${error.error || 'Ocorreu um problema.'}`));
    };
    
    const handleReturnForCorrection = () => {
        const observacao = prompt("Descreva o motivo para a correção (ex: itens faltantes):");
        if (observacao) {
            handleAction('retornar_para_correcao', { observacao }, 'Tem certeza que deseja retornar esta lista para correção?');
        }
    };

    const handleToggleConferencia = (materialId) => {
        fetch(`http://127.0.0.1:8000/api/materiais/${materialId}/toggle_conferencia/`, { method: 'POST' })
        .then(res => { if(res.ok) fetchData(); });
    };

    const handleSuccess = (modalSetter) => {
        fetchData();
        modalSetter(false);
    };

    if (!evento) return <p>Carregando...</p>;

    return (
        <div>
            {isDispatchModalOpen && <DispatchModal evento={evento} onClose={() => setDispatchModalOpen(false)} onDispatchSuccess={() => handleSuccess(setDispatchModalOpen)} />}
            {isReturnModalOpen && <ReturnMaterialModal evento={evento} onClose={() => setReturnModalOpen(false)} onReturnSuccess={() => handleSuccess(setReturnModalOpen)} />}

            <Link to="/logistica">← Voltar para Painel de Logística</Link>
            <hr />
            <h2>Logística: {evento.nome || "Operação Sem Nome"}</h2>
            <p><strong>Status:</strong> <span className={`event-status status-${evento.status}`}>{evento.status_display}</span></p>

            <div className="management-section">
                <h3>Ações de Logística</h3>
                <div className="action-buttons">
                    {evento.status === 'AGUARDANDO_CONFERENCIA' && (
                        <>
                            <button onClick={() => handleAction('aprovar_lista', {}, 'Aprovar esta lista e liberar para saída?')} style={{backgroundColor: '#28a745'}}>👍 Aprovar Lista</button>
                            <button onClick={handleReturnForCorrection} style={{backgroundColor: '#dc3545'}}>❌ Retornar p/ Correção</button>
                        </>
                    )}
                    {evento.status === 'AGUARDANDO_SAIDA' && <button onClick={() => setDispatchModalOpen(true)}>🚚 Registrar Saída de Material</button>}
                    {evento.status === 'EM_ANDAMENTO' && <button onClick={() => setReturnModalOpen(true)}>📦 Registrar Retorno de Material</button>}
                </div>
            </div>

            <div className="management-section">
                <h3>Lista de Materiais para Conferência</h3>
                <p>Marque cada item após a separação física.</p>
                <table className="styled-table conference-table">
                    <thead><tr><th>Conferido</th><th>Item/Descrição</th><th>Qtd. Planejada</th></tr></thead>
                    <tbody>
                        {(evento.materialevento_set || []).map(material => (
                            <tr key={material.id} className={material.conferido ? 'item-conferido' : ''}>
                                <td style={{textAlign: 'center'}}><input type="checkbox" checked={material.conferido} onChange={() => handleToggleConferencia(material.id)} disabled={evento.status !== 'AGUARDANDO_CONFERENCIA'} /></td>
                                <td>{material.equipamento?.modelo || material.item_descricao}</td>
                                <td style={{textAlign: 'center'}}>{material.quantidade}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default LogisticsActionPage;