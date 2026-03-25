import React, { useState } from 'react';
import { ScrollView, Alert, StyleSheet } from 'react-native';
import { clinics } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';
import { maskCnpj, maskPhone, maskZipCode } from '../../utils/masks';

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
].map((s) => ({ label: s, value: s }));

const WORK_DAYS = [
  { label: 'Segunda a Sexta', value: 'seg-sex' },
  { label: 'Segunda a Sábado', value: 'seg-sab' },
  { label: 'Todos os dias', value: 'seg-dom' },
];

const IS_ACTIVE = [
  { label: 'Ativa', value: true },
  { label: 'Inativa', value: false },
];

export default function ClinicFormScreen({ route, navigation }) {
  const editing = !!route.params?.item;
  const item    = route.params?.item ?? {};

  const [form, setForm] = useState({
    name:                 item.name ?? '',
    cnpj:                 item.cnpj ?? '',
    email:                item.email ?? '',
    phone:                item.phone ?? '',
    address:              item.address ?? '',
    city:                 item.city ?? '',
    state:                item.state ?? '',
    zip_code:             item.zip_code ?? '',
    opening_time:         item.opening_time ?? '08:00',
    closing_time:         item.closing_time ?? '20:00',
    appointment_interval: String(item.appointment_interval ?? '30'),
    work_days:            item.work_days ?? 'seg-sex',
    is_active:            item.is_active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        appointment_interval: Number(form.appointment_interval) || 30,
      };
      if (editing) {
        await clinics.update(item.id, payload);
      } else {
        await clinics.create(payload);
      }
      Alert.alert('Sucesso', editing ? 'Clínica atualizada com sucesso.' : 'Clínica criada com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar a clínica.'));
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
            await clinics.remove(item.id);
            navigation.goBack();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AppInput label="Nome *"    value={form.name}    onChangeText={set('name')}    error={errors.name} />
      <AppInput label="CNPJ"      value={form.cnpj}    onChangeText={(value) => set('cnpj')(maskCnpj(value))}    keyboardType="numeric" />
      <AppInput label="E-mail"    value={form.email}   onChangeText={set('email')}   keyboardType="email-address" autoCapitalize="none" />
      <AppInput label="Telefone"  value={form.phone}   onChangeText={(value) => set('phone')(maskPhone(value))}   keyboardType="phone-pad" />
      <AppInput label="Endereço"  value={form.address} onChangeText={set('address')} />
      <AppInput label="Cidade"    value={form.city}    onChangeText={set('city')} />
      <AppPicker label="Estado"   value={form.state}   options={STATES}       onValueChange={set('state')} />
      <AppInput label="CEP"       value={form.zip_code} onChangeText={(value) => set('zip_code')(maskZipCode(value))} keyboardType="numeric" />
      <AppInput label="Abertura (HH:MM)"   value={form.opening_time}  onChangeText={set('opening_time')}  placeholder="08:00" />
      <AppInput label="Fechamento (HH:MM)" value={form.closing_time}  onChangeText={set('closing_time')}  placeholder="20:00" />
      <AppInput label="Intervalo entre atendimentos (min)" value={form.appointment_interval} onChangeText={set('appointment_interval')} keyboardType="numeric" />
      <AppPicker label="Dias de funcionamento" value={form.work_days} options={WORK_DAYS} onValueChange={set('work_days')} />
      <AppPicker label="Status"   value={form.is_active} options={IS_ACTIVE} onValueChange={set('is_active')} />

      <AppButton title="Salvar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      {editing && (
        <AppButton
          title="Excluir clínica"
          variant="danger"
          onPress={handleDelete}
          loading={deleting}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
});
