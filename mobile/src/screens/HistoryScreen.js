import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getScanHistory } from '../services/api';
import dayjs from 'dayjs';
import { ChevronLeft, CheckCircle2, XCircle, Clock, Ticket, Search, Filter, Hash, User, LayoutDashboard } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function HistoryScreen({ navigation, route }) {
  const { isDarkMode, colors } = useTheme();
  const eventId = route.params?.eventId;
  const eventTitle = route.params?.eventTitle;
  const [history, setHistory] = React.useState([]);
  const [filteredHistory, setFilteredHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => { fetchHistory(); }, [eventId]);

  React.useEffect(() => {
    let result = history;
    
    // Filter by status
    if (filter === 'success') result = result.filter(i => i.is_success);
    else if (filter === 'fail') result = result.filter(i => !i.is_success);

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.ticket?.ticket_number?.toLowerCase().includes(q) ||
        i.ticket?.order?.customer?.full_name?.toLowerCase().includes(q) ||
        i.ticket?.event?.title?.toLowerCase().includes(q) ||
        i.ticket?.ticket_tier?.tier_name?.toLowerCase().includes(q)
      );
    }

    setFilteredHistory(result);
  }, [filter, history, searchQuery]);

  const fetchHistory = async () => {
    try {
      const response = await getScanHistory(eventId);
      const data = response.data?.data || [];
      setHistory(data);
      setFilteredHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderFilterChip = (id, label, Icon) => {
    const isActive = filter === id;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setFilter(id)}
        style={[
          styles.chip, 
          { backgroundColor: colors.card, borderColor: colors.border },
          isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
        ]}
      >
        <Icon size={13} color={isActive ? '#000' : (isDarkMode ? '#555' : '#aaa')} />
        <Text style={[styles.chipText, { color: isDarkMode ? '#555' : '#aaa' }, isActive && { color: '#000' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardLabelRow}>
            <Hash size={12} color={colors.subtext} />
            <Text style={[styles.cardLabel, { color: colors.subtext }]}>Số hiệu vé</Text>
          </View>
          <Text style={[styles.ticketNum, { color: colors.text }]}>{item.ticket?.ticket_number || 'N/A'}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.is_success 
            ? { backgroundColor: 'rgba(57,255,20,0.08)', borderColor: 'rgba(57,255,20,0.2)' } 
            : { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }
        ]}>
          {item.is_success
            ? <CheckCircle2 size={14} color={colors.primary} />
            : <XCircle size={14} color="#f87171" />}
          <Text style={[styles.statusText, { color: item.is_success ? colors.primary : '#f87171' }]}>
            {item.is_success ? 'Hợp lệ' : 'Từ chối'}
          </Text>
        </View>
      </View>

      <View style={[styles.detailBox, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.03)' }]}>
        <View style={styles.detailRow}>
           <LayoutDashboard size={13} color={colors.primary} />
           <Text style={[styles.detailLabel, { color: colors.subtext, fontWeight: '900' }]}>SỰ KIỆN: </Text>
           <Text style={[styles.detailValue, { color: colors.text, flex: 1 }]} numberOfLines={1}>{item.ticket?.event?.title || 'Event'}</Text>
        </View>
        <View style={[styles.detailRow, { marginTop: 8 }]}>
          <Ticket size={13} color={colors.subtext} />
          <Text style={[styles.detailLabel, { color: colors.subtext }]}>Loại vé: </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.ticket?.ticket_tier?.tier_name || 'Ticket'}</Text>
        </View>
        <View style={[styles.detailRow, { marginTop: 8 }]}>
          <User size={13} color={colors.subtext} />
          <Text style={[styles.detailLabel, { color: colors.subtext }]}>Khách hàng: </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.ticket?.order?.customer?.full_name || 'Khách vãng lai'}</Text>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={styles.timeRow}>
          <Clock size={13} color={colors.subtext} />
          <Text style={[styles.timeText, { color: colors.subtext }]}>
            {dayjs(item.scanned_at).format('HH:mm')} • {dayjs(item.scanned_at).format('DD/MM/YYYY')}
          </Text>
        </View>
        {!item.is_success && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText} numberOfLines={1}>
              {item.failure_reason || 'Mã đã sử dụng'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={[styles.headerSub, { color: colors.primary }]}>AUDIT LOG</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={isDarkMode ? '#555' : '#aaa'} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm theo tên khách, mã vé, sự kiện..."
            placeholderTextColor={isDarkMode ? '#444' : '#bbb'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {eventTitle && (
          <View style={[styles.eventBox, { backgroundColor: isDarkMode ? 'rgba(57,255,20,0.05)' : 'rgba(57,255,20,0.03)', borderColor: isDarkMode ? 'rgba(57,255,20,0.12)' : 'rgba(57,255,20,0.1)' }]}>
            <View style={styles.eventLabelRow}>
              <Filter size={11} color={colors.primary} />
              <Text style={[styles.eventLabel, { color: colors.primary }]}>Sự kiện tiêu điểm</Text>
            </View>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{eventTitle}</Text>
          </View>
        )}

        <View style={styles.chipRow}>
          {renderFilterChip('all', 'Tất cả', Filter)}
          {renderFilterChip('success', 'Hợp lệ', CheckCircle2)}
          {renderFilterChip('fail', 'Từ chối', XCircle)}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>Đang tải dữ liệu log...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchHistory(); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Search size={44} color={isDarkMode ? '#222' : '#ddd'} />
              </View>
              <Text style={[styles.emptyText, { color: colors.subtext }]}>Không tìm thấy bản ghi nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 10, borderRadius: 14, borderWidth: 1 },
  headerSub: { fontSize: 9, fontWeight: '900', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 18, borderWidth: 1, marginBottom: 18 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 13, fontWeight: '600' },
  eventBox: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 18 },
  eventLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  eventLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 6 },
  eventTitle: { fontSize: 16, fontWeight: '900' },
  chipRow: { flexDirection: 'row' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginRight: 10, borderWidth: 1 },
  chipText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  card: { marginHorizontal: 18, marginBottom: 14, padding: 18, borderRadius: 26, borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 5 },
  ticketNum: { fontSize: 18, fontWeight: '900' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 7 },
  detailBox: { borderRadius: 16, padding: 14, marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 11, marginLeft: 8 },
  detailValue: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 11, fontWeight: '700', marginLeft: 7 },
  reasonBox: { backgroundColor: 'rgba(248,113,113,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reasonText: { color: '#f87171', fontSize: 10, fontWeight: '700', fontStyle: 'italic' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIcon: { padding: 28, borderRadius: 50, marginBottom: 20, borderWidth: 1 },
  emptyText: { textAlign: 'center', fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 2 },
});


