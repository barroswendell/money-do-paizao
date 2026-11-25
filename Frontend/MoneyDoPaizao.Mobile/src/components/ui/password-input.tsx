import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { FieldLabel, Input } from './input';
import { IconButton } from './screen-header';

export function PasswordInput({ label, ...props }: Pick<TextInputProps, 'autoComplete' | 'onChangeText' | 'onSubmitEditing' | 'placeholder' | 'returnKeyType' | 'value'> & { label: string }) {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();
  const Icon = visible ? EyeOff : Eye;

  return (
    <>
      <FieldLabel>{label}</FieldLabel>
      <Input
        {...props}
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!visible}
        endAdornment={(
          <IconButton
            accessibilityLabel={visible ? 'Ocultar ' + label.toLowerCase() : 'Mostrar ' + label.toLowerCase()}
            className="mr-1 border-0 bg-transparent"
            onPress={() => setVisible((current) => !current)}
          >
            <Icon color={colors.foreground} size={20} />
          </IconButton>
        )}
      />
    </>
  );
}
