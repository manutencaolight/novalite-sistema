// Em: src/AuthContext.js (Versão Corrigida e Robusta)

import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext({
    user: null,
    login: () => Promise.reject(),
    logout: () => {},
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const tokens = localStorage.getItem('authTokens');
        if (tokens) {
            try {
                return jwtDecode(JSON.parse(tokens).access);
            } catch (e) {
                console.error("Erro ao decodificar token:", e);
                localStorage.removeItem('authTokens');
                return null;
            }
        }
        return null;
    });
    
    const navigate = useNavigate();

    const login = async (username, password) => {
        try {
            const response = await fetch(''https://novalite-sistema.onrender.com/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            // Verifica se a resposta é JSON válido
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            const data = isJson ? await response.json() : null;

            if (response.ok) {
                localStorage.setItem('authTokens', JSON.stringify(data));
                const decodedUser = jwtDecode(data.access);
                setUser(decodedUser);
                navigate('/');
            } else {
                // Tratamento robusto de diferentes formatos de erro
                let errorMessage = 'Falha no login';
                
                if (data?.detail) {
                    errorMessage = data.detail;
                } else if (data?.errors) {
                    errorMessage = Object.values(data.errors).flat().join(', ');
                } else if (data?.message) {
                    errorMessage = data.message;
                } else if (!isJson) {
                    errorMessage = `Erro ${response.status}: ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }
        } catch (err) {
            // Trata erros de rede e exceções inesperadas
            let errorMessage = 'Erro de conexão';
            
            if (err.name === 'AbortError') {
                errorMessage = 'Tempo de conexão esgotado';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            throw new Error(errorMessage);
        }
    };

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    }, [navigate]);

    const value = { user, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};