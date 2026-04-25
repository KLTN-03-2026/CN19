import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Ticket, ShoppingBag, BarChart3, PieChart, Activity, CheckCircle2, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getMyEvents } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');


export default function EventStatsScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const [event, setEvent] = React.useState(route.params?.event);
  const [loading, setLoading] = React.useState(false);

  const fetchLatestStats = async () => {
    if (!event?.id) return;
    try {
      setLoading(true);
      const res = await getMyEvents();
      const allEvents = res.data?.data || [];
      const updatedEvent = allEvents.find(e => e.id === event.id);
      if (updatedEvent) {
        setEvent(updatedEvent);
      }
    } catch (e) {
      console.log('Fetch stats error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLatestStats();
    }, [])
  );

  if (!event) return null;

  // Tính toán tỷ lệ phần trăm
  const ticketPercent = event.total_tickets > 0 
    ? Math.round((event.scanned_count / event.total_tickets) * 100) 
    : 0;
    
  const productPercent = event.total_merchandise > 0 
    ? Math.round((event.redeemed_merchandise_count / event.total_merchandise) * 100) 
    : 0;

  const StatCard = ({ title, current, total, percent, icon: Icon, color }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Icon size={20} color={color} />
        </View>
        <Text style={[styles.statPercent, { color: color }]}>{percent}%</Text>
      </View>
      
      <Text style={[styles.statTitle, { color: colors.subtext }]}>{title}</Text>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarBase, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.progressBarFill, { backgroundColor: color, width: `${percent}%` }]} />
        </View>
      </View>

      <View style={styles.statValueRow}>
        <Text style={[styles.statCurrent, { color: colors.text }]}>{current}</Text>
        <Text style={[styles.statTotal, { color: colors.subtext }]}> / {total}</Text>
      </View>
      <Text style={[styles.statUnit, { color: colors.subtext }]}>{title === 'VÉ SỰ KIỆN' ? 'vé đã soát' : 'sản phẩm đã nhận'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerSub, { color: colors.primary }]}>THỐNG KÊ CHI TIẾT</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryBox}>
          <Activity size={20} color={colors.primary} />
          <Text style={[styles.summaryText, { color: colors.text }]}>Tổng quan tiến độ soát vé và nhận sản phẩm</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            title="VÉ SỰ KIỆN"
            current={event.scanned_count}
            total={event.total_tickets}
            percent={ticketPercent}
            icon={Ticket}
            color={colors.primary}
          />
          
          <StatCard 
            title="SẢN PHẨM"
            current={event.redeemed_merchandise_count}
            total={event.total_merchandise}
            percent={productPercent}
            icon={ShoppingBag}
            color="#3b82f6"
          />
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <TrendingUp size={18} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Phân tích hiệu suất</Text>
          </View>
          
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.subtext }]}>Cần soát tiếp</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{event.total_tickets - event.scanned_count} vé</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.subtext }]}>Cần trả tiếp</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{event.total_merchandise - event.redeemed_merchandise_count} SP</Text>
            </View>
          </View>

          <View style={[styles.tipBox, { backgroundColor: isDarkMode ? 'rgba(57,255,20,0.05)' : 'rgba(57,255,20,0.03)' }]}>
            <CheckCircle2 size={14} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.subtext }]}>
              Dữ liệu được cập nhật thời gian thực mỗi khi có lượt quét thành công.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { marginLeft: 16, flex: 1 },
  headerSub: { fontSize: 10, fontWeight: '900', marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  
  scrollContent: { padding: 20 },
  summaryBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
  summaryText: { fontSize: 13, fontWeight: '600' },
  
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  statCard: { flex: 1, padding: 18, borderRadius: 28, borderWidth: 1 },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statPercent: { fontSize: 15, fontWeight: '900' },
  statTitle: { fontSize: 9, fontWeight: '900', marginBottom: 12 },
  
  progressContainer: { marginBottom: 12 },
  progressBarBase: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  
  statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  statCurrent: { fontSize: 22, fontWeight: '900' },
  statTotal: { fontSize: 13, fontWeight: '700' },
  statUnit: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  
  infoCard: { padding: 24, borderRadius: 32, borderWidth: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoTitle: { fontSize: 15, fontWeight: '900' },
  infoDivider: { height: 1, marginVertical: 20 },
  
  metricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricItem: { flex: 1 },
  metricLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  metricValue: { fontSize: 16, fontWeight: '900' },
  
  tipBox: { marginTop: 24, padding: 16, borderRadius: 16, flexDirection: 'row', gap: 10, alignItems: 'center' },
  tipText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '500' },
});
