import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { LoansScreen } from '../screens/LoansScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { PartyDashboardScreen } from '../screens/PartyDashboardScreen';
import { PartyEventsScreen } from '../screens/PartyEventsScreen';
import { PartyThemesScreen } from '../screens/PartyThemesScreen';
import { ModuleSelectionScreen } from '../screens/ModuleSelectionScreen';
import { SalesDashboardScreen } from '../screens/SalesDashboardScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { SalesScreen } from '../screens/SalesScreen';
import type { ProductModule } from '../services/api';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ModuleSelection: {
    userName: string;
    role: 'Admin' | 'Usuario';
    token: string;
    modules: ProductModule[];
  };
  Dashboard: {
    userName: string;
    role: 'Admin' | 'Usuario';
    token: string;
    module: ProductModule;
  };
  Customers: { token: string };
  Loans: { token: string; openCreate?: boolean };
  Finance: { token: string };
  PartyDashboard: { userName: string; token: string };
  PartyEvents: { token: string };
  PartyThemes: { token: string };
  SalesDashboard: { userName: string; token: string };
  Products: { token: string };
  Sales: { token: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ModuleSelection" component={ModuleSelectionScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Customers" component={CustomersScreen} />
      <Stack.Screen name="Loans" component={LoansScreen} />
      <Stack.Screen name="Finance" component={FinanceScreen} />
      <Stack.Screen name="PartyDashboard" component={PartyDashboardScreen} />
      <Stack.Screen name="PartyEvents" component={PartyEventsScreen} />
      <Stack.Screen name="PartyThemes" component={PartyThemesScreen} />
      <Stack.Screen name="SalesDashboard" component={SalesDashboardScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="Sales" component={SalesScreen} />
    </Stack.Navigator>
  );
}
