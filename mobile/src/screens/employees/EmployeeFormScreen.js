import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, ActivityIndicator, View } from 'react-native';
import { employees, clinics } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppDateField from '../../components/AppDateField';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';
import { maskPhone } from '../../utils/masks';

const ROLES = [
  { label: 'Veterinário', value: 'veterinario' },
  { label: 'Atendente',   value: 'atendente' },
  { label: 'Tosador',     value: 'tosador' },
  { label: 'Auxiliar',    value: 'auxiliar' },
  { label: 'Gerente',     value: 'gerente' },
];

const IS_ACTIVE = [
  { label: 'Ativo',   value: true },
  { label: 'Inativo', value: false },
];

export default function EmployeeFormScreen({ route, navigation }) {
  const editing = !!route.params?.item;
  const item    = route.params?.item ?? {};

  const [clinicOptions, setClinicOptions] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  const [form, setForm] = useState({
    clinic:         item.clinic ?? '',
    name:           item.name ?? '',
    email:          item.email ?? '',
    password:       '',
    role:           item.role ?? 'atendente',
    phone:          item.phone ?? '',
    admission_date: item.admission_date ?? '',
    is_active:      item.is_active ?? true,
  });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    clinics.list().then(({ data }) => {
      setClinicOptions((data.results ?? data).map((c) => ({ label: c.name, value: c.id })));
    }).catch(() => {}).finally(() => setLoadingClinics(false));
  }, []);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  function validate() {
    const errs = {};
    if (!form.clinic)       errs.clinic = 'Clínica é obrigatória';
    if (!form.name.trim())  errs.name   = 'Nome é obrigatório';
    if (!form.email.trim()) errs.email  = 'E-mail é obrigatório';
    if (!editing && !form.password.trim()) errs.password = 'Senha é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      // Don't send empty password on edit
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        await employees.update(item.id, payload);
      } else {
        await employees.create(payload);
      }
      Alert.alert('Sucesso', editing ? 'Funcionário atualizado com sucesso.' : 'Funcionário criado com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar o funcionário.'));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Confirmar exclusão', `Deseja excluir "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await employees.remove(item.id);
            navigation.goBack();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          } finally { setDeleting(false); }
        },
      },
    ]);
  }

  if (loadingClinics) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppPicker label="Clínica *"            value={form.clinic}         options={clinicOptions} onValueChange={set('clinic')}    error={errors.clinic} />
      <AppInput  label="Nome *"               value={form.name}           onChangeText={set('name')}           error={errors.name} />
      <AppInput  label="E-mail *"             value={form.email}          onChangeText={set('email')}          keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <AppInput  label={editing ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
                                              value={form.password}       onChangeText={set('password')}       secureTextEntry error={errors.password} />
      <AppPicker label="Cargo"                value={form.role}           options={ROLES}         onValueChange={set('role')} />
      <AppInput  label="Telefone"             value={form.phone}          onChangeText={(value) => set('phone')(maskPhone(value))}          keyboardType="phone-pad" />
      <AppDateField label="Data de admissão" value={form.admission_date} onChange={set('admission_date')} placeholder="Selecionar data" />
      <AppPicker label="Status"               value={form.is_active}      options={IS_ACTIVE}     onValueChange={set('is_active')} />

      <AppButton title="Salvar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      {editing && (
        <AppButton title="Excluir funcionário" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
