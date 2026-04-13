import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { ChevronLeft, Moon, Sun, Lock, ShieldCheck, Info, ChevronRight, X, KeyRound, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { forgotPassword, resetPassword, getProfile } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const { isDarkMode, colors, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  
  // Reset Password State
  const [showResetModal, setShowResetModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchEmail();
  }, []);

  const fetchEmail = async () => {
    try {
      const res = await getProfile();
      setEmail(res.data?.data?.email || '');
    } catch (e) {
      console.log('Error fetching email for settings:', e);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Lỗi', 'Không tìm thấy email người dùng.');
      return;
    }

    Alert.alert(
      'Quên mật khẩu',
      `Hệ thống sẽ gửi mã OTP khôi phục mật khẩu đến địa chỉ: ${email}. Bạn có muốn tiếp tục?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi mã OTP',
          onPress: async () => {
            setLoading(true);
            try {
              await forgotPassword(email);
              Alert.alert(
                'Thành công', 
                'Mã OTP khôi phục đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
                [{ text: 'Nhập mã ngay', onPress: () => setShowResetModal(true) }]
              );
            } catch (error) {
              Alert.alert('Lỗi', error.response?.data?.error || 'Không thể gửi mã OTP.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ mã OTP và mật khẩu mới.');
      return;
    }
    if (otp.length !== 6) {
      Alert.alert('Thông báo', 'Mã OTP phải có 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, otp, new_password: newPassword });
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại.');
      setShowResetModal(false);
      setOtp('');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Đã có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const renderSectionHeader = (title) => (
    <Text style={[styles.sectionHeader, { color: colors.primary }]}>{title}</Text>
  );

  const renderRow = ({ icon: Icon, label, value, onPress, isSwitch, switchValue, onSwitchChange, last }) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        last && { borderBottomWidth: 0 }
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
          <Icon size={18} color={isDarkMode ? '#aaa' : '#555'} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {isSwitch ? (
          <Switch
            trackColor={{ false: '#333', true: colors.primary }}
            thumbColor={'#fff'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={onSwitchChange}
            value={switchValue}
          />
        ) : (
          <>
            {value && <Text style={[styles.rowValue, { color: colors.subtext }]}>{value}</Text>}
            {onPress && <ChevronRight size={16} color={colors.subtext} />}
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cài đặt</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {renderSectionHeader('GIAO DIỆN')}
        {renderRow({
          icon: isDarkMode ? Moon : Sun,
          label: 'Chế độ tối',
          isSwitch: true,
          switchValue: isDarkMode,
          onSwitchChange: toggleTheme,
        })}

        <View style={{ marginTop: 24 }} />
        {renderSectionHeader('BẢO MẬT & TÀI KHOẢN')}
        {renderRow({
          icon: Lock,
          label: 'Quên mật khẩu',
          value: 'Khôi phục qua Email',
          onPress: handleForgotPassword,
        })}
        {renderRow({
          icon: ShieldCheck,
          label: 'Bảo mật hai lớp',
          value: 'Tắt',
          onPress: () => Alert.alert('Thông báo', 'Tính năng này đang được phát triển.'),
          last: true,
        })}

        <View style={{ marginTop: 24 }} />
        {renderSectionHeader('THÔNG TIN')}
        {renderRow({
          icon: Info,
          label: 'Phiên bản rình duyệt',
          value: '1.0.2 (Build 2026)',
          last: true,
        })}
      </View>

      {/* Reset Password Modal */}
      <Modal visible={showResetModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Thay đổi mật khẩu</Text>
                <TouchableOpacity onPress={() => setShowResetModal(false)} style={styles.modalClose}>
                  <X size={20} color={colors.subtext} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalDesc, { color: colors.subtext }]}>
                Nhập mã OTP 6 số đã được gửi đến email của bạn và đặt mật khẩu mới bên dưới.
              </Text>

              <View style={styles.modalFields}>
                <View style={[styles.modalInputBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                  <KeyRound size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder="Mã OTP 6 số"
                    placeholderTextColor={isDarkMode ? '#444' : '#aaa'}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>

                <View style={[styles.modalInputBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.border, marginTop: 12 }]}>
                  <Lock size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder="Mật khẩu mới"
                    placeholderTextColor={isDarkMode ? '#444' : '#aaa'}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>

                <TouchableOpacity 
                  activeOpacity={0.8} 
                  style={[styles.modalSubmit, { backgroundColor: colors.primary }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#000" /> : (
                    <>
                      <Text style={styles.modalSubmitText}>HOÀN TẤT ĐỔI MẬT KHẨU</Text>
                      <CheckCircle size={18} color="#000" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {loading && !showResetModal && (
        <View style={styles.loaderBg}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 13,
    marginRight: 8,
  },
  loaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  // Modal styles 
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalFields: {},
  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
  },
  modalInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSubmit: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 10,
  },
  modalSubmitText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});

