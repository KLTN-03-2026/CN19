const enMyRevenue = {
    revenue: {
        title: "Revenue Overview",
        subtitle: "My Finance",
        withdraw_button: "Withdraw Now",
        stats: {
            total_revenue: "Total Revenue",
            available_balance: "Available Balance",
            pending_revenue: "Pending Processing",
            total_withdrawn: "Total Withdrawn",
            balance: "Available Balance"
        },
        chart: {
            title: "Revenue Distribution",
            no_data: "No financial data available",
            available: "Available",
            pending: "Pending",
            withdrawn: "Withdrawn"
        },
        tabs: {
            sold_orders: "Sold Orders",
            withdraw_bank: "Withdrawal & Banking"
        },
        table: {
            title: "Sold Tickets List",
            event_ticket: "Event / Ticket",
            buyer: "Buyer",
            price: "Price",
            commission: "Commission Received",
            status: "Status",
            time: "Time",
            details: "Details",
            status_settled: "In Wallet",
            status_pending: "Pending Event",
            no_orders: "No orders have been sold yet"
        },
        withdrawal: {
            title: "Withdrawal Request",
            available_balance: "Available Balance",
            available_balance_label: "Available Balance:",
            amount_label: "Withdrawal Amount (VND)",
            amount_placeholder: "Enter amount...",
            confirm_btn: "Confirm Withdrawal",
            processing: "Processing..."
        },
        bank: {
            title: "Beneficiary Information",
            label_bank: "Bank",
            label_account: "Account Number",
            label_holder: "Account Holder",
            change_info: "Change Information",
            bank_name_placeholder: "e.g. Vietcombank, HSBC...",
            account_placeholder: "Enter account number...",
            holder_placeholder: "Uppercase without accents (e.g. NGUYEN VAN A)",
            save_btn: "Save Information",
            cancel_btn: "Cancel"
        },
        messages: {
            validation_error: "Please enter all beneficiary information!",
            update_success: "Bank information updated successfully!",
            update_error: "Error updating information",
            min_withdrawal: "Minimum withdrawal amount is 100,000 VND",
            insufficient_balance: "Insufficient balance",
            withdrawal_requested: "Withdrawal request has been sent!",
            error_withdrawal: "Error requesting withdrawal"
        },
        modal: {
            transaction_id: "Transaction ID",
            buyer_info: "Buyer",
            ticket_type: "Ticket Type",
            status_label: "Settlement Status",
            buyer_pay: "Buyer paid amount:",
            platform_fee: "(-) Platform Fee",
            royalty_fee: "(-) Royalty Fee",
            net_profit: "NET PROFIT:",
            close_btn: "CLOSE DETAILS"
        }
    }
};

export default enMyRevenue;
