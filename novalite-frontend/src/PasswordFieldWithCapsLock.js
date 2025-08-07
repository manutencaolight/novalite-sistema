import React, { useState } from 'react';
import { TextField, FormHelperText, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning'; // Ícone de aviso

// Este componente recebe todas as props de um TextField normal
function PasswordFieldWithCapsLock(props) {
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Esta função será chamada toda vez que uma tecla for pressionada no campo
  const handleKeyUp = (event) => {
    // getModifierState é a forma moderna e confiável de verificar o Caps Lock
    if (event.getModifierState) {
      setCapsLockOn(event.getModifierState('CapsLock'));
    }
  };

  return (
    // Usamos FormControl para agrupar o campo e a mensagem de aviso
    <FormControl variant="outlined" fullWidth required={props.required}>
      <InputLabel htmlFor={props.id}>{props.label}</InputLabel>
      <OutlinedInput
        // Passamos todas as outras props (como value, onChange, etc.) para o TextField
        {...props}
        type="password"
        // Adicionamos nosso detector de Caps Lock ao evento onKeyUp
        onKeyUp={handleKeyUp}
        // Adicionamos um ícone de aviso se o Caps Lock estiver ativo
        endAdornment={
          capsLockOn && (
            <InputAdornment position="end">
              <IconButton edge="end" color="warning">
                <WarningIcon />
              </IconButton>
            </InputAdornment>
          )
        }
      />
      {/* Exibimos a mensagem de ajuda/aviso somente quando o Caps Lock está ativo */}
      {capsLockOn && (
        <FormHelperText error>
          Atenção: A tecla Caps Lock está ativada.
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default PasswordFieldWithCapsLock;