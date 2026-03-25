import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, ActivityIndicator, View } from 'react-native';
import { pets, tutors } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppDateField from '../../components/AppDateField';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';

const SPECIES = [
  { label: 'Cachorro', value: 'cachorro' },
  { label: 'Gato',     value: 'gato' },
  { label: 'Pássaro',  value: 'passaro' },
  { label: 'Roedor',   value: 'roedor' },
  { label: 'Outro',    value: 'outro' },
];
const GENDERS = [
  { label: 'Macho', value: 'M' },
  { label: 'Fêmea', value: 'F' },
];
const COLORS = [
  { label: 'Preto',   value: 'preto' },
  { label: 'Branco',  value: 'branco' },
  { label: 'Cinza',   value: 'cinza' },
  { label: 'Marrom',  value: 'marrom' },
  { label: 'Bege',    value: 'bege' },
  { label: 'Dourado', value: 'dourado' },
  { label: 'Rajado',  value: 'rajado' },
  { label: 'Malhado', value: 'malhado' },
  { label: 'Outro',   value: 'outro' },
];

export default function PetFormScreen({ route, navigation }) {
  const editing = !!route.params?.item;
  const item    = route.params?.item ?? {};
  const presetTutor = route.params?.presetTutor ?? '';

  const [tutorOptions, setTutorOptions] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  const [form, setForm] = useState({
    tutor:      item.tutor ?? presetTutor,
    name:       item.name ?? '',
    species:    item.species ?? 'cachorro',
    breed:      item.breed ?? '',
    birth_date: item.birth_date ?? '',
    size:       item.size ?? '',
    weight:     item.weight ? String(item.weight) : '',
    color:      item.color ?? '',
    gender:     item.gender ?? '',
    notes:      item.notes ?? '',
  });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    tutors.list().then(({ data }) => {
      setTutorOptions((data.results ?? data).map((t) => ({ label: t.name, value: t.id })));
    }).catch(() => {}).finally(() => setLoadingTutors(false));
  }, []);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  function validate() {
    const errs = {};
    if (!form.tutor)       errs.tutor = 'Tutor é obrigatório';
    if (!form.name.trim()) errs.name  = 'Nome é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        weight: form.weight ? Number(form.weight) : null,
      };
      if (editing) {
        await pets.update(item.id, payload);
      } else {
        await pets.create(payload);
      }
      Alert.alert('Sucesso', editing ? 'Pet atualizado com sucesso.' : 'Pet criado com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar o pet.'));
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
            await pets.remove(item.id);
            navigation.goBack();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          } finally { setDeleting(false); }
        },
      },
    ]);
  }

  if (loadingTutors) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppPicker label="Tutor *"             value={form.tutor}      options={tutorOptions} onValueChange={set('tutor')}   error={errors.tutor} />
      <AppInput  label="Nome *"              value={form.name}       onChangeText={set('name')}       error={errors.name} />
      <AppPicker label="Espécie"             value={form.species}    options={SPECIES}      onValueChange={set('species')} />
      <AppInput  label="Raça"                value={form.breed}      onChangeText={set('breed')} />
      <AppDateField label="Data de nascimento" value={form.birth_date} onChange={set('birth_date')} placeholder="Selecionar data" />
      <AppInput  label="Porte"               value={form.size}       onChangeText={set('size')} placeholder="Pequeno / Médio / Grande" />
      <AppInput  label="Peso (kg)"           value={form.weight}     onChangeText={set('weight')}     keyboardType="decimal-pad" />
      <AppPicker label="Cor"                 value={form.color}      options={COLORS}       onValueChange={set('color')} />
      <AppPicker label="Sexo"                value={form.gender}     options={GENDERS}      onValueChange={set('gender')} />
      <AppInput  label="Observações"         value={form.notes}      onChangeText={set('notes')}      multiline />

      <AppButton title="Salvar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      {editing && (
        <AppButton title="Excluir pet" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
