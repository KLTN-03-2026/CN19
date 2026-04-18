const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');
const sendEmail = require('../utils/sendEmail');

// [UC_21] Quản lý người dùng: Lấy toàn bộ danh sách
const getUsers = async (req, res) => {
  try {
    const { role, status, keyword, kyc_status, from, to } = req.query;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    
    if (from || to) {
      whereClause.created_at = {};
      if (from) whereClause.created_at.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // Đảm bảo lọc hết ngày được chọn
        whereClause.created_at.lte = toDate;
      }
    }
    
    if (kyc_status) {
      whereClause.organizer_profile = {
        kyc_status: kyc_status
      };
    }
    if (keyword) {
      whereClause.OR = [
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone_number: { contains: keyword } }
      ];
    }

    const [users, totalCount, pendingCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          full_name: true,
          phone_number: true,
          avatar_url: true,
          role: true,
          status: true,
          created_at: true,
          organizer_profile: {
            select: { id: true, kyc_status: true, organization_name: true }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count(),
      prisma.organizer.count({ where: { kyc_status: 'pending' } })
    ]);

    res.status(200).json({ 
      data: users,
      meta: {
        total: totalCount,
        pending: pendingCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_21] Quản lý người dùng: Tạo người dùng mới (Dành cho Admin)
const createUser = async (req, res) => {
  try {
    const { email, password, phone_number, full_name, role, permissions, organization_name, address_raw, business_license, description } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại trên hệ thống.' });
    }
    // 2. Mã hóa mật khẩu
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Tạo Ví Web3 Custodial
    const randomWallet = ethers.Wallet.createRandom();

    // 4. Tạo user và organizer profile nếu cần
    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash,
        phone_number: phone_number || null,
        full_name,
        role: role || 'customer',
        permissions: role === 'admin' ? (permissions || []) : [],
        wallet_address: randomWallet.address,
        wallet_private_key: randomWallet.privateKey,
        status: 'active',
        organizer_profile: role === 'organizer' ? {
          create: {
            organization_name: organization_name || `Công ty của ${full_name || email}`,
            address_raw: address_raw || null,
            business_license: business_license || null,
            description: description || null,
            kyc_status: 'pending', // Option 2: Phải eKYC sau
            is_verified: false
          }
        } : undefined
      }
    });

    // 5. Gửi Email thông báo tài khoản & Ví mới
    try {
      const roleMap = {
        'admin': 'Quản trị viên',
        'organizer': 'Ban tổ chức',
        'staff': 'Nhân viên',
        'customer': 'Khách hàng'
      };

      const subject = `[BASTICKET] Thông tin tài khoản ${roleMap[role] || 'Thành viên'} mới`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #52c41a; margin: 0; font-size: 24px;">BASTICKET</h1>
            <p style="color: #999; margin: 5px 0;">Hệ thống quản lý vé sự kiện NFT</p>
          </div>
          <h2 style="color: #333; text-align: center;">Chào mừng bạn đến với BASTICKET!</h2>
          <p>Tài khoản của bạn đã được khởi tạo thành công bởi Quản trị viên hệ thống.</p>
          
          <div style="background: #fdfdfd; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 8px 0;"><b>📧 Email đăng nhập:</b> ${email}</p>
            <p style="margin: 8px 0;"><b>🔑 Mật khẩu tạm thời:</b> <span style="color: #ff4d4f; font-family: monospace; font-weight: bold; background: #fff1f0; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
            <p style="margin: 8px 0;"><b>👤 Vai trò:</b> <span style="color: #52c41a; font-weight: bold;">${roleMap[role] || role}</span></p>
            ${role === 'organizer' ? `<p style="margin: 8px 0;"><b>🏢 Tổ chức:</b> ${organization_name}</p>` : ''}
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;"/>
            
            <p style="margin: 5px 0; color: #666; font-size: 13px;"><b>💎 Địa chỉ Ví Web3 cá nhân:</b></p>
            <p style="word-break: break-all; font-family: monospace; font-size: 12px; color: #52c41a; background: #f6ffed; padding: 12px; border: 1px solid #b7eb8f; border-radius: 8px; margin-top: 5px;">
              ${randomWallet.address}
            </p>
            <p style="font-size: 11px; color: #999; margin-top: 8px;"><i>* Ví này dùng để quản lý vé NFT và thực hiện các giao dịch trên blockchain.</i></p>
          </div>

          <p style="font-size: 14px;">Hành động cần làm: <b>Bạn nên đăng nhập và thay đổi mật khẩu ngay để đảm bảo an toàn.</b></p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
               style="display: inline-block; padding: 14px 34px; background-color: #52c41a; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(82, 196, 26, 0.3);">
              Đăng nhập ngay
            </a>
          </div>
          
          <p style="margin-top: 40px; font-size: 12px; color: #aaa; text-align: center; line-height: 1.6;">
            Email này được gửi tự động từ hệ thống BASTICKET.<br/>
            Vui lòng không trả lời email này. Nếu có thắc mắc, hãy liên hệ bộ phận hỗ trợ.<br/>
            <b>Đội ngũ Quản trị BASTICKET</b>
          </p>
        </div>
      `;
      await sendEmail(email, subject, html);
    } catch (emailError) {
      console.error('Lỗi gửi email:', emailError);
    }

    res.status(201).json({ 
      message: 'Tạo tài khoản và Ví Web3 thành công.',
      data: { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role,
        wallet_address: newUser.wallet_address 
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi tạo người dùng.' });
  }
};

// [UC_21] Quản lý người dùng: Lấy chi tiết 360 độ (ID hoặc Organizer ID)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Thử tìm thẳng qua User ID
    let user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet_transactions: { orderBy: { created_at: 'desc' } },
        withdrawal_requests: { orderBy: { created_at: 'desc' } },
        organizer_profile: {
          include: {
            events: {
              select: { 
                id: true, 
                title: true, 
                event_date: true, 
                event_time: true,
                end_date: true,
                end_time: true,
                status: true, 
                image_url: true,
                location_address: true,
                description: true,
                category: { select: { name: true } }
              },
              orderBy: { event_date: 'desc' }
            },
            merchandise: {
              include: {
                event: { select: { title: true } },
                order_items: {
                  include: {
                    order: { select: { status: true } }
                  }
                }
              },
              orderBy: { created_at: 'desc' }
            }
          }
        },
        authored_blogs: {
          include: {
            event: { select: { title: true } }
          },
          orderBy: { created_at: 'desc' }
        },
        orders: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                event_date: true,
                event_time: true,
                image_url: true,
                location_address: true
              }
            },
            items: {
              include: {
                ticket_tier: {
                  select: {
                    tier_name: true,
                    section_name: true
                  }
                }
              }
            },
            merchandise_items: {
              include: {
                merchandise: {
                  select: {
                    name: true,
                    image_url: true
                  }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' }
          // take: 10 // Chỉ lấy 10 đơn gần nhất để tránh overload, có thể mở rộng sau
        },
        bot_logs: {
          include: {
            order: {
              select: {
                id: true,
                order_number: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
          // take: 20
        },
        owned_tickets: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                event_date: true,
                event_time: true,
                location_address: true,
                image_url: true
              }
            },
            ticket_tier: {
              select: {
                tier_name: true,
                section_name: true,
                price: true
              }
            },
            order: {
              select: {
                id: true,
                order_number: true
              }
            }
          }
        },
        listings: {
          include: {
            ticket: { select: { ticket_number: true } }
          }
        },
        buyer_transactions: {
          include: {
            ticket: { include: { event: { select: { title: true } } } },
            listing: {
               include: {
                 event: { select: { title: true } }
               }
            },
            seller: { select: { full_name: true, email: true } }
          },
          orderBy: { status: 'desc' }
        },
        comments: {
          include: {
            blog: { select: { title: true } }
          },
          orderBy: { created_at: 'desc' }
        },
        likes: {
          include: {
            blog: { select: { title: true } }
          },
          orderBy: { created_at: 'desc' }
        },
        transfers_sent: {
          include: {
            ticket: { include: { event: { select: { title: true } } } },
            receiver: { select: { full_name: true, email: true } }
          },
          orderBy: { requested_at: 'desc' }
        },
        transfers_received: {
          include: {
            ticket: { include: { event: { select: { title: true } } } },
            sender: { select: { full_name: true, email: true } }
          },
          orderBy: { requested_at: 'desc' }
        },
        seller_transactions: {
          include: {
            ticket: { include: { event: { select: { title: true } } } },
            buyer: { select: { full_name: true, email: true } }
          },
          orderBy: { status: 'desc' }
        }
      }
    });

    // Nếu không tìm thấy qua User ID, thử tìm qua Organizer ID
    if (!user) {
      const organizer = await prisma.organizer.findUnique({
        where: { id },
        select: { user_id: true }
      });

      if (organizer) {
        // Đệ quy nhẹ hoặc chỉ cần findUnique lại với user_id vừa tìm được
        user = await prisma.user.findUnique({
           where: { id: organizer.user_id },
           include: {
              organizer_profile: {
                include: {
                  events: {
                    select: { 
                      id: true, title: true, event_date: true, event_time: true,
                      end_date: true, end_time: true, status: true, image_url: true,
                      location_address: true, description: true, category: { select: { name: true } }
                    },
                    orderBy: { event_date: 'desc' }
                  },
                  merchandise: {
                    include: {
                      event: { select: { title: true } },
                      order_items: {
                        include: {
                          order: { select: { status: true } }
                        }
                      }
                    },
                    orderBy: { created_at: 'desc' }
                  }
                }
              },
              authored_blogs: {
                include: {
                  event: { select: { title: true } }
                },
                orderBy: { created_at: 'desc' }
              },
              orders: {
                include: {
                  event: {
                    select: {
                      id: true,
                      title: true,
                      event_date: true,
                      event_time: true,
                      image_url: true,
                      location_address: true
                    }
                  },
                  items: {
                    include: {
                      ticket_tier: {
                        select: {
                          tier_name: true,
                          section_name: true
                        }
                      }
                    }
                  }
                },
                orderBy: { created_at: 'desc' }
                // take: 10
              },
              bot_logs: {
                include: {
                  order: {
                    select: {
                      id: true,
                      order_number: true
                    }
                  }
                },
                orderBy: { created_at: 'desc' }
                // take: 20
              },
              owned_tickets: {
                include: {
                  event: {
                    select: {
                      id: true,
                      title: true,
                      event_date: true,
                      event_time: true,
                      location_address: true,
                      image_url: true
                    }
                  },
                  ticket_tier: {
                    select: {
                      tier_name: true,
                      section_name: true,
                      price: true
                    }
                  },
                  order: {
                    select: {
                      id: true,
                      order_number: true
                    }
                  }
                }
              },
              listings: { include: { event: { select: { title: true } }, ticket: { select: { ticket_number: true } } } },
              buyer_transactions: {
                include: {
                  ticket: { select: { ticket_number: true } },
                  listing: {
                    include: {
                      event: { select: { title: true } }
                    }
                  }
                }
              }
           }
        });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng hoặc Ban tổ chức.' });
    }

    // Không trả về private key vì lý do bảo mật
    const sensitiveData = { ...user };
    delete sensitiveData.wallet_private_key;
    delete sensitiveData.password_hash;

    // Tính toán số lượng đã bán cho sản phẩm
    if (sensitiveData.organizer_profile?.merchandise) {
      sensitiveData.organizer_profile.merchandise = sensitiveData.organizer_profile.merchandise.map(m => {
        const sold_count = (m.order_items || [])
          .filter(oi => {
            const status = (oi.order?.status || '').toLowerCase();
            return status !== '' && status !== 'cancelled' && status !== 'failed';
          })
          .reduce((sum, oi) => sum + (oi.quantity || 0), 0);
        
        // Loại bỏ order_items thô để giảm size response
        const { order_items, ...rest } = m;
        return { ...rest, sold_count };
      });
    }

    // 3. Tính toán số dư chờ quyết toán (Pending Balance)
    // Bao gồm: Doanh thu từ đơn hàng gốc (Organizer) + Doanh thu từ Marketplace (Seller) chưa settle
    let pending_balance = 0;

    // A. Doanh thu từ Đơn hàng gốc (Tickets + Merchandise) của BTC
    if (user.organizer_profile) {
      const pendingOrders = await prisma.order.aggregate({
        where: {
          event: { organizer_id: user.organizer_profile.id },
          status: 'paid',
          is_settled: false
        },
        _sum: {
          organizer_revenue: true
        }
      });
      pending_balance += Number(pendingOrders._sum.organizer_revenue || 0);
    }

    // B. Doanh thu từ việc bán lại trên Marketplace của User (với tư cách Seller)
    const pendingMarketplace = await prisma.marketplaceTransaction.aggregate({
      where: {
        seller_id: user.id,
        status: 'completed',
        is_settled: false
      },
      _sum: {
        seller_receive_amount: true
      }
    });
    pending_balance += Number(pendingMarketplace._sum.seller_receive_amount || 0);

    // Ghép vào object user trả về
    const result = {
      ...sensitiveData,
      pending_balance
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết người dùng:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết người dùng.' });
  }
};

// [UC_21] Quản lý người dùng: Khóa/Mở Khóa User
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: 'active' | 'banned'

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    if (existingUser.role === 'admin' && status === 'banned') {
      return res.status(403).json({ error: 'Không thể khóa tài khoản quản trị viên.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });

    // Logging action
    await prisma.adminActionLog.create({
      data: {
        admin_id: req.user.userId,
        action_type: status === 'banned' ? 'ban_user' : 'unban_user',
        target_id: id,
        new_value: status,
        old_value: existingUser.status
      }
    });

    res.status(200).json({ message: `Cập nhật trạng thái thành ${status}.` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_21] Duyệt hồ sơ Ban tổ chức
const approveOrganizer = async (req, res) => {
  try {
    const { id } = req.params; // Organizer ID
    const { action, reason } = req.body; // 'approve' | 'reject'

    const kyc_status = action === 'approve' ? 'approved' : 'rejected';
    const is_verified = action === 'approve' ? true : false;

    const organizer = await prisma.organizer.update({
      where: { id },
      include: { user: true },
      data: { 
        kyc_status, 
        is_verified,
        kyc_verified_at: new Date()
      }
    });

    // Nếu Approve thì mới đổi role của User thành organizer
    if (action === 'approve') {
      await prisma.user.update({
        where: { id: organizer.user_id },
        data: { role: 'organizer' }
      });
    }

    await prisma.adminActionLog.create({
      data: {
        admin_id: req.user.userId,
        action_type: `organizer_${action}`,
        target_id: id
      }
    });

    // Gửi Email thông báo cho User
    const userEmail = organizer.user.email;
    if (action === 'approve') {
      const subject = '[BASTICKET] Chúc mừng! Hồ sơ Ban Tổ Chức của bạn đã được duyệt';
      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #52c41a;">Chúc mừng!</h2>
          <p>Chào <b>${organizer.user.full_name || userEmail}</b>,</p>
          <p>Hồ sơ đăng ký Ban Tổ Chức <b>${organizer.organization_name}</b> của bạn tại BASTICKET đã được phê duyệt thành công.</p>
          <p>Kể từ bây giờ, bạn có thể truy cập vào Dashboard dành cho Ban Tổ Chức để bắt đầu tạo và quản lý các sự kiện của mình.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/organizer/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #52c41a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Đến Dashboard BTC
          </a>
          <p style="margin-top: 20px; color: #888;">Trân trọng,<br/>Đội ngũ BASTICKET</p>
        </div>
      `;
      await sendEmail(userEmail, subject, html);
    } else {
      const subject = '[BASTICKET] Thông báo kết quả hồ sơ Ban Tổ Chức';
      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #ff4d4f;">Thông báo hồ sơ</h2>
          <p>Chào <b>${organizer.user.full_name || userEmail}</b>,</p>
          <p>Rất tiếc, hồ sơ đăng ký Ban Tổ Chức <b>${organizer.organization_name}</b> của bạn đã không được duyệt vào lúc này.</p>
          <p><b>Lý do từ chối:</b> ${reason || 'Thông tin chưa đầy đủ hoặc không chính xác.'}</p>
          <p>Bạn có thể cập nhật lại thông tin và nộp lại hồ sơ sau khi đã khắc phục các vấn đề trên.</p>
          <p style="margin-top: 20px; color: #888;">Trân trọng,<br/>Đội ngũ BASTICKET</p>
        </div>
      `;
      await sendEmail(userEmail, subject, html);
    }

    res.status(200).json({ message: `Hồ sơ đã được ${action}.` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  toggleUserStatus,
  approveOrganizer
};
