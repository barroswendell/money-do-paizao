import { useState } from 'react';
import { Modal, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { deactivateRecord, type RecordKind } from '../services/api';
import { Button, ButtonText } from './ui/button';
import { Card } from './ui/card';
import { Text } from './ui/text';

type Props = {
  token: string;
  kind: RecordKind;
  id: string;
  name: string;
  onEdit: () => void;
  onDeleted: () => void;
  disabled?: boolean;
};

export function RecordActions({ token, kind, id, name, onEdit, onDeleted, disabled }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  function close() {
    if (deleting) return;
    setConfirming(false);
    setError('');
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError('');
    try {
      await deactivateRecord(token, kind, id);
      setConfirming(false);
      onDeleted();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível excluir o registro.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <View className="mt-3 flex-row flex-wrap gap-2 border-t border-border pt-3">
        <Button accessibilityLabel={`Editar ${name}`} disabled={disabled} onPress={onEdit} size="sm" variant="outline"><ButtonText variant="outline">Editar</ButtonText></Button>
        <Button
          accessibilityLabel={`Histórico de ${name}`}
          disabled={disabled}
          onPress={() => navigation.navigate('RecordHistory', { token, kind, recordId: id, title: name })}
          size="sm"
          variant="outline"
        >
          <ButtonText variant="outline">Histórico</ButtonText>
        </Button>
        <Button accessibilityLabel={`Excluir ${name}`} disabled={disabled} onPress={() => setConfirming(true)} size="sm" variant="outline">
          <ButtonText className="text-destructive" variant="outline">Excluir</ButtonText>
        </Button>
      </View>
      {confirming ? (
        <Modal animationType="fade" onRequestClose={close} transparent>
          <View className="flex-1 items-center justify-center bg-black/50 p-5">
            <Card className="w-full max-w-md gap-3 p-5">
              <Text accessibilityRole="header" className="text-lg font-bold">Excluir registro?</Text>
              <Text className="font-semibold">{name}</Text>
              <Text className="text-sm text-muted">O registro sairá das listas e dos totais. A exclusão ficará no histórico.</Text>
              {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
              <View className="flex-row flex-wrap justify-end gap-2">
                <Button disabled={deleting} onPress={close} size="sm" variant="outline"><ButtonText variant="outline">Cancelar</ButtonText></Button>
                <Button disabled={deleting} onPress={handleDelete} size="sm"><ButtonText>{deleting ? 'Excluindo...' : 'Confirmar exclusão'}</ButtonText></Button>
              </View>
            </Card>
          </View>
        </Modal>
      ) : null}
    </>
  );
}
