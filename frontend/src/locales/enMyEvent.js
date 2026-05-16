const enMyEvent = {
  header: {
    title: "My Tickets",
    subtitle: "Manage your NFT ticket collection and experience top events with Polygon Blockchain security system.",
    error_loading: "Failed to load tickets.",
    error_not_owner: "You no longer own this ticket.",
    error_invalid_auth: "Ticket not available for verification.",
    error_get_qr: "Failed to get QR code.",
    scan_success: "Excellent! Your ticket has been verified successfully."
  },
  stats: {
    total: "Total Owned",
    upcoming: "Upcoming",
    transferred: "Transferred",
    sold: "Tickets Sold"
  },
  controls: {
    search_placeholder: "Search your journey...",
    filter_date_label: "Filter by date"
  },
  tabs: {
    all: "All Tickets",
    upcoming: "Upcoming",
    past: "History",
    reselling: "Marketplace",
    transferred: "Transferred",
    sold: "Sold",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled"
  },
  status: {
    available: "Available",
    scanned: "Scanned",
    cancelled: "Cancelled",
    reselling: "On Marketplace",
    transferred: "Transferred",
    sold: "Sold",
    history: "Collection History"
  },
  labels: {
    tier: "Tier",
    location: "Location / Area",
    general_area: "General Area",
    ticket_no: "Ticket No.",
    nft_price: "NFT Price",
    nft_id: "NFT ID"
  },
  buttons: {
    write_blog: "Write blog",
    transfer: "Transfer",
    resale: "Resale",
    locked: "Locked",
    listed: "Listed",
    edit_listing: "Edit Listing",
    use_ticket: "Use Ticket",
    view_scan_history: "View scan history",
    view_nft: "View NFT Details",
    view_event: "View Event"
  },
  confirm_cancel_listing: "Are you sure you want to cancel this listing? The ticket will be unlocked for normal use.",
  cancel_listing_success: "Listing cancelled successfully.",
  update_price_success: "Price updated successfully.",
  edit_modal: {
    title: "Post Management",
    subtitle: "What action would you like to perform for this listing?",
    cancel_title: "Cancel Listing",
    cancel_desc: "Remove from marketplace and unlock for use.",
    update_price_title: "Update Price",
    update_price_desc: "Change the asking price of this ticket.",
    new_price_label: "New Asking Price (VNĐ)",
    save_btn: "Update Price",
    back_btn: "Back"
  },
  security: {
    polygon: "Polygon Secured",
    verification: "Blockchain Verification"
  },
  empty: {
    title: "No Imprints Yet",
    desc: "Your repository currently has no assets matching these criteria.",
    btn: "Explore Events Now"
  },
  qr_modal: {
    title: "NFT Gate Security Active",
    expired: "Code Expired",
    expired_desc: "Please re-issue a new QR code for verification.",
    refresh_btn: "Re-issue New Code",
    countdown: "Token self-destructs in",
    disclaimer: "NFT assets are verified by BASTICKET. Please present the code at the official ticket gate.",
    success_title: "VERIFICATION SUCCESSFUL",
    success_subtitle: "Enjoy your amazing event experience!"
  }
};

export default enMyEvent;
