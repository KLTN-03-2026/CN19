import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Heart, Loader2 } from 'lucide-react';
import blogService from '../../services/blog.service';
import { useTranslation } from 'react-i18next';

const LikersModal = ({ id, type = 'blog', onClose }) => {
    const { t } = useTranslation();

    const { data: likers = [], isLoading } = useQuery({
        queryKey: ['likers', type, id],
        queryFn: () => type === 'blog' ? blogService.getLikers(id) : blogService.getCommentLikers(id),
        select: (res) => res.data
    });

    const getRoleSubtitle = (role) => {
        switch(role) {
            case 'admin': return 'Quản trị viên';
            case 'organizer': return 'Ban tổ chức';
            case 'staff': return 'Nhân viên';
            default: return 'Bản tin xã hội';
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-[360px] bg-[#121214] rounded-[1.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-base font-black text-white tracking-tight">
                        {t('reviews.viewLikers', 'Xem lượt thích')}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors group"
                    >
                        <X className="w-4 h-4 text-gray-500 group-hover:text-white" />
                    </button>
                </div>

                {/* List */}
                <div className="max-h-[380px] overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('common.loading', 'Đang tải...')}</p>
                        </div>
                    ) : likers.length > 0 ? (
                        <div className="space-y-0.5">
                            {likers.map((user) => (
                                <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                                    <div className="relative">
                                        <img 
                                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=111&color=fff`} 
                                            className="w-10 h-10 rounded-full border border-white/10 object-cover group-hover:scale-105 transition-transform"
                                            alt={user.full_name}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-[13px] text-white truncate group-hover:text-neon-green transition-colors">
                                            {user.full_name}
                                        </p>
                                        <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                                            {getRoleSubtitle(user.role)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center flex flex-col items-center gap-3">
                            <Heart className="w-8 h-8 text-gray-800" />
                            <p className="text-gray-500 font-bold uppercase text-[9px] tracking-widest">
                                {t('reviews.noLikers', 'Chưa có lượt thích nào')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
};

export default LikersModal;
