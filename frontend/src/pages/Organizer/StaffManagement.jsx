import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserPlus, 
    Search, 
    Shield, 
    ShieldOff, 
    Mail, 
    Phone, 
    Calendar,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Eye,
    Edit3,
    Filter,
    User,
    ChevronRight,
    MapPin,
    Lock,
    Check
} from 'lucide-react';
import { staffService } from '../../services/staff.service';
import { organizerService } from '../../services/organizer.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

const StaffManagement = () => {
    const [staffs, setStaffs] = useState([]); // Grouped staff
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    
    // Form States
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        password: '',
        event_id: ''
    });
    const [editData, setEditData] = useState({
        full_name: '',
        phone_number: '',
        email: '',
        password: '',
        event_ids: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [staffRes, eventRes] = await Promise.all([
                staffService.getStaffs(),
                organizerService.getMyEvents()
            ]);
            
            // Group assignments by staff ID
            const rawAssignments = staffRes.data || [];
            const grouped = rawAssignments.reduce((acc, curr) => {
                const staffId = curr.staff.id;
                if (!acc[staffId]) {
                    acc[staffId] = {
                        id: staffId,
                        staff: curr.staff,
                        events: [curr.event],
                        created_at: curr.staff.created_at
                    };
                } else {
                    if (!acc[staffId].events.find(e => e.id === curr.event.id)) {
                        acc[staffId].events.push(curr.event);
                    }
                }
                return acc;
            }, {});

            setStaffs(Object.values(grouped));
            setEvents(eventRes.data || []);
        } catch (error) {
            toast.error('Không thể tải dữ liệu nhân viên');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleLock = async (item) => {
        const { staff } = item;
        const action = staff.status === 'active' ? 'KHÓA' : 'MỞ KHÓA';
        const confirmed = window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản này?`);
        
        if (confirmed) {
            try {
                await staffService.lockStaff(staff.id);
                toast.success(`Đã ${action.toLowerCase()} thành công`);
                fetchData();
            } catch (error) {
                toast.error('Thao tác thất bại');
            }
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await staffService.createStaff(formData);
            toast.success('Thao tác thành công');
            setIsAddModalOpen(false);
            setFormData({ full_name: '', email: '', phone_number: '', password: '', event_id: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Không thể thực hiện');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await staffService.updateStaff(selectedStaff.id, editData);
            toast.success('Cập nhật nhân viên và phân công thành công');
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Cập nhật thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openViewModal = (item) => {
        setSelectedStaff(item);
        setIsViewModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedStaff(item);
        setEditData({
            full_name: item.staff.full_name || '',
            phone_number: item.staff.phone_number || '',
            email: item.staff.email || '',
            password: '',
            event_ids: item.events.map(e => e.id)
        });
        setIsEditModalOpen(true);
    };

    const toggleEventSelection = (eventId) => {
        setEditData(prev => {
            const currentIds = prev.event_ids;
            if (currentIds.includes(eventId)) {
                return { ...prev, event_ids: currentIds.filter(id => id !== eventId) };
            } else {
                return { ...prev, event_ids: [...currentIds, eventId] };
            }
        });
    };

    const filteredStaffs = staffs.filter(s => {
        const matchesSearch = 
            s.staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.staff.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.events.some(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || s.staff.status === statusFilter;
        
        const matchesDate = !dateFilter || format(new Date(s.staff.created_at), 'yyyy-MM-dd') === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#111114] p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                            Quản lý <span className="text-blue-600">Nhân viên</span>
                        </h1>
                        <p className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mt-1">
                            {staffs.length} nhân viên trong đội ngũ của bạn
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] transform hover:scale-105 active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Thêm nhân viên mới
                </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white dark:bg-[#111114] p-4 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-md">
                <div className="lg:col-span-5 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo Tên, Email hoặc Sự kiện..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 dark:text-white font-medium"
                    />
                </div>
                <div className="lg:col-span-3 relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 dark:text-white font-bold appearance-none cursor-pointer"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Đã khóa</option>
                    </select>
                </div>
                <div className="lg:col-span-4 relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 dark:text-white font-medium cursor-pointer"
                    />
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-[#111114] rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/[0.01]">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Nhân viên</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Sự kiện đảm nhiệm</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Ngày gia nhập</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Trạng thái</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-6"><div className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredStaffs.length > 0 ? (
                                filteredStaffs.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 font-black text-xs uppercase">
                                                    {item.staff.full_name ? item.staff.full_name[0] : (item.staff.email[0])}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{item.staff.full_name || 'Staff User'}</p>
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-bold text-gray-400 lowercase italic">{item.staff.email}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Phone className="w-2.5 h-2.5 text-blue-500" />
                                                            <p className="text-[10px] font-black text-gray-500 italic">{item.staff.phone_number}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-2 max-w-[300px]">
                                                {item.events.map((ev, idx) => (
                                                    <div key={idx} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-600/10 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-600/20">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                                        <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase italic tracking-tighter truncate max-w-[120px]">
                                                            {ev.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-xs font-bold text-gray-500 dark:text-white/40">
                                                {format(new Date(item.staff.created_at), 'dd/MM/yyyy', { locale: vi })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    item.staff.status === 'active' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                    {item.staff.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openViewModal(item)}
                                                    className="p-2.5 bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-blue-600 hover:bg-blue-600/10 rounded-xl transition-all"
                                                    title="Chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2.5 bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-amber-600 hover:bg-amber-600/10 rounded-xl transition-all"
                                                    title="Sửa"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleLock(item)}
                                                    className={`p-2.5 rounded-xl transition-all ${
                                                        item.staff.status === 'active'
                                                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-lg shadow-emerald-500/20'
                                                    }`}
                                                    title={item.staff.status === 'active' ? 'Khóa' : 'Mở'}
                                                >
                                                    {item.staff.status === 'active' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold uppercase text-xs italic tracking-widest">
                                        Không tìm thấy nhân viên nào phù hợp
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals Implementations */}
            {/* 1. Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => !isSubmitting && setIsAddModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#111114] w-full max-w-xl rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Thêm nhân viên mới</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl"><X className="w-5 h-5"/></button>
                            </div>
                            <form onSubmit={handleCreateStaff} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và Tên (*)</label>
                                    <input required type="text" placeholder="Nguyễn Văn A" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold focus:ring-2 focus:ring-blue-600/20" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (*)</label>
                                    <input required type="email" placeholder="staff@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold focus:ring-2 focus:ring-blue-600/20" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SĐT (*)</label>
                                        <input required type="text" placeholder="091..." value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold focus:ring-2 focus:ring-blue-600/20" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu (*)</label>
                                        <input required type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold focus:ring-2 focus:ring-blue-600/20" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sự kiện (*)</label>
                                    <select required value={formData.event_id} onChange={(e) => setFormData({...formData, event_id: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold appearance-none cursor-pointer">
                                        <option value="">Chọn sự kiện...</option>
                                        {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                                    </select>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Xác nhận ngay
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Detail Modal */}
            {isViewModalOpen && selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#111114] w-full max-w-lg rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                        <div className="p-10">
                            <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] flex items-center justify-center text-blue-600 text-3xl font-black">
                                    {selectedStaff.staff.full_name?.[0] || 'U'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic">{selectedStaff.staff.full_name}</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Thông tin nhân viên</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6 bg-gray-50 dark:bg-white/[0.02] p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                                        <p className="text-sm font-bold dark:text-white">{selectedStaff.staff.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Phone className="w-5 h-5 text-blue-600" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Điện thoại</p>
                                        <p className="text-sm font-bold dark:text-white">{selectedStaff.staff.phone_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Ngày gia nhập</p>
                                        <p className="text-sm font-bold dark:text-white">{format(new Date(selectedStaff.staff.created_at), 'PPPP', { locale: vi })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Sự kiện phụ trách</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedStaff.events.map((ev, i) => (
                                                <span key={i} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase italic">
                                                    {ev.title}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Trạng thái tài khoản</p>
                                        <p className={`text-xs font-black uppercase ${selectedStaff.staff.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {selectedStaff.staff.status === 'active' ? 'Đang hoạt động' : 'Đã bị khóa'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setIsViewModalOpen(false)} className="w-full mt-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-widest rounded-2xl">Đóng cửa sổ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Edit Modal */}
            {isEditModalOpen && selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-10">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isSubmitting && setIsEditModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#111114] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#111114] z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-600/10 rounded-xl flex items-center justify-center text-amber-600">
                                    <Edit3 className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Cập nhật & Phân công</h2>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl transition-colors hover:bg-gray-200 dark:hover:bg-white/10">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateStaff} className="flex-1 overflow-y-auto p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side: Account Info */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <User className="w-3 h-3" /> THÔNG TIN TÀI KHOẢN
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và Tên</label>
                                            <input required type="text" value={editData.full_name} onChange={(e) => setEditData({...editData, full_name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold focus:ring-2 focus:ring-amber-600/20" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                                            <input required type="email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold focus:ring-2 focus:ring-amber-600/20" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                                <input required type="text" value={editData.phone_number} onChange={(e) => setEditData({...editData, phone_number: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold focus:ring-2 focus:ring-amber-600/20" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    Mật khẩu mới <span className="text-[8px] normal-case font-bold text-amber-500">(Để trống nếu không đổi)</span>
                                                </label>
                                                <div className="relative">
                                                    <input type="password" placeholder="••••••••" value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-sm dark:text-white font-bold focus:ring-2 focus:ring-amber-600/20" />
                                                    <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Event Assignment */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> PHÂN CÔNG SỰ KIỆN
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-[#0a0a0c] rounded-3xl border border-gray-100 dark:border-white/10 p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-1 gap-2">
                                            {events.length > 0 ? events.map((event) => {
                                                const isSelected = editData.event_ids.includes(event.id);
                                                return (
                                                    <div 
                                                        key={event.id}
                                                        onClick={() => toggleEventSelection(event.id)}
                                                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                                                            isSelected 
                                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                                                : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-600 dark:text-white/60 hover:border-blue-600/50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5'}`}>
                                                                <Calendar className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                                                            </div>
                                                            <span className="text-xs font-black uppercase tracking-tighter truncate max-w-[200px]">
                                                                {event.title}
                                                            </span>
                                                        </div>
                                                        {isSelected && <Check className="w-4 h-4" />}
                                                    </div>
                                                );
                                            }) : (
                                                <div className="text-center py-10 text-[10px] font-bold text-gray-400 italic uppercase">Bạn chưa có sự kiện nào</div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 italic text-center px-4">
                                        Chọn các sự kiện mà nhân viên này sẽ phụ trách soát vé. Nhân viên có thể kiêm nhiệm nhiều sự kiện cùng lúc.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || editData.event_ids.length === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/30 transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />} 
                                    Xác nhận cập nhật & Phân công ({editData.event_ids.length})
                                </button>
                                {editData.event_ids.length === 0 && (
                                    <p className="text-[10px] text-red-500 font-bold text-center mt-3 animate-pulse uppercase tracking-wider">
                                        Vui lòng chọn ít nhất một sự kiện để phụ trách
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
