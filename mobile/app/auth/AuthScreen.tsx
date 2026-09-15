import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/context/AuthContext';

type AuthStep = 'contact' | 'otp';

interface AuthScreenProps {
  type: 'signup' | 'signin';
  title: string;
  submitLabel: string;
}

export function AuthScreen({ type, title, submitLabel }: AuthScreenProps) {
  const { t } = useTranslation();
  const { sendOTP, verifyOTP } = useAuth();
  const [step, setStep] = useState<AuthStep>('contact');
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmail = contact.includes('@');

  const handleSendOTP = async () => {
    if (!contact.trim()) {
      setError(isEmail ? 'Email is required' : 'Phone number is required');
      return;
    }
    if (type === 'signup' && !name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    setLoading(true);
    const res = await sendOTP(contact.trim(), type, type === 'signup' ? name.trim() : undefined);
    setLoading(false);
    if (res.success) {
      setStep('otp');
      setOtp('');
    } else {
      setError(res.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Enter 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    const res = await verifyOTP(contact.trim(), otp, type, type === 'signup' ? name.trim() : undefined);
    setLoading(false);
    if (res.success) {
      // Navigation handled by auth state change
    } else {
      setError(res.error || 'Invalid OTP');
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    const res = await sendOTP(contact.trim(), type, type === 'signup' ? name.trim() : undefined);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to resend OTP');
    }
  };

  const renderContactStep = () => (
    <>
      <Text style={styles.stepTitle}>{t(`auth.${type}.contactTitle`)}</Text>
      <Text style={styles.stepSubtitle}>{t(`auth.${type}.contactSubtitle`)}</Text>
      <FormInput
        label={t(`auth.${type}.contactLabel`)}
        value={contact}
        onChangeText={setContact}
        placeholder={isEmail ? 'you@example.com' : '+1 555 123 4567'}
        keyboardType={isEmail ? 'email-address' : 'phone-pad'}
        autoCapitalize="none"
        error={error}
      />
      {type === 'signup' && (
        <FormInput
          label={t('auth.signup.nameLabel')}
          value={name}
          onChangeText={setName}
          placeholder={t('auth.signup.namePlaceholder')}
          autoCapitalize="words"
          error={error}
        />
      )}
      <Button variant="primary" size="lg" loading={loading} onPress={handleSendOTP} style={styles.submitButton}>
        {submitLabel}
      </Button>
    </>
  );

  const renderOTPStep = () => (
    <>
      <Text style={styles.stepTitle}>{t('auth.otp.title')}</Text>
      <Text style={styles.stepSubtitle}>
        {t('auth.otp.subtitle')} {isEmail ? contact : contact}
      </Text>
      <View style={styles.otpContainer}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={styles.otpBox}>
            <TextInput
              style={styles.otpInput}
              maxLength={1}
              value={otp[i] || ''}
              onChangeText={(val) => {
                const newOtp = otp.substring(0, i) + val + otp.substring(i + 1);
                setOtp(newOtp);
                if (val && i < 5) {
                  // Auto-focus next input (would need refs for proper implementation)
                }
              }}
              keyboardType="numeric"
              textAlign="center"
              autoFocus={i === 0}
            />
          </View>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button variant="primary" size="lg" loading={loading} onPress={handleVerifyOTP} style={styles.submitButton}>
        {t('auth.otp.verifyButton')}
      </Button>
      <Button variant="outline" size="md" onPress={() => { setStep('contact'); setOtp(''); }} style={styles.backButton}>
        {t('auth.otp.backButton')}
      </Button>
      <Button variant="secondary" size="sm" onPress={handleResendOTP} style={styles.resendButton} disabled={loading}>
        {t('auth.otp.resendButton')}
      </Button>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient colors={['#F6F8FB', '#F0F6FF']} style={styles.gradientBg}>
            <View style={styles.header}>
              <Ionicons name="leaf" size={40} color="#FF6200" />
              <Text style={styles.appTitle}>{t('app.title')}</Text>
            </View>

            <Card variant="dashboard" style={styles.formCard}>
              {step === 'contact' ? renderContactStep() : renderOTPStep()}
            </Card>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  gradientBg: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#073763',
    marginTop: 8,
    fontFamily: 'Inter_700Bold',
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#073763',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  submitButton: {
    width: '100%',
    marginBottom: 16,
  },
  backButton: {
    width: '100%',
    marginBottom: 12,
  },
  resendButton: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 24,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E6EEF8',
    borderRadius: 10,
    backgroundColor: '#FBFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1220',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
});