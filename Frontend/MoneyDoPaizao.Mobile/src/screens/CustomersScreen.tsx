import { useTheme } from '../theme/ThemeProvider';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, View } from 'react-native';
import { UsersRound } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { RecordActions } from '../components/RecordActions';
import { useRecordEditor } from '../lib/use-record-editor';
import { Card } from '../components/ui/card';
import { FieldLabel, Input } from '../components/ui/input';
import { FormToggle, ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import { formatPhone } from '../lib/format';
import { RootStackParamList } from '../navigation/AppNavigator';
import { saveCustomer, getCustomers, type Customer } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Customers'>;

export function CustomersScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { token } = route.params;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hasReferral, setHasReferral] = useState(false);
  const [referral, setReferral] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editor = useRecordEditor<Customer>((record) => {
    setName(record?.name ?? '');
    setPhone(formatPhone(record?.phone ?? ''));
    setHasReferral(record?.hasReferral ?? false);
    setReferral(record?.referral ?? '');
    setError('');
  });

  async function loadCustomers() {
    try {
      setLoading(true);
      setCustomers(await getCustomers(token));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [token]);

  async function handleSave() {
    if (saving) return;
    setError('');
    if (phone.replace(/\D/g, '').length < 10 && !(editor.record && !editor.record.phone && !phone.trim())) {
      setError('Informe um telefone válido com DDD.');
      return;
    }

    try {
      setSaving(true);
      await saveCustomer(token, {
        name,
        hasReferral,
        referral: hasReferral ? referral : null,
        phone,
      }, editor.record?.id);
      editor.close();
      await loadCustomers();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível cadastrar o cliente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Clientes"
        onBack={() => navigation.goBack()}
        actions={<FormToggle label="Novo cliente" open={editor.open} onPress={editor.toggle} disabled={saving} />}
      />

      <ScrollView ref={editor.scrollRef} className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {editor.open ? (
            <Card className="mb-5 p-5">
              <Text className="mb-4 text-[18px] font-extrabold text-foreground">{editor.record ? 'Editar cliente' : 'Novo cliente'}</Text>

              <FieldLabel>Nome completo</FieldLabel>
              <Input accessibilityLabel="Nome completo" className="mb-4" onChangeText={setName} placeholder="Nome do cliente" value={name} />

              <View className="mb-4">
                <FieldLabel>Telefone com DDD</FieldLabel>
                <Input
                  accessibilityLabel="Telefone com DDD"
                  autoComplete="tel-national"
                  keyboardType="phone-pad"
                  maxLength={15}
                  onChangeText={(value) => setPhone(formatPhone(value))}
                  placeholder="(00) 00000-0000"
                  value={phone}
                />
              </View>

              <View className="mb-4 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-[14px] font-bold text-foreground">Possui indicação?</Text>
                  <Text className="mt-1 text-[12px] text-muted">Ative para informar quem indicou.</Text>
                </View>
                <Switch accessibilityLabel="Possui indicação?" value={hasReferral} onValueChange={setHasReferral} trackColor={{ false: colors.fieldBorder, true: colors.primary }} />
              </View>

              {hasReferral ? (
                <View className="mb-4">
                  <FieldLabel>Indicação</FieldLabel>
                  <Input accessibilityLabel="Indicação" onChangeText={setReferral} placeholder="Nome de quem indicou" value={referral} />
                </View>
              ) : null}

              {error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
              <Button disabled={saving} onPress={handleSave}>
                <ButtonText>{saving ? 'Salvando...' : editor.record ? 'Salvar alterações' : 'Cadastrar cliente'}</ButtonText>
              </Button>
            </Card>
          ) : null}

          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">

              <Text className="text-[16px] font-bold text-foreground">Clientes cadastrados</Text>
            </View>
            <Text className="text-[13px] font-bold text-muted">{customers.length}</Text>
          </View>

          {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
          {!loading && customers.length === 0 ? (
            <Card className="items-center p-8">
              <UsersRound color={colors.muted} size={28} strokeWidth={1.5} />
              <Text className="mt-3 text-[15px] font-bold text-foreground">Nenhum cliente ainda</Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-muted">Use o botão + para cadastrar o primeiro cliente.</Text>
            </Card>
          ) : null}

          {!loading ? customers.map((customer) => (
            <Card className="mb-3 p-4" key={customer.id}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-[16px] font-extrabold text-foreground">{customer.name}</Text>
                  {customer.phone ? <Text className="mt-1 text-[12px] text-muted">{formatPhone(customer.phone)}</Text> : null}
                  {customer.hasReferral ? <Text className="mt-1 text-[12px] text-muted">Indicação: {customer.referral}</Text> : null}
                </View>

              </View>
              <RecordActions
                token={token} kind="Customer" id={customer.id} name={customer.name} disabled={saving}
                onEdit={() => editor.show(customer)}
                onDeleted={() => {
                  setCustomers((items) => items.filter((item) => item.id !== customer.id));
                  if (editor.record?.id === customer.id) editor.close();
                }}
              />
            </Card>
          )) : null}
        </View>
      </ScrollView>
    </View>
  );
}
