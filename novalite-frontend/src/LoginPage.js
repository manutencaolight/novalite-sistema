// Em: src/LoginPage.js (VERSÃO DE TESTE COM CONSOLE.LOG)

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Container, Paper, Box, Typography, TextField, Button, Alert } from '@mui/material';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    console.log('1. Componente LoginPage renderizado.');

    const handleSubmit = async (event) => {
        console.log('2. Botão de login clicado, handleSubmit iniciado!');
        event.preventDefault();
        setError('');

        try {
            console.log('3. Tentando chamar a função login do contexto...');
            await login(username, password);
            console.log('4. Função login do contexto executou com sucesso!');
        } catch (err) {
            // ▼▼▼ ADICIONE ESTA LINHA ABAIXO ▼▼▼
            console.error('Erro detalhado:', err);
            console.log('ERRO. A função login falhou e caiu no catch.');
            
            // --- LÓGICA DE ERRO À PROVA DE FALHAS ---
            let errorMessage = 'Erro desconhecido durante o login';
            
            if (typeof err === 'string') {
                errorMessage = err;
            } else if (err?.message) {
                errorMessage = err.message;
            } else if (err?.response?.data) {
                errorMessage = err.response.data.message || 
                               err.response.data.error || 
                               JSON.stringify(err.response.data);
            } else if (err instanceof Error) {
                errorMessage = err.toString();
            }
            
            setError(errorMessage);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/assets/novalite_logo.png" alt="Logotipo" style={{ width: '150px', marginBottom: '1rem' }} />
                <Typography component="h1" variant="h5">
                    Acesso ao Sistema
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Usuário"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Entrar
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default LoginPage;