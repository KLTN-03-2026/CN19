from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_behavior():
    try:
        data = request.json or {}
        # Đảm bảo behavior luôn là một dict, kể cả khi behaviorData là null
        behavior = data.get('behaviorData')
        if not isinstance(behavior, dict):
            behavior = {}
            print("⚠️ Warning: behaviorData is missing or not a dictionary")
        
        # Thang điểm rủi ro: 0.0 (Người) -> 1.0 (Bot)
        risk_score = 0.0
        details = []

        # 1. Phân tích thời gian điền form (ms)
        form_duration_ms = behavior.get('form_fill_duration', 0) or 0
        form_duration = float(form_duration_ms) / 1000.0
        
        if form_duration > 0:
            if form_duration < 2:
                risk_score += 0.6
                details.append(f"Tốc độ hoàn thành biểu mẫu quá nhanh mức sinh học ({form_duration:.2f}s) - gợi ý auto-fill script.")
            elif form_duration < 5:
                risk_score += 0.3
                details.append(f"Thời gian điền form diễn ra nhanh hơn bình thường ({form_duration:.2f}s).")
            else:
                details.append(f"Thời gian điền biểu mẫu hợp lệ và tự nhiên ({form_duration:.2f}s).")
        else:
            risk_score += 0.2
            details.append("Không ghi nhận được trường dữ liệu thời gian tương tác (có thể gửi thẳng qua API).")

        # 2. Phân tích tốc độ Click (ms)
        click_speed = behavior.get('click_speed_ms', 0) or 0
        if 0 < click_speed < 100:
            risk_score += 0.5
            details.append(f"Tốc độ nảy click chuột bất thường ({click_speed}ms) - dấu hiệu điển hình của Auto-Clicker.")
        elif 100 <= click_speed < 250:
            risk_score += 0.2
            details.append(f"Thao tác click chuột rất sát ngưỡng ({click_speed}ms) - cần lưu ý theo dõi thêm.")
        elif click_speed >= 250:
            details.append(f"Tốc độ phản hồi nhấp chuột bình thường ({click_speed}ms).")

        metrics = behavior.get('behavior_metrics', {}) or {}
        mouse_dist = metrics.get('mouseDistance', 0) or 0
        if mouse_dist < 50:
            risk_score += 0.4
            details.append(f"Hành vi vệt chuột tối thiểu ({mouse_dist}px) - thiếu hụt ma trận tương tác vật lý của người dùng thực.")
        else:
            details.append(f"Ghi nhận vệt chuột định hướng rõ ràng ({mouse_dist}px) - khớp với thao tác người thật.")
        
        final_score = min(risk_score, 1.0)
        is_bot = final_score > 0.7

        result = {
            "status": "success",
            "risk_score": round(final_score, 2),
            "is_bot": is_bot,
            "details": details,
            "recommendation": "BLOCK" if is_bot else "ALLOW",
            "timestamp": time.time()
        }
        print(f"✅ ANALYSIS RESULT: {result}")
        return jsonify(result)

    except Exception as e:
        print(f"❌ CRITICAL ERROR in AI Service: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 200 # Trả về 200 kèm status error để không làm crash backend flow

if __name__ == '__main__':
    print("BASTICKET AI Bot Detection Service running on http://localhost:5001")
    app.run(port=5001, debug=False)
