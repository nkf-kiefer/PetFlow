import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, ActivityIndicator, View } from 'react-native';
import { financialRecords, clinics, employees } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppDateField from '../../components/AppDateField';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';
import { normalizeCurrencyInput } from '../../utils/masks';

const RECORD_TYPES = [
  { label: 'Receita', value: 'receita' },
  { label: 'Despesa', value: 'despesa' },
];

const RECEITA_CATS = [
  { label: 'Serviço', value: 'servico' },
  { label: 'Produto', value: 'produto' },
  { label: 'Outro',   value: 'outro' },
];

const DESPESA_CATS = [
  { label: 'Salário',     value: 'salario' },
  { label: 'Aluguel',     value: 'aluguel' },
  { label: 'Energia',     value: 'energia' },
  { label: 'Água',        value: 'agua' },
  { label: 'Telefone',    value: 'telefone' },
  { label: 'Manutenção',  value: 'manutencao' },
  { label: 'Marketing',   value: 'marketing' },
  { label: 'Outro',       value: 'outro' },
];

const STATUSES = [
  { label: 'Pendente',   value: 'pendente' },
  { label: 'Realizado',  value: 'realizado' },
  { label: 'Cancelado',  value: 'cancelado' },
];

const PAYMENT_METHODS = [
  { label: 'Boleto',   value: 'boleto' },
  { label: 'Cartão',   value: 'cartao' },
  { label: 'Dinheiro', value: 'dinheiro' },
];

export default function FinancialFormScreen({ route, navigation }) {
  const editing = !!route.params?.item;
  const item    = route.params?.item ?? {};

  const [clinicOpts,   setClinicOpts]   = useState([]);
  const [employeeOpts, setEmployeeOpts] = useState([]);
  const [loadingData,  setLoadingData]  = useState(true);
  const [allEmployees, setAllEmployees] = useState([]);

  const [form, setForm] = useState({
    clinic:         item.clinic ?? '',
    record_type:    item.record_type ?? 'receita',
    category:       item.category ?? 'servico',
    description:    item.description ?? '',
    amount:         item.amount ? String(item.amount) : '',
    status:         item.status ?? 'pendente',
    due_date:       item.due_date ?? '',
    payment_date:   item.payment_date ?? '',
    employee:       item.employee ?? '',
    payment_method: item.payment_method ?? '',
    notes:          item.notes ?? '',
  });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([clinics.list(), employees.list()])
      .then(([c, e]) => {
        const clinicsData = c.data.results ?? c.data;
        const employeesData = e.data.results ?? e.data;
        setClinicOpts(clinicsData.map((x) => ({ label: x.name, value: x.id })));
        setEmployeeOpts(employeesData.map((x) => ({ label: x.name, value: x.id })));
        setAllEmployees(employeesData);
      }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    const nextCategories = form.record_type === 'receita' ? RECEITA_CATS : DESPESA_CATS;
    if (!nextCategories.some((option) => option.value === form.category)) {
      setForm((current) => ({
        ...current,
        category: nextCategories[0]?.value ?? '',
      }));
    }
  }, [form.record_type, form.category]);

  useEffect(() => {
    if (!form.clinic) {
      setEmployeeOpts(allEmployees.map((employee) => ({ label: employee.name, value: employee.id })));
      return;
    }

    const filteredEmployees = allEmployees.filter((employee) => employee.clinic === form.clinic);
    setEmployeeOpts(filteredEmployees.map((employee) => ({ label: employee.name, value: employee.id })));

    if (!filteredEmployees.some((employee) => employee.id === form.employee)) {
      setForm((current) => ({ ...current, employee: '' }));
    }
  }, [form.clinic, form.employee, allEmployees]);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  const catOptions = form.record_type === 'receita' ? RECEITA_CATS : DESPESA_CATS;

  function validate() {
    const errs = {};
    if (!form.clinic)              errs.clinic      = 'Clínica é obrigatória';
    if (!form.description.trim())  errs.description = 'Descrição é obrigatória';
    if (!form.amount)              errs.amount      = 'Valor é obrigatório';
    if (!form.due_date)            errs.due_date    = 'Data de vencimento é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount:       Number(form.amount),
        employee:     form.employee || null,
        payment_date: form.payment_date || null,
        payment_method: form.payment_method || null,
        notes: form.notes || '',
      };
      if (editing) {
        await financialRecords.update(item.id, payload);
      } else {
        await financialRecords.create(payload);
      }
      Alert.alert('Sucesso', editing ? 'Lançamento atualizado com sucesso.' : 'Lançamento criado com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar o lançamento.'));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Confirmar exclusão', 'Deseja excluir este lançamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await financialRecords.remove(item.id);
            navigation.goBack();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          } finally { setDeleting(false); }
        },
      },
    ]);
  }

  if (loadingData) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppPicker label="Clínica *"          value={form.clinic}          options={clinicOpts}     onValueChange={set('clinic')}         error={errors.clinic} />
      <AppPicker label="Tipo"               value={form.record_type}     options={RECORD_TYPES}   onValueChange={set('record_type')} />
      <AppPicker label="Categoria"          value={form.category}        options={catOptions}     onValueChange={set('category')} />
      <AppInput  label="Descrição *"        value={form.description}     onChangeText={set('description')}    error={errors.description} />
      <AppInput  label="Valor (R$) *"       value={form.amount}          onChangeText={(value) => set('amount')(normalizeCurrencyInput(value))}         keyboardType="decimal-pad" error={errors.amount} />
      <AppPicker label="Status"             value={form.status}          options={STATUSES}       onValueChange={set('status')} />
      <AppDateField label="Vencimento *" value={form.due_date} onChange={set('due_date')} placeholder="Selecionar data" error={errors.due_date} />
      <AppDateField label="Pagamento" value={form.payment_date} onChange={set('payment_date')} placeholder="Selecionar data" />
      <AppPicker label="Forma de pagamento" value={form.payment_method}  options={PAYMENT_METHODS} onValueChange={set('payment_method')} />
      <AppPicker label="Funcionário"        value={form.employee}        options={employeeOpts}   onValueChange={set('employee')} placeholder={form.clinic ? 'Selecionar funcionário da clínica' : 'Selecione a clínica primeiro'} />
      <AppInput  label="Observações"        value={form.notes}           onChangeText={set('notes')}          multiline />

      <AppButton title="Salvar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      {editing && (
        <AppButton title="Excluir lançamento" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
