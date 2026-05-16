import React from 'react';
import { X, AlertTriangle, Calendar, Clock, FileText, Image as ImageIcon, ExternalLink, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ViewEmergencyRequestModal = ({ isOpen, onClose, request, eventTitle, onCancelRequest }) => {
    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#111114] w-full max-w-lg rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Chi tiết yêu cầu khẩn cấp</h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate">Sự kiện: {eventTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-400">Loại yêu cầu</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            request.request_type === 'cancel' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                            {request.request_type === 'cancel' ? 'Hủy bỏ sự kiện' : 'Dời lịch thi đấu'}
                        </span>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-tight text-gray-500 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Lý do từ BTC
                        </label>
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5 text-sm font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed">
                            "{request.reason}"
                        </div>
                    </div>

                    {/* New Schedule (if reschedule) */}
                    {request.request_type === 'reschedule' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-3 h-3 text-blue-500" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase">Bắt đầu mới</span>
                                    </div>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">
                                        {request.new_date ? format(new Date(request.new_date), 'dd/MM/yyyy') : 'N/A'}
                                    </p>
                                    <p className="text-[11px] font-bold text-blue-600 mt-1">{request.new_time || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-3 h-3 text-purple-500" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase">Kết thúc mới</span>
                                    </div>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">
                                        {request.new_end_date ? format(new Date(request.new_end_date), 'dd/MM/yyyy') : 'N/A'}
                                    </p>
                                    <p className="text-[11px] font-bold text-purple-600 mt-1">{request.new_end_time || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Evidence */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-tight text-gray-500 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" /> Minh chứng đính kèm ({request.evidence_urls?.length || 0})
                        </label>
                        {request.evidence_urls && request.evidence_urls.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {request.evidence_urls.map((url, idx) => (
                                    <div 
                                        key={idx}
                                        className="group relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black cursor-pointer shadow-sm"
                                        onClick={() => window.open(url, '_blank')}
                                    >
                                        <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ExternalLink className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-center">
                                <p className="text-xs text-gray-400 italic">Không có minh chứng đính kèm</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-xl font-black uppercase text-[10px] hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                        >
                            Đóng
                        </button>
                        <button
                            onClick={() => {
                                onCancelRequest();
                                onClose();
                            }}
                            className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Rút lại yêu cầu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewEmergencyRequestModal;
