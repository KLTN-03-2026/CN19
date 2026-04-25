import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { scanTicket, scanProduct } from '../services/api';
import { History, MoveLeft, Zap, CheckCircle, AlertCircle, RefreshCcw, ShieldCheck, Ticket, X, User, ShoppingBag, Keyboard } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { TextInput, Modal } from 'react-native';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.75;

export default function ScannerScreen({ navigation, route }) {
  const { isDarkMode, colors } = useTheme();
  const event = route.params?.event;
  const scanType = route.params?.type || 'ticket'; // 'ticket' or 'product'
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [resultMessage, setResultMessage] = React.useState(null);
  const [isSuccess, setIsSuccess] = React.useState(true);
  const [scannedData, setScannedData] = React.useState(null);
  const [torch, setTorch] = React.useState(false);
  const [showManualInput, setShowManualInput] = React.useState(false);
  const [manualCode, setManualCode] = React.useState('');

  const scanAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!permission) requestPermission();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: SCANNER_SIZE - 4, duration: 2500, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    Vibration.vibrate(80);
    try {
      let response;
      if (scanType === 'product') {
        response = await scanProduct(data, event?.id);
      } else {
        response = await scanTicket(data, event?.id);
      }
      setIsSuccess(true);
      setResultMessage(response.data?.message || (scanType === 'product' ? 'Sản phẩm hợp lệ!' : 'Vé hợp lệ, chào mừng khách hàng!'));
      setScannedData(response.data?.data);
      Vibration.vibrate([0, 80, 60, 80]);
    } catch (error) {
      setIsSuccess(false);
      setResultMessage(error.response?.data?.error || (scanType === 'product' ? 'Mã sản phẩm không hợp lệ!' : 'Vé không hợp lệ hoặc đã được sử dụng!'));
      Vibration.vibrate(500);
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setResultMessage(null);
    setScannedData(null);
  };

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.permIconBox, { backgroundColor: 'rgba(248,113,113,0.1)' }]}>
          <AlertCircle size={48} color="#f87171" />
        </View>
        <Text style={[styles.permTitle, { color: colors.text }]}>Quyền Truy Cập Camera</Text>
        <Text style={[styles.permDesc, { color: colors.subtext }]}>Ứng dụng cần quyền sử dụng camera để quét mã QR soát vé.</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={requestPermission} style={[styles.permBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.permBtnText}>Cấp quyền ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Camera Feed */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Viewfinder Overlay */}
      <View style={styles.viewfinder}>
        {/* Dark overlay with scan opening */}
        <View style={styles.overlayRow} />
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.overlaySide} />
          <Animated.View style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />
            {/* Laser */}
            <Animated.View style={[styles.laser, { backgroundColor: colors.primary, shadowColor: colors.primary, transform: [{ translateY: scanAnim }] }]} />
          </Animated.View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <View style={styles.bottomControls}>
            <View style={styles.scanningBadge}>
              <View style={[styles.scanDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.scanningText}>Đang chờ nhận diện mã...</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setTorch(!torch)}
              style={[styles.torchBtn, torch && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Zap size={24} color={torch ? '#000' : '#fff'} fill={torch ? '#000' : 'transparent'} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowManualInput(true)}
              style={[styles.manualBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }]}
            >
              <Keyboard size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nhập mã thủ công</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)}>
                <X size={20} color={colors.subtext} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalDesc, { color: colors.subtext }]}>
              Nhập mã {scanType === 'product' ? 'nhận hàng' : 'vé'} in trên đơn hàng của khách.
            </Text>

            <TextInput
              style={[styles.manualInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}
              placeholder="Ví dụ: BT-XXXXXX"
              placeholderTextColor={colors.subtext + '80'}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoFocus
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (manualCode.trim()) {
                  setShowManualInput(false);
                  handleBarCodeScanned({ data: manualCode.trim() });
                  setManualCode('');
                }
              }}
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.confirmBtnText}>XÁC NHẬN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MoveLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerSub, { color: colors.primary }]}>{scanType === 'product' ? 'QUÉT SẢN PHẨM' : 'SOÁT VÉ TRỰC TUYẾN'}</Text>
          <Text style={styles.headerEvent} numberOfLines={1}>{event?.title || 'Sự kiện'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('History', { eventId: event?.id, eventTitle: event?.title, type: scanType })}
          style={styles.headerBtn}
        >
          <History size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Result Modal Overlay */}
      {(loading || scanned) && (
        <View style={styles.resultOverlay}>
          <View style={[styles.resultBg, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.85)' }]} />

          {loading ? (
            <View style={styles.loadingBox}>
              <View style={[styles.loadingInner, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)', borderColor: colors.border }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
              <Text style={[styles.loadingText, { color: '#fff' }]}>Phân tích dữ liệu...</Text>
            </View>
          ) : (
            <View style={styles.resultContent}>
              <View style={[styles.resultIcon, { borderColor: isSuccess ? colors.primary : '#f87171', backgroundColor: isSuccess ? 'rgba(57,255,20,0.08)' : 'rgba(248,113,113,0.08)' }]}>
                {isSuccess ? <CheckCircle size={64} color={colors.primary} /> : <X size={64} color="#f87171" />}
              </View>

              <Text style={[styles.resultStatus, { color: isSuccess ? colors.primary : '#f87171' }]}>
                {isSuccess ? (scanType === 'product' ? 'HỢP LỆ' : 'VÉ HỢP LỆ') : (scanType === 'product' ? 'TỪ CHỐI' : 'KHÔNG HỢP LỆ')}
              </Text>

              <View style={[styles.resultCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.card, borderColor: colors.border }]}>
                <Text style={[styles.resultMsg, { color: colors.text }]}>{resultMessage}</Text>
                {isSuccess && scannedData && (
                  <View style={[styles.ticketInfo, { borderTopColor: colors.border }]}>
                    {scanType === 'product' ? (
                      <>
                        <View style={styles.ticketInfoRow}>
                          <ShoppingBag size={15} color={colors.primary} />
                          <Text style={[styles.ticketInfoText, { color: colors.subtext }]}>Sản phẩm: {scannedData.product_name}</Text>
                        </View>
                        <View style={[styles.ticketInfoRow, { marginTop: 8 }]}>
                          <User size={15} color={colors.primary} />
                          <Text style={[styles.ticketInfoText, { color: colors.subtext }]}>Khách hàng: {scannedData.customer_name}</Text>
                        </View>
                        <View style={[styles.ticketInfoRow, { marginTop: 8 }]}>
                          <ShieldCheck size={15} color={colors.primary} />
                          <Text style={[styles.ticketInfoText, { color: colors.subtext }]}>Số lượng: {scannedData.quantity}</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.ticketInfoRow}>
                          <User size={15} color={colors.primary} />
                          <Text style={[styles.ticketInfoText, { color: colors.subtext }]}>Khách hàng: {scannedData.order?.customer?.full_name || 'Khách vãng lai'}</Text>
                        </View>
                        <View style={[styles.ticketInfoRow, { marginTop: 8 }]}>
                          <ShieldCheck size={15} color={colors.primary} />
                          <Text style={[styles.ticketInfoText, { color: colors.subtext }]}>Mã vé: {scannedData.ticket_number}</Text>
                        </View>
                        <View style={[styles.ticketInfoRow, { marginTop: 8 }]}>
                          <Ticket size={15} color={colors.primary} />
                          <Text style={[styles.ticketInfoText, { color: colors.subtext }]}>Loại: {scannedData.ticket_tier?.tier_name || 'Standard'}</Text>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={resetScan}
                style={[styles.continueBtn, { backgroundColor: isSuccess ? colors.primary : '#dc2626' }]}
              >
                <RefreshCcw size={20} color={isSuccess ? '#000' : '#fff'} />
                <Text style={[styles.continueBtnText, { color: isSuccess ? '#000' : '#fff' }]}>Tiếp tục quét</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
                <Text style={[styles.goBackText, { color: isDarkMode ? '#555' : '#ccc' }]}>Quay lại màn hình chính</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const CORNER = 64;
const BORDER = 5;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permIconBox: { padding: 24, borderRadius: 50, marginBottom: 20 },
  permTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  permDesc: { textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  permBtnText: { color: '#000', fontWeight: '900', textTransform: 'uppercase' },
  
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 10, borderRadius: 14 },
  headerCenter: { alignItems: 'center', flex: 1, marginHorizontal: 12 },
  headerSub: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  headerEvent: { color: '#fff', fontWeight: '700', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  
  viewfinder: { flex: 1 },
  overlayRow: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 20 },
  
  scanFrame: { width: SCANNER_SIZE, height: SCANNER_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 24 },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 24 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: 24 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 24 },
  laser: { width: '85%', alignSelf: 'center', height: 3, borderRadius: 3, shadowOpacity: 0.9, shadowRadius: 12, elevation: 20 },
  
  bottomControls: { alignItems: 'center' },
  scanningBadge: { backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  scanDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  scanningText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', fontSize: 10 },
  torchBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  manualBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginLeft: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 32, padding: 24, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  modalDesc: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  manualInput: { width: '100%', height: 60, borderRadius: 16, borderWidth: 1, paddingHorizontal: 20, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  confirmBtn: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },

  resultOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  resultBg: { ...StyleSheet.absoluteFillObject },
  loadingBox: { alignItems: 'center' },
  loadingInner: { padding: 36, borderRadius: 36, borderWidth: 1, marginBottom: 24 },
  loadingText: { fontWeight: '900', textTransform: 'uppercase', fontSize: 10 },
  resultContent: { width: '100%', alignItems: 'center' },
  resultIcon: { width: 128, height: 128, borderRadius: 64, borderWidth: 5, justifyContent: 'center', alignItems: 'center', marginBottom: 22 },
  resultStatus: { fontSize: 36, fontWeight: '900', marginBottom: 20 },
  resultCard: { borderRadius: 32, padding: 26, width: '100%', marginBottom: 24, borderWidth: 1 },
  resultMsg: { textAlign: 'center', fontWeight: '700', fontSize: 16, lineHeight: 24 },
  ticketInfo: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  ticketInfoRow: { flexDirection: 'row', alignItems: 'center' },
  ticketInfoText: { fontSize: 12, marginLeft: 10 },
  continueBtn: { width: '100%', paddingVertical: 18, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  continueBtnText: { fontWeight: '900', fontSize: 18, textTransform: 'uppercase' },
  goBackText: { fontWeight: '700', textTransform: 'uppercase', fontSize: 10 },
});

