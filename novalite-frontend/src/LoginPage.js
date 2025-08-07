// Em: src/LoginPage.js (VERSÃO CORRIGIDA)

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Container, Paper, Box, Typography, TextField, Button, Alert } from '@mui/material';
// --- 1. IMPORTA A IMAGEM COMO UM MÓDULO ---
import meuLogo from './novalite_logo.png'; 
import PasswordFieldWithCapsLock from './PasswordFieldWithCapsLock'; // 1. Importe o novo componente

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            await login(username, password);
        } catch (err) {
            console.error('Erro detalhado:', err);
            
            let errorMessage = 'Erro desconhecido durante o login';
            if (typeof err === 'string') {
                errorMessage = err;
            } else if (err?.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* --- 2. USA A VARIÁVEL IMPORTADA AQUI --- */}
                <img src={meuLogo} alt="Logotipo" style={{ width: '150px', marginBottom: '1rem' }} />
                
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
                   <PasswordFieldWithCapsLock
                       id="password-field" // É bom ter um id para o InputLabel
                       margin="normal"
                       required
                       fullWidth
                       label="Senha"
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