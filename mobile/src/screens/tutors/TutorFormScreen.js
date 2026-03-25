import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Alert, StyleSheet, ActivityIndicator, View } from 'react-native';
import { tutors, clinics } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';

export default function TutorFormScreen({ route, navigation }) {
  const editing = !!route.params?.item;
  const item    = route.params?.item ?? {};

  const [clinicOptions, setClinicOptions] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  const [form, setForm] = useState({
    clinic:          item.clinic ?? '',
    name:            item.name ?? '',
    cpf:             item.cpf ?? '',
    email:           item.email ?? '',
    phone:           item.phone ?? '',
    secondary_phone: item.secondary_phone ?? '',
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
    if (!form.phone.trim()) errs.phone  = 'Telefone é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await tutors.update(item.id, form);
      } else {
        await tutors.create(form);
      }
      Alert.alert('Sucesso', editing ? 'Tutor atualizado com sucesso.' : 'Tutor criado com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar o tutor.'));
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
            await tutors.remove(item.id);
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
      <AppPicker label="Clínica *"        value={form.clinic}          options={clinicOptions} onValueChange={set('clinic')} error={errors.clinic} />
      <AppInput  label="Nome *"           value={form.name}            onChangeText={set('name')}            error={errors.name} />
      <AppInput  label="CPF"              value={form.cpf}             onChangeText={set('cpf')}             keyboardType="numeric" />
      <AppInput  label="E-mail"           value={form.email}           onChangeText={set('email')}           keyboardType="email-address" autoCapitalize="none" />
      <AppInput  label="Telefone *"       value={form.phone}           onChangeText={set('phone')}           keyboardType="phone-pad" error={errors.phone} />
      <AppInput  label="Telefone secundário" value={form.secondary_phone} onChangeText={set('secondary_phone')} keyboardType="phone-pad" />

      {!editing && (
        <AppButton
          title="Salvar e cadastrar pet"
          variant="ghost"
          onPress={async () => {
            if (!validate()) return;
            setSaving(true);
            try {
              const { data } = await tutors.create(form);
              Alert.alert('Sucesso', 'Tutor criado. Agora cadastre o pet.');
              navigation.replace('PetForm', { presetTutor: data.id });
            } catch (e) {
              Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar o tutor.'));
            } finally {
              setSaving(false);
            }
          }}
          style={{ marginBottom: spacing.sm }}
        />
      )}

      <AppButton title="Salvar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      {editing && (
        <AppButton title="Excluir tutor" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
