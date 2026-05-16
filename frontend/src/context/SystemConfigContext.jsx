import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SystemConfigContext = createContext();

export const SystemConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        site_name: 'BASTICKET',
        support_email: 'support@basticket.com',
        maintenance_mode: 'false'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/system/config');
                if (res.data && res.data.data) {
                    setConfig(res.data.data);
                    
                    // Nếu đang bảo trì và không phải ở trang admin/login
                    const isMaintenance = res.data.data.maintenance_mode === 'true';
                    const isAllowedPath = window.location.pathname.startsWith('/admin') || 
                                        window.location.pathname.startsWith('/login');
                    
                    if (isMaintenance && !isAllowedPath) {
                        // Có thể dùng flag để render trang bảo trì thay vì redirect
                    }
                }
            } catch (error) {
                if (error.response && error.response.status === 503) {
                    // Xử lý lỗi 503 từ middleware bảo trì
                    setConfig(prev => ({ ...prev, maintenance_mode: 'true' }));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return (
        <SystemConfigContext.Provider value={{ config, loading, setConfig }}>
            {children}
        </SystemConfigContext.Provider>
    );
};

export const useSystemConfig = () => {
    const context = useContext(SystemConfigContext);
    if (!context) {
        throw new Error('useSystemConfig must be used within a SystemConfigProvider');
    }
    return context;
};
