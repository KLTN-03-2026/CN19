import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserPlus, 
    Search, 
    MoreVertical, 
    Shield, 
    ShieldOff, 
    Mail, 
    Phone, 
    Calendar,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { staffService } from '../../services/staff.service';
import { organizerService } from '../../services/organizer.service';
import toast from 'react-hot-toast';

const StaffManagement = () => {
    const [staffs, setStaffs] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        email: '',
        phone_number: '',
        password: '',
        event_id: ''
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
            setStaffs(staffRes.data || []);
            setEvents(eventRes.data || []);
        } catch (error) {
            toast.error('Không thể tải dữ liệu nhân viên');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLockStaff = async (staffId, currentStatus) => {
        try {
            await staffService.lockStaff(staffId);
            toast.success(currentStatus === 'active' ? 'Đã khóa tài khoản nhân viên' : 'Đã mở khóa tài khoản');
            fetchData(); // Refresh list
        } catch (error) {
            toast.error('Thực hiện thao tác thất bại');
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await staffService.createStaff(formData);
            toast.success('Thêm nhân viên mới thành công');
            setIsModalOpen(false);
            setFormData({ email: '', phone_number: '', password: '', event_id: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Không thể thêm nhân viên');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStaffs = staffs.filter(s => 
        s.staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#111114] p-8 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                            Quản lý <span className="text-blue-600">Nhân viên</span>
                        </h1>
                        <p className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mt-1">
                            {staffs.length} nhân viên đang hoạt động trong hệ thống
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] transform hover:scale-105 active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Thêm nhân viên mới
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm theo email hoặc sự kiện..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/[0.01]">
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Thông tin nhân viên</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Sự kiện phụ trách</th>
                                <th className="px-8 py-6 text-center text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Trạng thái</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-8 py-6">
                                            <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-2xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredStaffs.length > 0 ? (
                                filteredStaffs.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 font-black text-xs">
                                                    {item.staff.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{item.staff.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-[11px] font-bold text-gray-400 dark:text-white/30">{item.staff.phone_number || 'Chưa cập nhật'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-black text-gray-700 dark:text-white/60 uppercase tracking-tighter italic">
                                                    {item.event.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    item.staff.status === 'active' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                    {item.staff.status === 'active' ? (
                                                        <><CheckCircle2 className="w-3 h-3" /> Hoạt động</>
                                                    ) : (
                                                        <><AlertCircle className="w-3 h-3" /> Đã khóa</>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => handleLockStaff(item.staff.id, item.staff.status)}
                                                className={`p-3 rounded-xl transition-all ${
                                                    item.staff.status === 'active'
                                                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                                        : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                                }`}
                                                title={item.staff.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                            >
                                                {item.staff.status === 'active' ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-6 rounded-full bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/10">
                                                <Users className="w-16 h-16" />
                                            </div>
                                            <p className="text-lg font-black text-gray-400 dark:text-white/20 uppercase tracking-tighter italic">
                                                Không tìm thấy nhân viên nào
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add Staff */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-0">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => !isSubmitting && setIsModalOpen(false)}
                    ></div>
                    
                    <div className="relative bg-white dark:bg-[#111114] w-full max-w-xl rounded-[3rem] border border-gray-200 dark:border-white/5 shadow-2x animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                                        <UserPlus className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none">Thêm nhân viên mới</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{t('org.setup_acc') || 'Tài khoản nhân viên'}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-2xl transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateStaff} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] ml-4 mb-2 block">Địa chỉ Email (*)</label>
                                        <input 
                                            required
                                            type="email" 
                                            placeholder="Ex: staff@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] ml-4 mb-2 block">Số điện thoại (*)</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="Ex: 0912345678"
                                                value={formData.phone_number}
                                                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all dark:text-white"
                                            />
                                        </div>
                                        <div className="relative">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] ml-4 mb-2 block">Mật khẩu (*)</label>
                                            <input 
                                                required
                                                type="password" 
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] ml-4 mb-2 block">Gán cho sự kiện (*)</label>
                                        <select 
                                            required
                                            value={formData.event_id}
                                            onChange={(e) => setFormData({...formData, event_id: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all dark:text-white appearance-none cursor-pointer"
                                        >
                                            <option value="">-- Chọn sự kiện để quản lý --</option>
                                            {events.map((event) => (
                                                <option key={event.id} value={event.id}>{event.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...</>
                                        ) : (
                                            <><UserPlus className="w-5 h-5" /> Xác nhận thêm nhân viên</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
