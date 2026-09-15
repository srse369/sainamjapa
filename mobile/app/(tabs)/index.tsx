import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, RefreshControl, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { FormInput } from '@/components/FormInput';
import { DateInput } from '@/components/DateInput';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/context/AuthContext';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { aggregateData, loading, error, refreshData, submitJapam } = useApp();
  const { user, loading: authLoading, logout, sendOTP, verifyOTP } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSigninModal, setShowSigninModal] = useState(false);
  const [submitDate, setSubmitDate] = useState('');
  const [submitCount, setSubmitCount] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Signup modal state
  const [signupStep, setSignupStep] = useState<'contact' | 'otp'>('contact');
  const [signupContact, setSignupContact] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Signin modal state
  const [signinStep, setSigninStep] = useState<'contact' | 'otp'>('contact');
  const [signinContact, setSigninContact] = useState('');
  const [signinOtp, setSigninOtp] = useState('');
  const [signinError, setSigninError] = useState('');
  const [signinLoading, setSigninLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const isEmail = (contact: string) => contact.includes('@');

  const handleSignupContact = async () => {
    if (!signupContact.trim()) {
      setSignupError(isEmail(signupContact) ? 'Email is required' : 'Phone number is required');
      return;
    }
    if (!signupName.trim()) {
      setSignupError('Name is required');
      return;
    }
    setSignupError('');
    setSignupLoading(true);
    const res = await sendOTP(signupContact.trim(), 'signup', signupName.trim());
    setSignupLoading(false);
    if (res.success) {
      setSignupStep('otp');
      setSignupOtp('');
    } else {
      setSignupError(res.error || 'Failed to send OTP');
    }
  };

  const handleSignupOtp = async () => {
    if (signupOtp.length !== 6) {
      setSignupError('Enter 6-digit code');
      return;
    }
    setSignupError('');
    setSignupLoading(true);
    const res = await verifyOTP(signupContact.trim(), signupOtp, 'signup', signupName.trim());
    setSignupLoading(false);
    if (res.success) {
      setShowSignupModal(false);
      setSignupContact('');
      setSignupName('');
      setSignupOtp('');
      setSignupStep('contact');
    } else {
      setSignupError(res.error || 'Invalid OTP');
    }
  };

  const handleResendSignupOtp = async () => {
    setSignupError('');
    setSignupLoading(true);
    const res = await sendOTP(signupContact.trim(), 'signup', signupName.trim());
    setSignupLoading(false);
    if (!res.success) {
      setSignupError(res.error || 'Failed to resend OTP');
    }
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
    setSignupContact('');
    setSignupName('');
    setSignupOtp('');
    setSignupStep('contact');
    setSignupError('');
  };

  const handleSigninContact = async () => {
    if (!signinContact.trim()) {
      setSigninError(isEmail(signinContact) ? 'Email is required' : 'Phone number is required');
      return;
    }
    setSigninError('');
    setSigninLoading(true);
    const res = await sendOTP(signinContact.trim(), 'signin');
    setSigninLoading(false);
    if (res.success) {
      setSigninStep('otp');
      setSigninOtp('');
    } else {
      setSigninError(res.error || 'Failed to send OTP');
    }
  };

  const handleSigninOtp = async () => {
    if (signinOtp.length !== 6) {
      setSigninError('Enter 6-digit code');
      return;
    }
    setSigninError('');
    setSigninLoading(true);
    const res = await verifyOTP(signinContact.trim(), signinOtp, 'signin');
    setSigninLoading(false);
    if (res.success) {
      setShowSigninModal(false);
      setSigninContact('');
      setSigninOtp('');
      setSigninStep('contact');
    } else {
      setSigninError(res.error || 'Invalid OTP');
    }
  };

  const handleResendSigninOtp = async () => {
    setSigninError('');
    setSigninLoading(true);
    const res = await sendOTP(signinContact.trim(), 'signin');
    setSigninLoading(false);
    if (!res.success) {
      setSigninError(res.error || 'Failed to resend OTP');
    }
  };

  const closeSigninModal = () => {
    setShowSigninModal(false);
    setSigninContact('');
    setSigninOtp('');
    setSigninStep('contact');
    setSigninError('');
  };

  const handleSubmit = async () => {
    if (!submitDate || !submitCount) {
      setSubmitError(t('submit.required'));
      return;
    }
    if (submitDate > today) {
      setSubmitError(t('submit.dateFuture'));
      return;
    }
    setSubmitError('');
    setSubmitLoading(true);
    // Use user name if authenticated, otherwise anonymous (null)
    const nameToSubmit = user?.name || null;
    const result = await submitJapam(nameToSubmit, submitDate, Number(submitCount), user?.id);
    setSubmitLoading(false);
    if (result.success) {
      setSubmitCount('');
      setSubmitDate(today);
      setShowSubmitModal(false);
    } else {
      setSubmitError(result.error || t('submit.required'));
    }
  };

  const total = aggregateData?.total ?? 0;
  const isAuthenticated = !!user;

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} colors={['#FF6200']} />
        }
        contentContainerStyle={styles.content}
      >
        <LinearGradient colors={['#F6F8FB', '#F0F6FF']} style={styles.gradientBg}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('app.title')}</Text>
          </View>

          <Card style={styles.photoCard} padding={0}>
            <Image
              source={require('@/assets/bg.jpg')}
              style={styles.photoImage}
              resizeMode="cover"
            />
          </Card>

          <Card variant="dashboard" style={styles.dashboardCard}>
            <Text style={styles.dashboardLabel}>{t('dashboard.totalCount')}</Text>
            <Text style={styles.totalCount}>{total.toLocaleString()}</Text>
          </Card>

          {isAuthenticated ? (
            // Authenticated user view
            <>
              <View style={styles.userInfoContainer}>
                <Ionicons name="person-circle-outline" size={28} color="#FF6200" />
                <View style={styles.userInfoText}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userContact}>
                    {user.email || user.phone || ''}
                  </Text>
                </View>
              </View>
              <View style={styles.buttonRow}>
                <Button variant="secondary" size="lg" onPress={logout} style={styles.fabButton}>
                  <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  {t('dashboard.logout')}
                </Button>
                <Button variant="primary" size="lg" onPress={() => { setSubmitDate(today); setShowSubmitModal(true); }} style={styles.fabButton}>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  {t('dashboard.submitJapam')}
                </Button>
              </View>
            </>
          ) : (
            // Not authenticated view
            <>
              <View style={styles.buttonRow}>
                <Button variant="secondary" size="lg" onPress={() => setShowSignupModal(true)} style={styles.fabButton}>
                  <Ionicons name="person-add-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  {t('auth.signup.contactTitle')}
                </Button>
                <Button variant="secondary" size="lg" onPress={() => setShowSigninModal(true)} style={styles.fabButton}>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  {t('auth.signin.contactTitle')}
                </Button>
                <Button variant="primary" size="lg" onPress={() => { setSubmitDate(today); setShowSubmitModal(true); }} style={styles.fabButton}>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  {t('dashboard.submitJapam')}
                </Button>
              </View>
              <Text style={styles.anonymousHint}>{t('submit.hintAnonymous')}</Text>
            </>
          )}
        </LinearGradient>
      </ScrollView>

      <Modal
        visible={showSubmitModal}
        onClose={() => { setShowSubmitModal(false); setSubmitError(''); }}
        title={t('submit.title')}
        actionButton={{ title: t('submit.button'), onPress: handleSubmit, loading: submitLoading }}
        message={submitError}
        messageType="error"
      >
        {isAuthenticated ? (
          <View style={styles.submitRegisteredName}>
            <Ionicons name="person-circle-outline" size={20} color="#FF6200" />
            <Text style={styles.submitRegisteredNameText}>
              {t('submit.submittingAs')} {user?.name}
            </Text>
          </View>
        ) : (
          <Text style={styles.modalHint}>{t('submit.hintAnonymous')}</Text>
        )}
        <DateInput
          label={t('submit.dateLabel')}
          value={submitDate}
          onChange={setSubmitDate}
          required
          maxDate={today}
        />
        <FormInput
          label={t('submit.countLabel')}
          value={submitCount}
          onChangeText={setSubmitCount}
          placeholder={t('submit.countPlaceholder')}
          keyboardType="numeric"
          required
          error={submitError}
        />
      </Modal>

      <Modal
        visible={showSignupModal}
        onClose={closeSignupModal}
        title={signupStep === 'contact' ? t('auth.signup.contactTitle') : t('auth.otp.title')}
        actionButton={signupStep === 'contact' 
          ? { title: t('auth.signup.contactTitle'), onPress: handleSignupContact, loading: signupLoading }
          : { title: t('auth.otp.verifyButton'), onPress: handleSignupOtp, loading: signupLoading }}
        message={signupError}
        messageType="error"
      >
        {signupStep === 'contact' ? (
          <>
            <Text style={styles.modalHint}>{t('auth.signup.contactSubtitle')}</Text>
            <FormInput
              label={t('auth.signup.contactLabel')}
              value={signupContact}
              onChangeText={setSignupContact}
              placeholder={isEmail(signupContact) ? 'you@example.com' : '+1 555 123 4567'}
              keyboardType={isEmail(signupContact) ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              error={signupError}
            />
            <FormInput
              label={t('auth.signup.nameLabel')}
              value={signupName}
              onChangeText={setSignupName}
              placeholder={t('auth.signup.namePlaceholder')}
              autoCapitalize="words"
              error={signupError}
            />
          </>
        ) : (
          <>
            <Text style={styles.modalHint}>
              {t('auth.otp.subtitle')} {isEmail(signupContact) ? signupContact : signupContact}
            </Text>
            <View style={styles.otpContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.otpBox}>
                  <TextInput
                    style={styles.otpInput}
                    maxLength={1}
                    value={signupOtp[i] || ''}
                    onChangeText={(val) => {
                      const newOtp = signupOtp.substring(0, i) + val + signupOtp.substring(i + 1);
                      setSignupOtp(newOtp);
                    }}
                    keyboardType="numeric"
                    textAlign="center"
                    autoFocus={i === 0}
                  />
                </View>
              ))}
            </View>
            {signupError && <Text style={styles.errorText}>{signupError}</Text>}
            <Button variant="outline" size="md" onPress={() => { setSignupStep('contact'); setSignupOtp(''); setSignupError(''); }} style={styles.backButton}>
              {t('auth.otp.backButton')}
            </Button>
            <Button variant="secondary" size="sm" onPress={handleResendSignupOtp} style={styles.resendButton} disabled={signupLoading}>
              {t('auth.otp.resendButton')}
            </Button>
          </>
        )}
      </Modal>

      <Modal
        visible={showSigninModal}
        onClose={closeSigninModal}
        title={signinStep === 'contact' ? t('auth.signin.contactTitle') : t('auth.otp.title')}
        actionButton={signinStep === 'contact'
          ? { title: t('auth.signin.contactTitle'), onPress: handleSigninContact, loading: signinLoading }
          : { title: t('auth.otp.verifyButton'), onPress: handleSigninOtp, loading: signinLoading }}
        message={signinError}
        messageType="error"
      >
        {signinStep === 'contact' ? (
          <>
            <Text style={styles.modalHint}>{t('auth.signin.contactSubtitle')}</Text>
            <FormInput
              label={t('auth.signin.contactLabel')}
              value={signinContact}
              onChangeText={setSigninContact}
              placeholder={isEmail(signinContact) ? 'you@example.com' : '+1 555 123 4567'}
              keyboardType={isEmail(signinContact) ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              error={signinError}
            />
          </>
        ) : (
          <>
            <Text style={styles.modalHint}>
              {t('auth.otp.subtitle')} {isEmail(signinContact) ? signinContact : signinContact}
            </Text>
            <View style={styles.otpContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.otpBox}>
                  <TextInput
                    style={styles.otpInput}
                    maxLength={1}
                    value={signinOtp[i] || ''}
                    onChangeText={(val) => {
                      const newOtp = signinOtp.substring(0, i) + val + signinOtp.substring(i + 1);
                      setSigninOtp(newOtp);
                    }}
                    keyboardType="numeric"
                    textAlign="center"
                    autoFocus={i === 0}
                  />
                </View>
              ))}
            </View>
            {signinError && <Text style={styles.errorText}>{signinError}</Text>}
            <Button variant="outline" size="md" onPress={() => { setSigninStep('contact'); setSigninOtp(''); setSigninError(''); }} style={styles.backButton}>
              {t('auth.otp.backButton')}
            </Button>
            <Button variant="secondary" size="sm" onPress={handleResendSigninOtp} style={styles.resendButton} disabled={signinLoading}>
              {t('auth.otp.resendButton')}
            </Button>
          </>
        )}
      </Modal>

      {error && !loading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="outline" size="sm" onPress={refreshData}>
            {t('errors.retry')}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

import { useRouter } from 'expo-router';
const router = useRouter();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  gradientBg: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#073763',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  photoCard: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  dashboardCard: {
    marginBottom: 16,
  },
  dashboardLabel: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  totalCount: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FF6200',
    textAlign: 'center',
    lineHeight: 72,
    fontFamily: 'Inter_800ExtraBold',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FBFEFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1220',
    fontFamily: 'Inter_700Bold',
  },
  userContact: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  fabButton: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  anonymousHint: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  submitRegisteredName: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FBFEFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EEF8',
  },
  submitRegisteredNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1220',
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  modalHint: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 20,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderWidth: 2,
    borderColor: '#E6EEF8',
    borderRadius: 8,
    backgroundColor: '#FBFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0B1220',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  backButton: {
    width: '100%',
    marginBottom: 10,
  },
  resendButton: {
    width: '100%',
  },
});