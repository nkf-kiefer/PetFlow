import React, { useState } from 'react';
import { ScrollView, Alert, StyleSheet } from 'react-native';
import { services } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';
import { normalizeCurrencyInput } from '../../utils/masks';

const CATEGORIES = [
  { label: 'Veterinária', value: 'veterinaria' },
  { label: 'Tosa',        value: 'tosa' },
  { label: 'Banho',       value: 'banho' },
  { label: 'Higiene',     value: 'higiene' },
  { label: 'Exame',       value: 'exame' },
  { label: 'Vacina',      value: 'vacina' },
  { label: 'Cirurgia',    value: 'cirurgia' },
  { label: 'Outro',       value: 'outro' },
];

const IS_ACTIVE = [
  { label: 'Ativo',   value: true },
  { label: 'Inativo', value: false },
];

export default function ServiceFormScreen({ route, navigation }) {
  const editing = !!route.params?.item;
  const item    = route.params?.item ?? {};

  const [form, setForm] = useState({
    name:             item.name ?? '',
    description:      item.description ?? '',
    price:            item.price ? String(item.price) : '',
    duration_minutes: item.duration_minutes ? String(item.duration_minutes) : '',
    category:         item.category ?? 'outro',
    is_active:        item.is_active ?? true,
  });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (!form.price)       errs.price = 'Preço é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:            Number(form.price),
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      };
      if (editing) {
        await services.update(item.id, payload);
      } else {
        await services.create(payload);
      }
      Alert.alert('Sucesso', editing ? 'Serviço atualizado com sucesso.' : 'Serviço criado com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar o serviço.'));
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
            await services.remove(item.id);
            navigation.goBack();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          } finally { setDeleting(false); }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppInput  label="Nome *"              value={form.name}             onChangeText={set('name')}             error={errors.name} />
      <AppInput  label="Descrição"           value={form.description}      onChangeText={set('description')}      multiline />
      <AppInput  label="Preço (R$) *"        value={form.price}            onChangeText={(value) => set('price')(normalizeCurrencyInput(value))}            keyboardType="decimal-pad" error={errors.price} />
      <AppInput  label="Duração (min)"       value={form.duration_minutes} onChangeText={set('duration_minutes')} keyboardType="numeric" />
      <AppPicker label="Categoria"           value={form.category}         options={CATEGORIES}                   onValueChange={set('category')} />
      <AppPicker label="Status"              value={form.is_active}        options={IS_ACTIVE}                    onValueChange={set('is_active')} />

      <AppButton title="Salvar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      {editing && (
        <AppButton title="Excluir serviço" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
});
