// Em: src/MaterialSearch.js
import React, { useState, useEffect } from 'react';
import './MaterialSearch.css';

function MaterialSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Não busca se a query estiver vazia
        if (query.trim() === '') {
            setResults([]);
            return;
        }

        setLoading(true);
        const timerId = setTimeout(() => {
            fetch('https://novalite-sistema.onrender.com/api/equipamentos/?search=${query}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Erro na busca:", err);
                    setLoading(false);
                });
        }, 500); // Espera 500ms após o usuário parar de digitar

        return () => clearTimeout(timerId); // Limpa o timer se o usuário continuar digitando
    }, [query]);

    return (
        <div className="search-page">
            <h2>Pesquisa Rápida de Equipamentos</h2>
            <input 
                type="text"
                className="search-bar"
                placeholder="Digite o modelo ou fabricante do equipamento..."
                value={query}
                onChange={e => setQuery(e.target.value)}
            />

            {loading && <p>Buscando...</p>}

            <table className="search-results-table">
                <thead>
                    <tr>
                        <th>Modelo</th>
                        <th>Fabricante</th>
                        <th>Categoria</th>
                        <th>Em Estoque</th>
                        <th>Em Manutenção</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(item => (
                        <tr key={item.id}>
                            <td>{item.modelo}</td>
                            <td>{item.fabricante}</td>
                            <td>{item.categoria}</td>
                            <td>{item.quantidade_estoque}</td>
                            <td>{item.quantidade_manutencao}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default MaterialSearch;