// Em: src/api.js (Versão Corrigida e Simplificada)

import { jwtDecode } from 'jwt-decode';

// --- CORREÇÃO 1: Definimos uma única baseURL que já inclui o /api ---
const baseURL = 'https://novalite-sistema.onrender.com/api';

const getAuthTokens = () => {
    const tokens = localStorage.getItem('authTokens');
    return tokens ? JSON.parse(tokens) : null;
};

const setAuthTokens = (tokens) => {
    localStorage.setItem('authTokens', JSON.stringify(tokens));
};

export const loginUser = async (username, password) => {
    // A chamada agora usa a baseURL + o endpoint específico
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
            // Atualiza apenas o access token, mantendo o refresh token original
            const newTokens = { ...tokens, access: data.access };
            setAuthTokens(newTokens);
            return newTokens.access;
        } else {
            localStorage.removeItem('authTokens');
            window.location.href = '/login';
            return null;
        }
    } catch (error) {
        localStorage.removeItem('authTokens');
        window.location.href = '/login';
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

    // --- CORREÇÃO 2: A URL final agora é montada de forma simples e correta ---
const finalUrl = url.startsWith('/') 
    ? `${baseURL}${url}`
    : `${baseURL}/${url}`;
    let response = await fetch(finalUrl, { ...options, headers });

    return response;
};