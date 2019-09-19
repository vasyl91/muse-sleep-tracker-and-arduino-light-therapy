import I18n from 'react-native-i18n';
import en from './locales/en';
import pl from './locales/pl';

I18n.fallbacks = true;

I18n.translations = {
  en,
  pl,
};


export default I18n;
