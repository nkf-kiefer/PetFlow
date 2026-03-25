import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, ActivityIndicator, View } from 'react-native';
import { products, clinics } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';
import { normalizeCurrencyInput } from '../../utils/masks';

const CATEGORIES = [
  { label: 'Medicamento', value: 'medicamento' },
  { label: 'Higiene',     value: 'higiene' },
  { label: 'Acessório',   value: 'acessorio' },
  { label: 'Ração',       value: 'racao' },
  { label: 'Brinquedo',   value: 'brinquedo' },
  { label: 'Outro',       value: 'outro' },
];

const IS_ACTIVE = [
  { label: 'Ativo',   value: true },
  { label: 'Inativo', value: false },
];

export default function ProductFormScreen({ route, navigation }) {
  const editing = !!route.params?.item;
  const item    = route.params?.item ?? {};

  const [clinicOptions, setClinicOptions] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  const [form, setForm] = useState({
    clinic:          item.clinic ?? '',
    name:            item.name ?? '',
    description:     item.description ?? '',
    category:        item.category ?? 'outro',
    brand:           item.brand ?? '',
    quantity:        item.quantity !== undefined ? String(item.quantity) : '0',
    min_stock:       item.min_stock !== undefined ? String(item.min_stock) : '0',
    alert_threshold: item.alert_threshold !== undefined ? String(item.alert_threshold) : '10',
    price:           item.price ? String(item.price) : '',
    is_active:       item.is_active ?? true,
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
    if (!form.price)        errs.price  = 'Preço é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity:        Number(form.quantity) || 0,
        min_stock:       Number(form.min_stock) || 0,
        alert_threshold: Number(form.alert_threshold) || 10,
        price:           Number(form.price) || 0,
      };
      if (editing) {
        await products.update(item.id, payload);
      } else {
        await products.create(payload);
      }
      Alert.alert('Sucesso', editing ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar o produto.'));
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
            await products.remove(item.id);
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
      <AppPicker label="Clínica *"       value={form.clinic}           options={clinicOptions} onValueChange={set('clinic')}          error={errors.clinic} />
      <AppInput  label="Nome *"          value={form.name}             onChangeText={set('name')}            error={errors.name} />
      <AppInput  label="Descrição"       value={form.description}      onChangeText={set('description')}     multiline />
      <AppPicker label="Categoria"       value={form.category}         options={CATEGORIES}    onValueChange={set('category')} />
      <AppInput  label="Marca"           value={form.brand}            onChangeText={set('brand')} />
      <AppInput  label="Quantidade"      value={form.quantity}         onChangeText={set('quantity')}        keyboardType="numeric" />
      <AppInput  label="Estoque mínimo"  value={form.min_stock}        onChangeText={set('min_stock')}       keyboardType="numeric" />
      <AppInput  label="Alerta de estoque" value={form.alert_threshold} onChangeText={set('alert_threshold')} keyboardType="numeric" />
      <AppInput  label="Preço (R$) *"      value={form.price}            onChangeText={(value) => set('price')(normalizeCurrencyInput(value))}            keyboardType="decimal-pad" error={errors.price} />
      <AppPicker label="Status"          value={form.is_active}        options={IS_ACTIVE}     onValueChange={set('is_active')} />

      <AppButton title="Salvar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      {editing && (
        <AppButton title="Excluir produto" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
