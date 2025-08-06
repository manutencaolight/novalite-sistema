// Em: src/api.js (Versão com Melhoria na Experiência do Usuário)

import { jwtDecode } from 'jwt-decode';

const baseURL = 'https://novalite-sistema.onrender.com/api';

const getAuthTokens = () => {
    const tokens = localStorage.getItem('authTokens');
    return tokens ? JSON.parse(tokens) : null;
};

const setAuthTokens = (tokens) => {
    localStorage.setItem('authTokens', JSON.stringify(tokens));
};

export const loginUser = async (username, password) => {
    const response = await fetch(`${baseURL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
        setAuthTokens(data);
        return jwtDecode(data.access);
    } else {
        throw new Error(data.detail || 'Falha no login');
    }
};

const refreshToken = async () => {
    const tokens = getAuthTokens();
    if (!tokens?.refresh) {
        return null;
    }

    try {
        const response = await fetch(`${baseURL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: tokens.refresh }),
        });

        const data = await response.json();
        if (response.ok) {
            const newTokens = { ...tokens, access: data.access };
            setAuthTokens(newTokens);
            return newTokens.access;
        } else {
            // --- ALTERAÇÃO AQUI ---
            // Avisa o usuário e recarrega a página de forma controlada.
            alert('Sua sessão expirou ou a conexão foi perdida. A página será recarregada.');
            localStorage.removeItem('authTokens');
            window.location.reload();
            return null;
        }
    } catch (error) {
        // --- E AQUI TAMBÉM ---
        // Cobre falhas de rede que impedem a comunicação com o servidor.
        alert('Falha ao reconectar com o servidor. A página será recarregada.');
        localStorage.removeItem('authTokens');
        window.location.reload();
        return null;
    }
};

export const authFetch = async (url, options = {}) => {
    let tokens = getAuthTokens();
    
    if (!tokens) {
        window.location.href = '/login';
        return Promise.reject(new Error("Token não encontrado"));
    }

    const user = jwtDecode(tokens.access);
    const isExpired = new Date(user.exp * 1000) < new Date();

    if (isExpired) {
        const newAccessToken = await refreshToken();
        if (newAccessToken) {
            tokens.access = newAccessToken;
        } else {
            return Promise.reject(new Error("Sessão expirada."));
        }
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${tokens.access}`,
    };
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

const finalUrl = url.startsWith('/') 
    ? `${baseURL}${url}`
    : `${baseURL}/${url}`;
    let response = await fetch(finalUrl, { ...options, headers });

    return response;
};