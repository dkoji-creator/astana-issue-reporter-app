// New report: photo (R2), place on the map (R1), category (R4), description (R5).
// R9 click count from the map: "+" (1) → shutter (2) → confirm photo (3) → category (4) → Submit (5).
// The location is filled in from GPS automatically; typing the description is not a click.
import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import LeafletMap from '../../components/LeafletMap';
import { Button, Chip, ErrorBox, Field } from '../../components/ui';
import { api } from '../../lib/api';
import { pickPhoto } from '../../lib/photo';
import { useCategories } from '../../lib/useCategories';
import { useI18n } from '../../lib/i18n';
import { showAlert } from '../../lib/alert';
import { insideAstana } from '../../lib/config';
import { colors } from '../../lib/theme';

export default function NewReportScreen() {
  const { camera } = useLocalSearchParams();
  const { t, category, errorText } = useI18n();
  const categories = useCategories();
  const [photo, setPhoto] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [description, setDescription] = useState('');
  const [point, setPoint] = useState(null);
  const [locationNote, setLocationNote] = useState(t('locating'));
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const getPhoto = async (source) => {
    setError('');
    setPhotoBusy(true);
    try {
      const p = await pickPhoto(source);
      if (p && mounted.current) setPhoto(p);
    } catch (err) {
      if (err.message === 'cameraDenied') setError(t('cameraDenied'));
      else if (err.message === 'tooBig') setError(t('photoTooBig'));
      else setError(String(err.message || err));
    } finally {
      if (mounted.current) setPhotoBusy(false);
    }
  };

  // Opened from the "+" button: go straight to the camera, once the screen has finished opening
  useEffect(() => {
    if (camera !== '1' || Platform.OS === 'web') return undefined;
    const timer = setTimeout(() => getPhoto('camera'), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GPS position; if it is outside Astana or not allowed, the user taps the map
  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) { if (mounted.current) setLocationNote(t('locationDenied')); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted.current) return;
        const { latitude: lat, longitude: lng } = pos.coords;
        if (insideAstana(lat, lng)) {
          setPoint((p) => p || { lat, lng, pan: true }); // do not overwrite a point the user already tapped
          setLocationNote(t('locationHint'));
        } else {
          setLocationNote(t('locationOutside'));
        }
      } catch {
        if (mounted.current) setLocationNote(t('locationDenied'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = ({ lat, lng }) => {
    if (!insideAstana(lat, lng)) { setLocationNote(t('locationOutside')); return; }
    setPoint({ lat, lng, pan: false });
    setLocationNote(t('locationHint'));
  };

  // Error prevention (Nielsen): show what is missing, Submit stays disabled until everything is filled
  const missing = [
    !photo && t('needPhoto'),
    !point && t('needLocation'),
    !categoryId && t('needCategory'),
    description.trim().length < 5 && t('needDescription'),
  ].filter(Boolean);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const created = await api.createReport({ photo, description: description.trim(), categoryId, lat: point.lat, lng: point.lng });
      showAlert(t('submitted'));
      router.replace(`/report/${created.id}`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>{t('photo')}</Text>
        {photo ? <Image source={{ uri: photo.uri }} style={s.photo} resizeMode="cover" accessibilityLabel={t('photo')} /> : null}
        <View style={s.row}>
          <Button title={photo ? t('retakePhoto') : t('takePhoto')} onPress={() => getPhoto('camera')} loading={photoBusy} style={{ flex: 1, marginRight: 8 }} />
          <Button title={t('chooseFromGallery')} variant="secondary" onPress={() => getPhoto('gallery')} disabled={photoBusy} style={{ flex: 1 }} />
        </View>

        <Text style={[s.label, { marginTop: 18 }]}>{t('category')}</Text>
        <View style={s.wrap}>
          {categories.map((c) => (
            <Chip key={c.id} label={category(c.name)} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </View>

        <Field
          label={`${t('description')} (${description.length}/500)`}
          placeholder={t('descriptionHint')}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
          style={{ marginTop: 10 }}
        />

        <Text style={s.label}>{t('location')}</Text>
        <Text style={s.note}>{locationNote}</Text>
        <View style={s.map}>
          <LeafletMap pickMode pin={point} onPick={onPick} />
        </View>

        <ErrorBox message={error} />
        {missing.length && !busy ? <Text style={s.missing}>• {missing.join('\n• ')}</Text> : null}
        <Button title={busy ? t('sending') : t('submit')} onPress={submit} loading={busy} disabled={missing.length > 0} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, marginBottom: 10, backgroundColor: colors.border },
  row: { flexDirection: 'row' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  map: { height: 240, borderRadius: 12, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  missing: { color: colors.muted, fontSize: 14, marginBottom: 10 },
});
