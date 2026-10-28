import { View } from 'react-native';
import { LANGUAGES, useI18n } from '../lib/i18n';
import { Chip } from './ui';

export default function LanguageSwitch() {
  const { lang, changeLanguage } = useI18n();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {LANGUAGES.map((l) => (
        <Chip key={l.code} label={l.label} active={lang === l.code} onPress={() => changeLanguage(l.code)} />
      ))}
    </View>
  );
}
