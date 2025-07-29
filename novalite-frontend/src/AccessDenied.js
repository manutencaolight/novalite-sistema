// Em: src/AccessDenied.js
import React from 'react';
import { Typography, Container, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function AccessDenied() {
    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                <Typography variant="h3" component="h1" gutterBottom>
                    Acesso Negado
                </Typography>
                <Typography variant="body1">
                    Você não tem permissão para visualizar esta página.
                </Typography>
                <Button
                    component={Link}
                    to="/"
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >
                    Voltar para a Página Inicial
                </Button>
            </Box>
        </Container>
    );
}

export default AccessDenied;