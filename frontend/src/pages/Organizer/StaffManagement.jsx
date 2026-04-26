import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Check,
    Download,
    ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { staffService } from '../../services/staff.service';
import { organizerService } from '../../services/organizer.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

const StaffManagement = () => {
    const navigate = useNavigate();
    const [staffs, setStaffs] = useState([]); // Grouped staff
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (selectedStaff) {
                // Update mode
                await staffService.updateStaff(selectedStaff.id, formData);
                toast.success('Cập nhật nhân viên thành công');
            } else {
                // Create mode
                await staffService.createStaff(formData);
                toast.success('Thêm nhân viên thành công');
            }
            setIsAddModalOpen(false);
            setFormData({ full_name: '', email: '', phone_number: '', password: '', event_ids: [] });
            setSelectedStaff(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Thao tác thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        try {
            if (filteredStaffs.length === 0) {
                toast.error('Không có dữ liệu để xuất');
                return;
            }

            toast.loading('Đang chuẩn bị báo cáo...', { id: 'export-staff' });

            const dataToExport = filteredStaffs.map((item, index) => ({
                'STT': index + 1,
                'Họ và tên': item.staff.full_name || 'N/A',
                'Email': item.staff.email || 'N/A',
                'Số điện thoại': item.staff.phone_number || 'N/A',
                'Sự kiện đảm nhiệm': item.events.map(e => e.title).join(', '),
                'Trạng thái': item.staff.status === 'active' ? 'Hoạt động' : 'Đã khóa',
                'Ngày gia nhập': format(new Date(item.staff.created_at), 'dd/MM/yyyy HH:mm')
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách nhân viên');

            // Adjust column widths
            const wscols = [
                { wch: 5 },  // STT
                { wch: 25 }, // Họ và tên
                { wch: 30 }, // Email
                { wch: 15 }, // Số điện thoại
                { wch: 50 }, // Sự kiện
                { wch: 15 }, // Trạng thái
                { wch: 20 }, // Ngày gia nhập
            ];
            worksheet['!cols'] = wscols;

            const fileName = `Bao_cao_nhan_vien_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            toast.success('Xuất báo cáo thành công!', { id: 'export-staff' });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Có lỗi xảy ra khi xuất báo cáo', { id: 'export-staff' });
        }
    };

    const handleViewDetail = (item) => {
        navigate(`/organizer/staff/${item.id}`);
    };

    const openEditModal = (item) => {
        setSelectedStaff(item);
        setFormData({
            full_name: item.staff.full_name || '',
            phone_number: item.staff.phone_number || '',
            email: item.staff.email || '',
            password: '',
            event_ids: item.events.map(e => e.id)
        });
        setIsAddModalOpen(true);
    };

    const toggleEventSelection = (eventId) => {
        setFormData(prev => {
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
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-base md:text-xl font-black text-gray-900 dark:text-white uppercase">
                        Quản lý đội ngũ nhân viên
                    </h1>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <p className="text-blue-600 font-bold text-xs ">
                            {staffs.length} nhân viên đang hỗ trợ vận hành
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        Xuất báo cáo
                    </button>
                    <button 
                        onClick={() => {
                            setSelectedStaff(null);
                            setFormData({ full_name: '', email: '', phone_number: '', password: '', event_ids: [] });
                            setIsAddModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-700 active:scale-95"
                    >
                        Thêm nhân viên
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Tổng nhân viên', value: staffs.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                    { label: 'Đang hoạt động', value: staffs.filter(s => s.staff.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Tài khoản khóa', value: staffs.filter(s => s.staff.status !== 'active').length, icon: ShieldOff, color: 'text-red-500', bg: 'bg-red-500/10' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111114] p-4 rounded-2xl md:rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500 leading-none mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Container */}
            <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-xl">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative group border border-gray-200 dark:border-white/5 rounded-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Tìm theo tên, email, sự kiện..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-[#1a1a1e] border border-transparent focus:bg-white dark:focus:bg-[#111114] border-gray-200 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all dark:text-white placeholder-gray-500"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex items-center bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3 min-w-[180px]">
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent border-none focus:outline-none focus:ring-0 font-black text-[11px] dark:text-white appearance-none pr-4 cursor-pointer w-full"
                                >
                                    <option value="all" className="dark:bg-[#1a1a1e] dark:text-white">Tất cả trạng thái</option>
                                    <option value="active" className="dark:bg-[#1a1a1e] dark:text-white">Đang hoạt động</option>
                                    <option value="inactive" className="dark:bg-[#1a1a1e] dark:text-white">Đã khóa</option>
                                </select>
                            </div>
                            <div className="relative flex items-center bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3">
                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                <input 
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="bg-transparent border-none focus:outline-none focus:ring-0 font-bold text-xs dark:text-white cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto relative">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/5">
                                <th className="px-6 py-4 text-left text-[] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Nhân viên</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Sự kiện đảm nhiệm</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Ngày gia nhập</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-6"><div className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredStaffs.length > 0 ? (
                                filteredStaffs.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 font-black text-xs uppercase shadow-sm ring-2 ring-gray-50 dark:ring-white/5">
                                                    {item.staff.full_name ? item.staff.full_name[0] : (item.staff.email[0])}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{item.staff.full_name || 'Staff User'}</p>
                                                    <div className="flex items-center text-[10px] font-bold text-gray-500 mt-0.5">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {item.staff.email}
                                                    </div>
                                                    <div className="flex items-center text-[9px] font-black text-blue-500 mt-0.5">
                                                        <Phone className="w-2.5 h-2.5 mr-1" />
                                                        {item.staff.phone_number}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                                                {item.events.map((ev, idx) => (
                                                    <div key={idx} className="w-fit flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-white/5">
                                                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 tracking-tight">
                                                            {ev.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[11px] font-black text-gray-900 dark:text-white">
                                                {format(new Date(item.staff.created_at), 'dd/MM/yyyy HH:mm')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                    item.staff.status === 'active' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                    {item.staff.status === 'active' ? (
                                                        <><CheckCircle2 className="w-3 h-3" /> Hoạt động</>
                                                    ) : (
                                                        <><ShieldOff className="w-3 h-3" /> Đã khóa</>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => handleViewDetail(item)}
                                                    className="p-2 hover:bg-blue-600/10 text-blue-600 rounded-xl transition-all active:scale-90"
                                                    title="Chi tiết"
                                                >
                                                    <Eye className="w-4.5 h-4.5" />
                                                </button>
                                                <button 
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 hover:bg-amber-600/10 text-amber-600 rounded-xl transition-all active:scale-90"
                                                    title="Sửa"
                                                >
                                                    <Edit3 className="w-4.5 h-4.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleLock(item)}
                                                    className={`p-2 rounded-xl transition-all active:scale-90 ${
                                                        item.staff.status === 'active'
                                                            ? 'text-red-500 hover:bg-red-500/10'
                                                            : 'text-emerald-500 hover:bg-emerald-500/10'
                                                    }`}
                                                    title={item.staff.status === 'active' ? 'Khóa' : 'Mở'}
                                                >
                                                    {item.staff.status === 'active' ? <ShieldOff className="w-4.5 h-4.5" /> : <Shield className="w-4.5 h-4.5" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-24 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">
                                        Không tìm thấy nhân viên nào phù hợp
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals Implementations */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => !isSubmitting && setIsAddModalOpen(false)}></div>
                    <div className="flex min-h-full items-center justify-center p-4 md:p-10">
                        <div className="relative bg-white dark:bg-[#111114] w-full max-w-3xl rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                            <div className="p-4 md:px-10 md:py-3 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#111114] z-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase">
                                        {selectedStaff ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-blue-600">
                                        {selectedStaff ? 'Hiệu chỉnh tài khoản & Phân công' : 'Thiết lập tài khoản đội ngũ'}
                                    </p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-2xl hover:scale-110 transition-all active:scale-90"><X className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 p-8 md:px-10 md:py-8 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <h3 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" /> THÔNG TIN TÀI KHOẢN
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">Họ và Tên (*)</label>
                                            <input required type="text" placeholder="Nguyễn Văn A" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-3.5 px-6 text-sm dark:text-white font-bold focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">Email (*)</label>
                                            <input required type="email" placeholder="staff@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-3.5 px-6 text-sm dark:text-white font-bold focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">SĐT (*)</label>
                                                <input required type="text" placeholder="091..." value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-3.5 px-6 text-sm dark:text-white font-bold focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-600 uppercase ml-1 flex items-center justify-between">
                                                    Mật khẩu {selectedStaff ? '' : '(*)'}
                                                    {selectedStaff && <span className="text-[7px] normal-case font-bold text-blue-600">Để trống nếu không đổi</span>}
                                                </label>
                                                <input required={!selectedStaff} type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/10 rounded-2xl py-3.5 px-6 text-sm dark:text-white font-bold focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <h3 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5" /> PHÂN CÔNG SỰ KIỆN
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-[#0a0a0c] rounded-[2rem] border border-gray-100 dark:border-white/10 p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-1 gap-2">
                                            {events.length > 0 ? events.map((event) => {
                                                const isSelected = formData.event_ids.includes(event.id);
                                                return (
                                                    <div 
                                                        key={event.id}
                                                        onClick={() => toggleEventSelection(event.id)}
                                                        className={`flex items-center justify-between p-2.5 rounded-[1.5rem] cursor-pointer transition-all border-2 ${
                                                            isSelected 
                                                                ? 'bg-gray-100 dark:bg-white/10 border-transparent shadow-sm' 
                                                                : 'bg-white dark:bg-white/5 border-transparent text-gray-500 dark:text-white/40 hover:border-blue-600/30'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-gray-100 dark:bg-white/5 text-gray-400`}>
                                                                {event.image_url ? (
                                                                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Calendar className="w-5 h-5" />
                                                                )}
                                                            </div>
                                                            <span className={`text-[11px] font-black ${isSelected ? 'text-gray-900 dark:text-white' : ''}`}>
                                                                {event.title}
                                                            </span>
                                                        </div>
                                                        {isSelected && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20"><Check className="w-3 h-3 text-white" /></div>}
                                                    </div>
                                                );
                                            }) : (
                                                <div className="text-center py-10 text-[10px] font-bold text-gray-400 italic uppercase">Bạn chưa có sự kiện nào</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                <button type="submit" disabled={isSubmitting || formData.event_ids.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4.5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedStaff ? <ShieldCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)} 
                                    {selectedStaff ? 'Lưu thay đổi & Cập nhật' : 'Xác nhận & Thêm mới'}
                                </button>
                                {formData.event_ids.length === 0 && (
                                    <p className="text-[10px] text-red-500 font-bold text-center mt-4 animate-pulse">
                                        Vui lòng chọn ít nhất một sự kiện
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            )}

            {/* 2. Detail Modal (REMOVED) */}

        </div>
    );
};

export default StaffManagement;
