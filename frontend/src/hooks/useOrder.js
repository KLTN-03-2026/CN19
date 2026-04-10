import { useMutation, useQuery } from '@tanstack/react-query';
import orderService from '../services/order.service';
import Cookies from 'js-cookie';

export const orderKeys = {
    all: ['orders'],
    list: (page) => [...orderKeys.all, { page }],
    detail: (code) => [...orderKeys.all, code],
};

export const useOrder = () => {
    const createPaymentUrlMutation = useMutation({
        mutationFn: ({ ma_don_hang, phuong_thuc }) => 
            orderService.createPaymentUrl(ma_don_hang, phuong_thuc),
    });

    const verifyVNPayReturnMutation = useMutation({
        mutationFn: (params) => orderService.verifyVNPayReturn(params),
    });

    return {
        createPaymentUrl: createPaymentUrlMutation.mutateAsync,
        isCreatingPaymentUrl: createPaymentUrlMutation.isPending,
        verifyVNPayReturn: verifyVNPayReturnMutation.mutateAsync,
        isVerifying: verifyVNPayReturnMutation.isPending,
    };
};

export const useOrderHistory = (page = 1) => {
    return useQuery({
        queryKey: orderKeys.list(page),
        queryFn: () => orderService.getOrders(page),
        enabled: !!Cookies.get('token'),
    });
};

export const useOrderDetails = (code) => {
    return useQuery({
        queryKey: orderKeys.detail(code),
        queryFn: () => orderService.getOrderById(code),
        enabled: !!code && !!Cookies.get('token'),
    });
};
