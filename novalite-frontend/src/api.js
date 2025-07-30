// Em: src/api.js (Versão Final com Atualização de Token)

import { jwtDecode } from 'jwt-decode';
const API_BASE_URL = 'https://novalite-sistema.onrender.com';
const baseURL = 'https://novalite-sistema.onrender.com';

// Função para fazer o login (sem alterações)
export const loginUser = async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('authTokens', JSON.stringify(data));
        return jwtDecode(data.access);
    } else {
        throw new Error(data.detail || 'Falha no login');
    }
};

// --- NOVA FUNÇÃO PARA ATUALIZAR O TOKEN ---
const refreshToken = async () => {
    const tokens = JSON.parse(localStorage.getItem('authTokens'));
    if (!tokens?.refresh) {
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: tokens.refresh }),
        });

        const data = await response.json();
        if (response.ok) {
            // Salva os novos tokens e retorna o novo access token
            localStorage.setItem('authTokens', JSON.stringify(data));
            return data.access;
        } else {
            // Se a atualização falhar (ex: refresh token expirou), retorna null
            return null;
        }
    } catch (error) {
        return null;
    }
};


// --- FUNÇÃO authFetch ATUALIZADA ---
// A "chave mestra" que adiciona o token e agora também tenta atualizá-lo
export const authFetch = async (url, options = {}) => {
    let tokens = JSON.parse(localStorage.getItem('authTokens'));
    
    if (!tokens) {
        window.location.href = '/login';
        return Promise.reject("Token não encontrado");
    }

    // Adiciona o token de acesso ao cabeçalho
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${tokens.access}`,
    };
    // Garante que o Content-Type seja definido se houver um corpo, mas não para FormData
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }


    let response = await fetch(`${API_BASE_URL}/api${url}`, { ...options, headers });

    // Se a resposta for 401, tenta atualizar o token
    if (response.status === 401) {
        console.log("Token de acesso expirado. Tentando atualizar...");
        
        const newAccessToken = await refreshToken();

        if (newAccessToken) {
            console.log("Token atualizado com sucesso. Tentando a requisição novamente...");
            // Tenta a requisição original novamente com o novo token
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(`${API_BASE_URL}/api${url}`, { ...options, headers });
        } else {
            // Se a atualização falhar, faz o logout
            console.log("Falha ao atualizar o token. Fazendo logout.");
            localStorage.removeItem('authTokens');
            window.location.href = '/login';
            return Promise.reject("Sessão completamente expirada.");
        }
    }

    return response;
};