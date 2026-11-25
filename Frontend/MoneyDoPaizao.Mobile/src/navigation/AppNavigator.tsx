import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { LoansScreen } from '../screens/LoansScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { PartyDashboardScreen } from '../screens/PartyDashboardScreen';
import { PartyEventsScreen } from '../screens/PartyEventsScreen';
import { PartyProductsScreen } from '../screens/PartyProductsScreen';
import { PartyThemesScreen } from '../screens/PartyThemesScreen';
import { ModuleSelectionScreen } from '../screens/ModuleSelectionScreen';
import { SalesDashboardScreen } from '../screens/SalesDashboardScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { SalesScreen } from '../screens/SalesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RecordHistoryScreen } from '../screens/RecordHistoryScreen';
import type { ProductModule, RecordKind } from '../services/api';
import type { AuthResponse } from '../services/api';

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
    modules: ProductModule[];
  };
  Customers: { token: string };
  Loans: { token: string; openCreate?: boolean };
  Finance: { userName: string; role: 'Admin' | 'Usuario'; token: string; modules: ProductModule[] };
  PartyDashboard: { userName: string; role: 'Admin' | 'Usuario'; token: string; modules: ProductModule[] };
  PartyEvents: { token: string; month?: string; create?: boolean };
  PartyProducts: { token: string };
  PartyThemes: { token: string };
  SalesDashboard: { userName: string; role: 'Admin' | 'Usuario'; token: string; modules: ProductModule[] };
  Products: { token: string };
  Sales: { token: string };
  Settings: { token: string };
  RecordHistory: { token: string; kind?: RecordKind; recordId?: string; title?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator({ session }: { session: AuthResponse | null }) {
  return (
    <Stack.Navigator initialRouteName={session ? 'ModuleSelection' : 'Login'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="ModuleSelection"
        component={ModuleSelectionScreen}
        initialParams={session ? { userName: session.name, role: session.role, token: session.token, modules: session.modules } : undefined}
      />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Customers" component={CustomersScreen} />
      <Stack.Screen name="Loans" component={LoansScreen} />
      <Stack.Screen name="Finance" component={FinanceScreen} />
      <Stack.Screen name="PartyDashboard" component={PartyDashboardScreen} />
      <Stack.Screen name="PartyEvents" component={PartyEventsScreen} />
      <Stack.Screen name="PartyProducts" component={PartyProductsScreen} />
      <Stack.Screen name="PartyThemes" component={PartyThemesScreen} />
      <Stack.Screen name="SalesDashboard" component={SalesDashboardScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="Sales" component={SalesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="RecordHistory" component={RecordHistoryScreen} />
    </Stack.Navigator>
  );
}
