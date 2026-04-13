import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginStaff } from '../services/api';
import { Mail, Lock, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { isDarkMode, colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginStaff(email.trim(), password);
      const token = response.data.token || response.data.accessToken;
      if (token) {
        await AsyncStorage.setItem('staffToken', token);
        navigation.replace('EventSelect');
      } else {
        Alert.alert('Lỗi xác thực', 'Hệ thống không trả về khoá truy cập.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Thông tin đăng nhập không chính xác hoặc tài khoản đã bị khoá.';
      Alert.alert('Đăng nhập thất bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={isDarkMode ? require('../../assets/login-bg.png') : null}
      style={[styles.bg, { backgroundColor: colors.background }]}
      resizeMode="cover"
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.05)' }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.kav}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(57,255,20,0.15)' : 'rgba(57,255,20,0.08)', borderColor: isDarkMode ? 'rgba(57,255,20,0.35)' : 'rgba(57,255,20,0.2)' }]}>
                <ShieldCheck size={40} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={[styles.brandText, { color: colors.text }]}>
                BAS<Text style={styles.brandGreen}>TICKET</Text>
              </Text>
              <View style={[styles.badgeBox, { backgroundColor: isDarkMode ? 'rgba(57,255,20,0.08)' : 'rgba(57,255,20,0.05)', borderColor: isDarkMode ? 'rgba(57,255,20,0.2)' : 'rgba(57,255,20,0.1)' }]}>
                <Text style={styles.badgeText}>Staff Portal</Text>
              </View>
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Xin chào!</Text>
              <Text style={[styles.cardSubtitle, { color: colors.subtext }]}>Đăng nhập để bắt đầu phiên soát vé</Text>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email nhân viên</Text>
                <View style={[styles.inputRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                  <Mail size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="example@basticket.vn"
                    placeholderTextColor={isDarkMode ? '#444' : '#bbb'}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                <Text style={styles.fieldLabel}>Mật khẩu</Text>
                <View style={[styles.inputRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                  <Lock size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={isDarkMode ? '#444' : '#bbb'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.loginBtn, { backgroundColor: colors.primary }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Đăng nhập</Text>
                    <ChevronRight size={20} color="#000" strokeWidth={3} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.subtext }]}>© 2026 BASTICKET ECOSYSTEM</Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
}

const NEON = '#39FF14';

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  kav: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandText: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandGreen: {
    color: NEON,
  },
  badgeBox: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1,
    marginTop: 8,
  },
  badgeText: {
    color: NEON,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: 36,
    padding: 28,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 24,
  },
  fieldGroup: {},
  fieldLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  loginBtn: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    elevation: 6,
  },
  loginBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 17,
    marginRight: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

