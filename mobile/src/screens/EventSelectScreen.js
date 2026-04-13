import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  StatusBar,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { getMyEvents, getProfile } from '../services/api';
import { Calendar, MapPin, ChevronRight, LogOut, Search, LayoutDashboard, Ticket, User, Clock, Settings } from 'lucide-react-native';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const NEON = '#39FF14';

// ─── Bottom Tab Bar ────────────────────────────────────────────────────────────
function BottomTab({ active, onPress }) {
  const { isDarkMode, colors } = useTheme();
  const tabs = [
    { id: 'events', label: 'Sự kiện', Icon: LayoutDashboard },
    { id: 'history', label: 'Lịch sử', Icon: Clock },
    { id: 'profile', label: 'Tài khoản', Icon: User },
  ];
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <TouchableOpacity
            key={id}
            style={styles.tabItem}
            onPress={() => onPress(id)}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconWrap}>
              <Icon size={22} color={isActive ? colors.primary : (isDarkMode ? '#555' : '#aaa')} />
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? colors.primary : (isDarkMode ? '#555' : '#aaa') }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function EventSelectScreen({ navigation }) {
  const { isDarkMode, colors } = useTheme();
  const [events, setEvents] = React.useState([]);
  const [filteredEvents, setFilteredEvents] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [totalScanned, setTotalScanned] = React.useState(0);
  const [activeEvents, setActiveEvents] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('events');
  const [profile, setProfile] = React.useState(null);

  React.useEffect(() => {
    fetchEvents();
    fetchProfile();
  }, []);

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(e =>
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location_address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data?.data || null);
    } catch (e) {
      console.log('Profile fetch error:', e.message);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await getMyEvents();
      const allEvents = response.data?.data || [];
      let scanned = 0, active = 0;
      allEvents.forEach(e => {
        scanned += (e.scanned_count || 0);
        if (!dayjs().isAfter(dayjs(e.event_date).endOf('day'))) active++;
      });
      setTotalScanned(scanned);
      setActiveEvents(active);
      const sorted = allEvents.sort((a, b) => {
        const isPastA = dayjs().isAfter(dayjs(a.event_date).endOf('day'));
        const isPastB = dayjs().isAfter(dayjs(b.event_date).endOf('day'));
        if (isPastA === isPastB) return dayjs(a.event_date).isAfter(dayjs(b.event_date)) ? 1 : -1;
        return isPastA ? 1 : -1;
      });
      setEvents(sorted);
      setFilteredEvents(sorted);
    } catch (error) {
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('staffToken');
          navigation.replace('Login');
        }
      }
    ]);
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'history') {
      navigation.navigate('History', {});
    } else if (tabId === 'profile') {
      setActiveTab('profile');
    } else {
      setActiveTab(tabId);
    }
  };

  // ─── Profile Tab Content ──────────────────────────────────────
  const renderProfileTab = () => (
    <View style={[styles.profileTab, { backgroundColor: colors.background }]}>
      {/* Avatar + Name */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatarLarge, { backgroundColor: isDarkMode ? 'rgba(57,255,20,0.1)' : 'rgba(57,255,20,0.05)' }]}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {(profile?.full_name || 'S').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={[styles.profileName, { color: colors.text }]}>{profile?.full_name || 'Nhân viên'}</Text>
        <Text style={[styles.profileEmail, { color: colors.subtext }]}>{profile?.email || ''}</Text>
        <View style={[styles.roleBadge, { backgroundColor: isDarkMode ? 'rgba(57,255,20,0.08)' : 'rgba(57,255,20,0.05)', borderColor: isDarkMode ? 'rgba(57,255,20,0.2)' : 'rgba(57,255,20,0.1)' }]}>
          <Text style={styles.roleText}>STAFF</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.profileStats, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.profileStatItem}>
          <Text style={[styles.profileStatNum, { color: colors.text }]}>{totalScanned}</Text>
          <Text style={[styles.profileStatLabel, { color: colors.subtext }]}>Tổng vé đã soát</Text>
        </View>
        <View style={[styles.profileStatDivider, { backgroundColor: colors.border }]} />
        <View style={styles.profileStatItem}>
          <Text style={[styles.profileStatNum, { color: colors.text }]}>{activeEvents}</Text>
          <Text style={[styles.profileStatLabel, { color: colors.subtext }]}>Sự kiện hiện tại</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.profileActions, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.profileActionRow, { borderBottomColor: colors.border }]} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={[styles.profileActionIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
            <Settings size={18} color={isDarkMode ? '#888' : '#555'} />
          </View>
          <Text style={[styles.profileActionText, { color: colors.text }]}>Cài đặt</Text>
          <ChevronRight size={16} color={colors.subtext} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.profileActionRow, styles.profileActionLast]} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[styles.profileActionIcon, { backgroundColor: 'rgba(248,113,113,0.1)' }]}>
            <LogOut size={18} color="#f87171" />
          </View>
          <Text style={[styles.profileActionText, { color: '#f87171' }]}>Đăng xuất</Text>
          <ChevronRight size={16} color="#f87171" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Events Tab List Header ───────────────────────────────────
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Staff mini profile */}
      <View style={styles.staffRow}>
        <View style={[styles.avatarSmall, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
          ) : (
            <Text style={[styles.avatarInitialSmall, { color: colors.primary }]}>
              {(profile?.full_name || 'S').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.staffGreeting, { color: colors.subtext }]}>Xin chào, 👋</Text>
          <Text style={[styles.staffName, { color: colors.text }]}>{profile?.full_name || 'Nhân viên'}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(57,255,20,0.1)' }]}>
            <Ticket size={18} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{totalScanned}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Đã soát vé</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <LayoutDashboard size={18} color="#3b82f6" />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{activeEvents}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Sự kiện cần soát</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Danh sách công tác</Text>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={18} color={isDarkMode ? '#555' : '#aaa'} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Tìm tên sự kiện, địa điểm..."
          placeholderTextColor={isDarkMode ? '#555' : '#bbb'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  const renderEventItem = ({ item }) => {
    const isPast = dayjs().isAfter(dayjs(item.event_date).endOf('day'));
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, isPast && styles.cardPast]}
        onPress={() => isPast
          ? navigation.navigate('History', { eventId: item.id, eventTitle: item.title })
          : navigation.navigate('Scanner', { event: item })
        }
      >
        <Image
          source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30' }}
          style={[styles.cardImage, { opacity: isPast ? 0.1 : (isDarkMode ? 0.45 : 0.8) }]}
          resizeMode="cover"
        />
        <View style={styles.badge}>
          {isPast ? (
            <View style={styles.badgePast}><Text style={styles.badgePastText}>Hết hạn</Text></View>
          ) : (
            <View style={[styles.badgeActive, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }]}>
              <View style={styles.badgeDot} />
              <Text style={[styles.badgeActiveText, { color: isDarkMode ? colors.primary : '#065f46' }]}>Active</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }, isPast && styles.cardTitlePast]} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Calendar size={12} color={colors.subtext} />
              <Text style={[styles.metaText, { color: colors.subtext }]}>{dayjs(item.event_date).format('DD/MM/YYYY')}</Text>
            </View>
            <View style={[styles.metaItem, { flex: 1 }]}>
              <MapPin size={12} color={colors.subtext} />
              <Text style={[styles.metaText, { flex: 1, color: colors.subtext }]} numberOfLines={1}>{item.location_address}</Text>
            </View>
          </View>
          <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.scannedLabel, { color: colors.subtext }]}>Đã soát vé</Text>
              <Text style={[styles.scannedCount, { color: colors.text }]}>{item.scanned_count || 0}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {!isPast && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('History', { eventId: item.id, eventTitle: item.title });
                  }}
                  style={[styles.actionBtn, { paddingHorizontal: 12, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
                >
                  <Clock size={16} color={colors.text} />
                </TouchableOpacity>
              )}
              <View style={[styles.actionBtn, !isPast && { backgroundColor: colors.primary }]}>
                <Text style={[styles.actionBtnText, !isPast && { color: '#000' }]}>
                  {isPast ? 'Lịch sử' : 'Quét vé'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.topBarBrand, { color: colors.text }]}>BAS<Text style={{ color: colors.primary }}>TICKET</Text></Text>
        <Text style={[styles.topBarRole, { color: colors.subtext }]}>Staff Portal</Text>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'profile' ? (
          renderProfileTab()
        ) : loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={renderHeader}
            data={filteredEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchEvents(); }}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      <BottomTab active={activeTab} onPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', height: 75, borderTopWidth: 1, paddingBottom: 15 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  tabLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 15, borderBottomWidth: 1 },
  topBarBrand: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  topBarRole: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: { padding: 20 },
  staffRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatarSmall: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarInitialSmall: { fontSize: 18, fontWeight: '900' },
  staffGreeting: { fontSize: 12, fontWeight: '600' },
  staffName: { fontSize: 18, fontWeight: '900' },
  
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 32 },
  statCard: { flex: 1, padding: 20, borderRadius: 28, borderWidth: 1 },
  statIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statNumber: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  
  sectionTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 54, borderRadius: 18, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' },
  
  card: { marginHorizontal: 20, marginBottom: 16, borderRadius: 32, overflow: 'hidden', borderWidth: 1 },
  cardPast: { opacity: 0.8 },
  cardImage: { position: 'absolute', width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
  badgeActive: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NEON, marginRight: 8 },
  badgeActiveText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  badgePast: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgePastText: { color: '#888', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  
  cardBody: { padding: 20, paddingTop: 80 },
  cardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 10 },
  cardTitlePast: { color: '#888' },
  cardMeta: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '600' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1 },
  scannedLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  scannedCount: { fontSize: 24, fontWeight: '900' },
  actionBtn: { height: 48, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtnActive: { backgroundColor: NEON },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  actionBtnTextActive: { color: '#000' },
  
  profileTab: { flex: 1, padding: 20 },
  profileCard: { alignItems: 'center', padding: 32, borderRadius: 36, borderWidth: 1, marginBottom: 20 },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 50 },
  avatarInitial: { fontSize: 44, fontWeight: '900' },
  profileName: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  profileEmail: { fontSize: 14, marginBottom: 16 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  roleText: { color: NEON, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  
  profileStats: { flexDirection: 'row', padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 20 },
  profileStatItem: { flex: 1, alignItems: 'center' },
  profileStatNum: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  profileStatLabel: { fontSize: 11, fontWeight: '600' },
  profileStatDivider: { width: 1, height: '100%' },
  
  profileActions: { borderRadius: 32, borderWidth: 1, overflow: 'hidden' },
  profileActionRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1 },
  profileActionLast: { borderBottomWidth: 0 },
  profileActionIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  profileActionText: { flex: 1, fontSize: 16, fontWeight: '700' },
});
