import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StyleSheet, ActivityIndicator, View } from 'react-native';
import { schedulings, clinics, tutors, pets, employees } from '../../api/resources';
import AppInput from '../../components/AppInput';
import AppDateField from '../../components/AppDateField';
import AppPicker from '../../components/AppPicker';
import AppButton from '../../components/AppButton';
import { colors, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/errors';
import { normalizeCurrencyInput } from '../../utils/masks';

const STATUSES = [
  { label: 'Agendado',     value: 'agendado' },
  { label: 'Confirmado',   value: 'confirmado' },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Concluído',    value: 'concluido' },
  { label: 'Cancelado',    value: 'cancelado' },
];

export default function SchedulingFormScreen({ route, navigation }) {
  const editing = !!route.params?.item;
  const item    = route.params?.item ?? {};

  const [clinicOpts,   setClinicOpts]   = useState([]);
  const [tutorOpts,    setTutorOpts]    = useState([]);
  const [petOpts,      setPetOpts]      = useState([]);
  const [employeeOpts, setEmployeeOpts] = useState([]);
  const [loadingData,  setLoadingData]  = useState(true);
  const [allTutors,    setAllTutors]    = useState([]);
  const [allPets,      setAllPets]      = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allClinics,   setAllClinics]   = useState([]);

  const [form, setForm] = useState({
    clinic:      item.clinic ?? '',
    tutor:       item.tutor ?? '',
    pet:         item.pet ?? '',
    employee:    item.employee ?? '',
    date_time:   item.date_time ? item.date_time.slice(0, 16) : '',
    status:      item.status ?? 'agendado',
    total_value: item.total_value ? String(item.total_value) : '',
    notes:       item.notes ?? '',
  });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      clinics.list(),
      tutors.list(),
      pets.list(),
      employees.list(),
    ]).then(([c, t, p, e]) => {
      const clinicsData = c.data.results ?? c.data;
      const tutorsData = t.data.results ?? t.data;
      const petsData = p.data.results ?? p.data;
      const employeesData = e.data.results ?? e.data;

      setClinicOpts(clinicsData.map((x) => ({ label: x.name, value: x.id })));
      setTutorOpts(tutorsData.map((x) => ({ label: x.name, value: x.id })));
      setPetOpts(petsData.map((x) => ({ label: x.name, value: x.id })));
      setEmployeeOpts(employeesData.map((x) => ({ label: x.name, value: x.id })));
      setAllClinics(clinicsData);
      setAllTutors(tutorsData);
      setAllPets(petsData);
      setAllEmployees(employeesData);
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    if (!form.clinic) {
      setTutorOpts(allTutors.map((tutor) => ({ label: tutor.name, value: tutor.id })));
      setEmployeeOpts(allEmployees.map((employee) => ({ label: employee.name, value: employee.id })));
      return;
    }

    const filteredTutors = allTutors
      .filter((tutor) => tutor.clinic === form.clinic)
      .map((tutor) => ({ label: tutor.name, value: tutor.id }));
    const filteredEmployees = allEmployees
      .filter((employee) => employee.clinic === form.clinic)
      .map((employee) => ({ label: employee.name, value: employee.id }));

    setTutorOpts(filteredTutors);
    setEmployeeOpts(filteredEmployees);
  }, [form.clinic, allTutors, allEmployees]);

  useEffect(() => {
    if (form.tutor) {
      const filtered = allPets
        .filter((p) => p.tutor === form.tutor)
        .map((p) => ({ label: p.name, value: p.id }));
      setPetOpts(filtered.length ? filtered : allPets.map((p) => ({ label: p.name, value: p.id })));
      if (!filtered.some((pet) => pet.value === form.pet)) {
        setForm((current) => ({ ...current, pet: '' }));
      }
    } else {
      setPetOpts(allPets.map((pet) => ({ label: pet.name, value: pet.id })));
    }
  }, [form.tutor, form.pet, allPets]);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  const selectedClinic = allClinics.find((clinic) => clinic.id === form.clinic);
  const appointmentInterval = selectedClinic?.appointment_interval ?? 30;
  const openingTime = selectedClinic?.opening_time ?? '08:00';
  const closingTime = selectedClinic?.closing_time ?? '20:00';

  function validate() {
    const errs = {};
    if (!form.clinic)            errs.clinic      = 'Clínica é obrigatória';
    if (!form.tutor)             errs.tutor       = 'Tutor é obrigatório';
    if (!form.pet)               errs.pet         = 'Pet é obrigatório';
    if (!form.employee)          errs.employee    = 'Funcionário é obrigatório';
    if (!form.date_time)         errs.date_time   = 'Data/hora é obrigatória';
    if (!form.total_value)       errs.total_value = 'Valor é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_value: Number(form.total_value),
        // Ensure ISO format with timezone Z
        date_time: form.date_time.length === 16 ? `${form.date_time}:00Z` : form.date_time,
      };
      if (editing) {
        await schedulings.update(item.id, payload);
      } else {
        await schedulings.create(payload);
      }
      Alert.alert('Sucesso', editing ? 'Agendamento atualizado com sucesso.' : 'Agendamento criado com sucesso.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e, 'Não foi possível salvar o agendamento.'));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Confirmar exclusão', 'Deseja excluir este agendamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await schedulings.remove(item.id);
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
      <AppPicker label="Clínica *"         value={form.clinic}      options={clinicOpts}   onValueChange={set('clinic')}      error={errors.clinic} />
      <AppPicker label="Tutor *"           value={form.tutor}       options={tutorOpts}    onValueChange={set('tutor')}       error={errors.tutor} />
      <AppPicker label="Pet *"             value={form.pet}         options={petOpts}      onValueChange={set('pet')}         error={errors.pet} />
      <AppPicker label="Funcionário *"     value={form.employee}    options={employeeOpts} onValueChange={set('employee')}   error={errors.employee} />
      <AppDateField
        label="Data e hora *"
        value={form.date_time}
        onChange={set('date_time')}
        mode="datetime"
        placeholder="Selecionar data e hora"
        error={errors.date_time}
        minTime={openingTime}
        maxTime={closingTime}
        intervalMinutes={appointmentInterval}
      />
      <AppPicker label="Status"            value={form.status}      options={STATUSES}     onValueChange={set('status')} />
      <AppInput  label="Valor total (R$) *" value={form.total_value} onChangeText={(value) => set('total_value')(normalizeCurrencyInput(value))} keyboardType="decimal-pad" error={errors.total_value} />
      <AppInput  label="Observações"       value={form.notes}       onChangeText={set('notes')}       multiline />

      <AppButton title="Salvar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
      {editing && (
        <AppButton title="Excluir agendamento" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
