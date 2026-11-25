import { CalendarDays, Landmark, ShoppingBag, Wallet } from 'lucide-react-native';
import type { ProductModule } from '../services/api';

export const moduleOptions = [
  { module: 'Loans', title: 'Empréstimos', description: 'Clientes, juros e recebimentos.', icon: Landmark },
  { module: 'Parties', title: 'Organização de festas', description: 'Agenda, temas e recebimentos.', icon: CalendarDays },
  { module: 'PersonalFinance', title: 'Finanças pessoais', description: 'Entradas, gastos e saldo do mês.', icon: Wallet },
  { module: 'Sales', title: 'Vendas', description: 'Produtos, clientes e pagamentos.', icon: ShoppingBag },
] satisfies { module: ProductModule; title: string; description: string; icon: typeof Wallet }[];
