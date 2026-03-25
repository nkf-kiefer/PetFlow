import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, ActivityIndicator, View } from 'react-native';
import { stockMovements, clinics, products, employees } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';

const MOVEMENT_TYPES = [
  { label: 'Entrada',   value: 'entrada' },
  { label: 'Saída',     value: 'saida' },
  { label: 'Ajuste',    value: 'ajuste' },
  { label: 'Devolução', value: 'devolucao' },
];

export default function StockFormScreen({ navigation }) {
  const [clinicOpts,   setClinicOpts]   = useState([]);
  const [productOpts,  setProductOpts]  = useState([]);
  const [employeeOpts, setEmployeeOpts] = useState([]);
  const [loadingData,  setLoadingData]  = useState(true);

  const [form, setForm] = useState({
    clinic:        '',
    product:       '',
    movement_type: 'entrada',
    quantity:      '',
    description:   '',
    employee:      '',
    notes:         '',
  });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    Promise.all([clinics.list(), products.list(), employees.list()])
      .then(([c, p, e]) => {
        setClinicOpts(  (c.data.results ?? c.data).map((x) => ({ label: x.name, value: x.id })));
        setProductOpts( (p.data.results ?? p.data).map((x) => ({ label: x.name, value: x.id })));
        setEmployeeOpts((e.data.results ?? e.data).map((x) => ({ label: x.name, value: x.id })));
      }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  function validate() {
    const errs = {};
    if (!form.clinic)              errs.clinic      = 'Clínica é obrigatória';
    if (!form.product)             errs.product     = 'Produto é obrigatório';
    if (!form.quantity)            errs.quantity    = 'Quantidade é obrigatória';
    if (!form.description.trim())  errs.description = 'Descrição é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await stockMovements.create({
        ...form,
        quantity: Number(form.quantity),
        employee: form.employee || null,
      });
      Alert.alert('Sucesso', 'Movimentação registrada com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível registrar a movimentação.'));
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppPicker label="Clínica *"    value={form.clinic}       options={clinicOpts}   onValueChange={set('clinic')}        error={errors.clinic} />
      <AppPicker label="Produto *"    value={form.product}      options={productOpts}  onValueChange={set('product')}       error={errors.product} />
      <AppPicker label="Tipo"         value={form.movement_type} options={MOVEMENT_TYPES} onValueChange={set('movement_type')} />
      <AppInput  label="Quantidade *" value={form.quantity}     onChangeText={set('quantity')}     keyboardType="numeric" error={errors.quantity} />
      <AppInput  label="Descrição *"  value={form.description}  onChangeText={set('description')}  error={errors.description} />
      <AppPicker label="Funcionário"  value={form.employee}     options={employeeOpts} onValueChange={set('employee')} />
      <AppInput  label="Observações"  value={form.notes}        onChangeText={set('notes')}        multiline />

      <AppButton title="Registrar movimentação" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
