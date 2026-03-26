import React, { useState } from 'react';
import { AlertTriangle, X, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EmergencyActionModal = ({ isOpen, onClose, onConfirm, eventTitle }) => {
    const [type, setType] = useState('reschedule'); // 'cancel' or 'reschedule'
    const [reason, setReason] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    if (!isOpen) return null;

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'video_upload');
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dihfewxuv'}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );
        
        if (!response.ok) throw new Error('Upload minh chứng thất bại');
        const data = await response.json();
        return data.secure_url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            toast.error('Vui lòng nhập lý do.');
            return;
        }
        if (type === 'reschedule' && (!newStartDate || !newStartTime || !newEndDate || !newEndTime)) {
            toast.error('Vui lòng điền đầy đủ thông tin thời gian mới.');
            return;
        }

        try {
            setIsSubmitting(true);
            let evidence_url = null;
            if (evidenceFile) {
                toast.loading('Đang tải minh chứng...', { id: 'upload' });
                evidence_url = await uploadToCloudinary(evidenceFile);
                toast.success('Tải minh chứng thành công', { id: 'upload' });
            }

            await onConfirm({ 
                request_type: type, 
                reason, 
                new_date: newStartDate,
                new_time: newStartTime,
                new_end_date: newEndDate,
                new_end_time: newEndTime,
                evidence_url 
            });
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Đã xảy ra lỗi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#111114] w-full max-w-lg rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Xử lý khẩn cấp</h2>
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter italic">Sự kiện: {eventTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Action Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setType('reschedule')}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                type === 'reschedule' 
                                ? 'border-blue-600 bg-blue-600/5 text-blue-600' 
                                : 'border-gray-100 dark:border-white/5 text-gray-400'
                            }`}
                        >
                            <Calendar className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Dời lịch</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('cancel')}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                type === 'cancel' 
                                ? 'border-red-600 bg-red-600/5 text-red-600' 
                                : 'border-gray-100 dark:border-white/5 text-gray-400'
                            }`}
                        >
                            <X className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Hủy sự kiện</span>
                        </button>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Lý do chi tiết <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-all min-h-[80px] resize-none"
                            placeholder="Tại sao bạn cần dời/hủy sự kiện này? (Bệnh, sự cố kỹ thuật, thời tiết...)"
                            required
                        />
                    </div>

                    {/* Evidence Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-600" /> Minh chứng (Hình ảnh/Tài liệu)
                        </label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setEvidenceFile(e.target.files[0])}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${
                                evidenceFile 
                                ? 'border-green-600 bg-green-600/5 text-green-600' 
                                : 'border-gray-100 dark:border-white/5 text-gray-400 group-hover:border-blue-600 group-hover:bg-blue-600/5'
                            }`}>
                                <PlusCircle className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {evidenceFile ? evidenceFile.name : 'Nhấn để chọn file minh chứng'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Reschedule Details */}
                    {type === 'reschedule' && (
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ngày bắt đầu mới</label>
                                    <input
                                        type="date"
                                        value={newStartDate}
                                        onChange={(e) => setNewStartDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Giờ bắt đầu mới</label>
                                    <input
                                        type="time"
                                        value={newStartTime}
                                        onChange={(e) => setNewStartTime(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ngày kết thúc mới</label>
                                    <input
                                        type="date"
                                        value={newEndDate}
                                        onChange={(e) => setNewEndDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Giờ kết thúc mới</label>
                                    <input
                                        type="time"
                                        value={newEndTime}
                                        onChange={(e) => setNewEndTime(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <p className="text-[9px] text-red-700 dark:text-red-400 font-bold italic leading-relaxed uppercase">
                            ⚠️ LƯU Ý: Yêu cầu này sẽ được gửi đến Admin để phê duyệt. Vé đã bán sẽ được hệ thống xử lý hoàn tiền hoặc thông báo dời lịch tự động sau khi được duyệt.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                            type === 'cancel'
                            ? 'bg-red-600 text-white shadow-red-600/20 hover:brightness-110'
                            : 'bg-blue-600 text-white shadow-blue-600/20 hover:brightness-110'
                        }`}
                    >
                        {isSubmitting ? 'Đang gửi yêu cầu...' : `Gửi yêu cầu ${type === 'cancel' ? 'hủy' : 'dời lịch'}`}
                        {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmergencyActionModal;
