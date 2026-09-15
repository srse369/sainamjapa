import React from 'react';
import { AuthScreen } from './AuthScreen';
import { useTranslation } from '@/i18n';

export default function SignInScreen() {
  const { t } = useTranslation();
  return (
    <AuthScreen
      type="signin"
      title={t('auth.signin.contactTitle')}
      submitLabel={t('auth.signin.contactTitle')}
    />
  );
}