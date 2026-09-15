import React from 'react';
import { AuthScreen } from './AuthScreen';
import { useTranslation } from '@/i18n';

export default function SignUpScreen() {
  const { t } = useTranslation();
  return (
    <AuthScreen
      type="signup"
      title={t('auth.signup.contactTitle')}
      submitLabel={t('auth.signup.contactTitle')}
    />
  );
}