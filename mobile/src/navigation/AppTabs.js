import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';

// ── Screens ───────────────────────────────────────────────────────────────────
import DashboardScreen       from '../screens/DashboardScreen';
import MoreScreen            from '../screens/MoreScreen';

import SchedulingsScreen     from '../screens/schedulings/SchedulingsScreen';
import SchedulingFormScreen  from '../screens/schedulings/SchedulingFormScreen';

import TutorsScreen          from '../screens/tutors/TutorsScreen';
import TutorFormScreen       from '../screens/tutors/TutorFormScreen';
import PetsScreen            from '../screens/pets/PetsScreen';
import PetFormScreen         from '../screens/pets/PetFormScreen';

import ClinicsScreen         from '../screens/clinics/ClinicsScreen';
import ClinicFormScreen      from '../screens/clinics/ClinicFormScreen';
import EmployeesScreen       from '../screens/employees/EmployeesScreen';
import EmployeeFormScreen    from '../screens/employees/EmployeeFormScreen';
import ServicesScreen        from '../screens/services/ServicesScreen';
import ServiceFormScreen     from '../screens/services/ServiceFormScreen';
import ProductsScreen        from '../screens/products/ProductsScreen';
import ProductFormScreen     from '../screens/products/ProductFormScreen';
import StockScreen           from '../screens/stock/StockScreen';
import StockFormScreen       from '../screens/stock/StockFormScreen';
import FinancialScreen       from '../screens/financial/FinancialScreen';
import FinancialFormScreen   from '../screens/financial/FinancialFormScreen';

// ── Shared header options ─────────────────────────────────────────────────────
const headerOpts = {
  headerStyle: { backgroundColor: colors.sidebarBg },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
};

// ── Individual Stack Navigators ───────────────────────────────────────────────
const HomeS = createNativeStackNavigator();
function HomeStack() {
  return (
    <HomeS.Navigator screenOptions={headerOpts}>
      <HomeS.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Início' }} />
    </HomeS.Navigator>
  );
}

const AgendaS = createNativeStackNavigator();
function AgendaStack() {
  return (
    <AgendaS.Navigator screenOptions={headerOpts}>
      <AgendaS.Screen name="Agendamentos"   component={SchedulingsScreen}    options={{ title: 'Agenda' }} />
      <AgendaS.Screen name="AgendamentoForm" component={SchedulingFormScreen} options={({ route }) => ({ title: route.params?.item ? 'Editar Agendamento' : 'Novo Agendamento' })} />
    </AgendaS.Navigator>
  );
}

const PetsS = createNativeStackNavigator();
function PetsStack() {
  return (
    <PetsS.Navigator screenOptions={headerOpts}>
      <PetsS.Screen name="Tutores"    component={TutorsScreen}    options={{ title: 'Tutores e Pets' }} />
      <PetsS.Screen name="TutorForm"  component={TutorFormScreen} options={({ route }) => ({ title: route.params?.item ? 'Editar Tutor' : 'Novo Tutor' })} />
      <PetsS.Screen name="Pets"       component={PetsScreen}      options={{ title: 'Pets' }} />
      <PetsS.Screen name="PetForm"    component={PetFormScreen}   options={({ route }) => ({ title: route.params?.item ? 'Editar Pet' : 'Novo Pet' })} />
    </PetsS.Navigator>
  );
}

const MaisS = createNativeStackNavigator();
function MaisStack() {
  return (
    <MaisS.Navigator screenOptions={headerOpts}>
      <MaisS.Screen name="Mais"            component={MoreScreen}           options={{ title: 'Mais' }} />
      <MaisS.Screen name="Clinicas"        component={ClinicsScreen}        options={{ title: 'Clínicas' }} />
      <MaisS.Screen name="ClinicaForm"     component={ClinicFormScreen}     options={({ route }) => ({ title: route.params?.item ? 'Editar Clínica' : 'Nova Clínica' })} />
      <MaisS.Screen name="Funcionarios"    component={EmployeesScreen}      options={{ title: 'Funcionários' }} />
      <MaisS.Screen name="FuncionarioForm" component={EmployeeFormScreen}   options={({ route }) => ({ title: route.params?.item ? 'Editar Funcionário' : 'Novo Funcionário' })} />
      <MaisS.Screen name="Servicos"        component={ServicesScreen}       options={{ title: 'Serviços' }} />
      <MaisS.Screen name="ServicoForm"     component={ServiceFormScreen}    options={({ route }) => ({ title: route.params?.item ? 'Editar Serviço' : 'Novo Serviço' })} />
      <MaisS.Screen name="Produtos"        component={ProductsScreen}       options={{ title: 'Produtos' }} />
      <MaisS.Screen name="ProdutoForm"     component={ProductFormScreen}    options={({ route }) => ({ title: route.params?.item ? 'Editar Produto' : 'Novo Produto' })} />
      <MaisS.Screen name="Estoque"         component={StockScreen}          options={{ title: 'Estoque' }} />
      <MaisS.Screen name="EstoqueForm"     component={StockFormScreen}      options={{ title: 'Nova Movimentação' }} />
      <MaisS.Screen name="Financeiro"      component={FinancialScreen}      options={{ title: 'Financeiro' }} />
      <MaisS.Screen name="FinanceiroForm"  component={FinancialFormScreen}  options={({ route }) => ({ title: route.params?.item ? 'Editar Lançamento' : 'Novo Lançamento' })} />
    </MaisS.Navigator>
  );
}

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

const TAB_ICONS = { Início: '🏠', Agenda: '📅', 'Pets/Tutores': '🐾', Mais: '☰' };

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.sidebarBg,
          borderTopColor: 'rgba(148,163,184,0.18)',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Início"       component={HomeStack} />
      <Tab.Screen name="Agenda"       component={AgendaStack} />
      <Tab.Screen name="Pets/Tutores" component={PetsStack} />
      <Tab.Screen name="Mais"         component={MaisStack} />
    </Tab.Navigator>
  );
}
