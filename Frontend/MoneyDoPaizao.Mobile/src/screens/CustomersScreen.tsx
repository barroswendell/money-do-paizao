import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, Plus, UserRound, UsersRound } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createCustomer, getCustomers, type Customer } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Customers'>;

export function CustomersScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [hasReferral, setHasReferral] = useState(false);
  const [referral, setReferral] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  async function handleCreate() {
    setError('');
    try {
      setSaving(true);
      await createCustomer(token, { name, hasReferral, referral: hasReferral ? referral : null });
      setName('');
      setReferral('');
      setHasReferral(false);
      setFormOpen(false);
      await loadCustomers();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível cadastrar o cliente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5">
        <View className="flex-row items-center">
          <Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}>
            <ArrowLeft color="#071629" size={19} strokeWidth={1.8} />
          </Pressable>
          <View>
            <Text className="text-xl font-extrabold text-navy">Clientes</Text>
            <Text className="text-[12px] text-muted">Cadastre e acompanhe seus clientes.</Text>
          </View>
        </View>
        <Pressable accessibilityLabel="Novo cliente" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setFormOpen((current) => !current)}>
          <Plus color="#D4A64A" size={20} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {formOpen ? (
            <Card className="mb-5 p-5">
              <Text className="mb-1 text-[18px] font-extrabold text-navy">Novo cliente</Text>
              <Text className="mb-5 text-[13px] leading-5 text-muted">Informe os dados básicos para criar o cadastro.</Text>

              <Text className="mb-1.5 text-[13px] font-bold text-navy">Nome completo</Text>
              <View className="mb-4 flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <UserRound color="#6D7784" size={18} strokeWidth={1.8} />
                <Input className="border-0 bg-transparent px-3" onChangeText={setName} placeholder="Nome do cliente" value={name} />
              </View>

              <View className="mb-4 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-[14px] font-bold text-navy">Possui indicação?</Text>
                  <Text className="mt-1 text-[12px] text-muted">Ative para informar quem indicou.</Text>
                </View>
                <Pressable accessibilityRole="switch" accessibilityState={{ checked: hasReferral }} onPress={() => setHasReferral((current) => !current)}>
                  <View className={`h-7 w-12 justify-center rounded-full px-1 ${hasReferral ? 'bg-navy' : 'bg-border'}`}>
                    <View className={`h-5 w-5 rounded-full bg-white ${hasReferral ? 'self-end' : 'self-start'}`} />
                  </View>
                </Pressable>
              </View>

              {hasReferral ? (
                <View className="mb-4">
                  <Text className="mb-1.5 text-[13px] font-bold text-navy">Indicação</Text>
                  <Input onChangeText={setReferral} placeholder="Nome de quem indicou" value={referral} />
                </View>
              ) : null}

              {error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
              <Button disabled={saving} onPress={handleCreate}>
                <ButtonText>{saving ? 'Salvando...' : 'Cadastrar cliente'}</ButtonText>
              </Button>
            </Card>
          ) : null}

          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <UsersRound color="#D4A64A" size={19} strokeWidth={1.8} />
              <Text className="ml-2 text-[16px] font-extrabold text-navy">Clientes cadastrados</Text>
            </View>
            <Text className="text-[13px] font-bold text-muted">{customers.length}</Text>
          </View>

          {loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}
          {!loading && customers.length === 0 ? (
            <Card className="items-center p-8">
              <UsersRound color="#6D7784" size={28} strokeWidth={1.5} />
              <Text className="mt-3 text-[15px] font-bold text-navy">Nenhum cliente ainda</Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-muted">Use o botão + para cadastrar o primeiro cliente.</Text>
            </Card>
          ) : null}

          {!loading ? customers.map((customer) => (
            <Card className="mb-3 p-4" key={customer.id}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-[16px] font-extrabold text-navy">{customer.name}</Text>
                  {customer.hasReferral ? <Text className="mt-1 text-[12px] text-muted">Indicação: {customer.referral}</Text> : null}
                </View>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-gold/20">
                  <UserRound color="#071629" size={18} strokeWidth={1.8} />
                </View>
              </View>
            </Card>
          )) : null}
        </View>
      </ScrollView>
    </View>
  );
}
