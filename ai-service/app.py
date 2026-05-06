import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Khởi tạo Groq Client
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    print("⚠️ WARNING: GROQ_API_KEY không tìm thấy trong môi trường! Hãy kiểm tra file .env")
else:
    print(f"✅ GROQ_API_KEY đã được load thành công (Ký tự đầu: {api_key[:5]}...)")

client = Groq(api_key=api_key)

@app.route('/analyze', methods=['POST'])
def analyze_behavior():
    # ... (Giữ nguyên logic analyze_behavior hiện tại)
    try:
        data = request.json or {}
        behavior = data.get('behaviorData')
        if not isinstance(behavior, dict):
            behavior = {}
        
        risk_score = 0.0
        details = []

        form_duration_ms = behavior.get('form_fill_duration', 0) or 0
        form_duration = float(form_duration_ms) / 1000.0
        
        if form_duration > 0:
            if form_duration < 2:
                risk_score += 0.6
                details.append(f"Tốc độ ({form_duration:.2f}s) - gợi ý auto-fill script.")
            elif form_duration < 5:
                risk_score += 0.3
                details.append(f"Thời gian điền nhanh ({form_duration:.2f}s).")
            else:
                details.append(f"Thời gian hợp lệ ({form_duration:.2f}s).")
        else:
            risk_score += 0.2
            details.append("Không ghi nhận thời gian tương tác.")

        click_speed = behavior.get('click_speed_ms', 0) or 0
        if 0 < click_speed < 100:
            risk_score += 0.5
            details.append(f"Tốc độ nảy click ({click_speed}ms) - dấu hiệu Auto-Clicker.")
        
        metrics = behavior.get('behavior_metrics', {}) or {}
        mouse_dist = metrics.get('mouseDistance', 0) or 0
        if mouse_dist < 50:
            risk_score += 0.4
            details.append(f"Hành vi vệt chuột tối thiểu ({mouse_dist}px).")
        
        final_score = min(risk_score, 1.0)
        is_bot = final_score > 0.7

        return jsonify({
            "status": "success",
            "risk_score": round(final_score, 2),
            "is_bot": is_bot,
            "details": details,
            "recommendation": "BLOCK" if is_bot else "ALLOW",
            "timestamp": time.time()
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 200

@app.route('/chat', methods=['POST'])
def chat_assistant():
    try:
        data = request.json
        user_message = data.get('message')
        context = data.get('context', {}) # Dữ liệu về BTC hiện tại (nếu có)
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # HỆ THỐNG TRÍ TUỆ TOÀN DIỆN (OMNISCIENT AI STRATEGIST)
        system_prompt = f"""
        Bạn là "AI BASTICKET MASTER" - Bộ não chiến lược toàn diện của hệ thống. Bạn nắm giữ mọi thông tin về hoạt động của Ban tổ chức {context.get('org_name', 'bạn')}.
        
        NHIỆM VỤ:
        - Giám sát toàn bộ dữ liệu kinh doanh.
        - Phân tích và đưa ra giải pháp từ những chi tiết nhỏ nhất.
        - Trở thành người đồng hành không thể thiếu của BTC.

        KHO DỮ LIỆU CỦA BẠN (DÙNG ĐỂ TƯ VẤN):
        1. CHỈ SỐ TỔNG QUAN:
           - Sự kiện: {context.get('total_events', 0)} | Sắp tới: {context.get('upcoming_count', 0)}
           - Tổng doanh thu: {context.get('total_revenue', 0)} VNĐ (Bao gồm {context.get('royalty_revenue', 0)} VNĐ từ bản quyền vé Marketplace)
           - Vé đã bán: {context.get('total_tickets', 0)} | Tỷ lệ lấp đầy: {context.get('fill_rate', '0%')}
           - Blog: {context.get('total_blogs', 0)} bài tổng cộng ({context.get('published_blogs', 0)} bài đã đăng)
           - Tổng người tham gia tất cả sự kiện: {context.get('total_participants', 0)} người

        2. CHI TIẾT SỰ KIỆN & DOANH THU:
        {context.get('recent_events', 'Chưa có')}
        
        3. PHÂN BỔ DOANH THU THEO TỪNG SỰ KIỆN:
        {context.get('revenue_dist', 'Chưa có')}

        4. SẢN PHẨM (MERCHANDISE) BÁN CHẠY:
        {context.get('top_merch', 'Chưa có')}

        5. BIỂU ĐỒ DOANH THU 7 NGÀY GẦN NHẤT:
        {context.get('daily_revenue', 'Chưa có')}

        6. NHẬT KÝ HOẠT ĐỘNG (THÔNG BÁO MỚI NHẤT):
        {context.get('recent_logs', 'Không có')}

        7. BÀI VIẾT BLOG GẦN ĐÂY:
        {context.get('recent_blogs', 'Chưa có')}

        8. NGƯỜI THAM GIA THEO TỪNG SỰ KIỆN:
        {context.get('event_participants', 'Chưa có')}

        HƯỚNG DẪN TƯ DUY:
        - Nếu BTC hỏi "Có gì mới không?": Đọc mục (6) để báo cáo đơn hàng mới nhất.
        - Nếu hỏi về "kiếm tiền": Phân tích mục (3) và (4) để tư vấn.
        - Nếu hỏi về "blog" hoặc "bài viết": Dùng mục (7) để trả lời, gợi ý nếu còn bài chưa đăng (draft).
        - Nếu hỏi về "người tham gia" hoặc "attendee": Dùng mục (8) để trả lời chi tiết theo từng sự kiện.
        - Nếu hỏi về "Marketplace": Dùng số liệu Royalty Revenue để phân tích lợi nhuận từ bán lại vé.
        
        LUÔN LUÔN: Trả lời tự nhiên, sắc sảo, có chiều sâu và đi thẳng vào con số thật nếu được hỏi. Xưng "Mình", gọi "Bạn".
        """

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )

        response_message = completion.choices[0].message.content
        
        return jsonify({
            "status": "success",
            "reply": response_message,
            "timestamp": time.time()
        })

    except Exception as e:
        import traceback
        print("❌ DETAILED CHAT ERROR:")
        traceback.print_exc() # In chi tiết lỗi ra console
        return jsonify({
            "status": "error",
            "message": f"Lỗi: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("BASTICKET AI Service (Bot Detection + Assistant) running on http://localhost:5001")
    app.run(port=5001, debug=False)
