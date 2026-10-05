import React from "react";
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Award } from "lucide-react";

export const HeroSection = ({ onExploreClick }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] py-16 border-b border-[var(--border-light)]">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Award size={14} />
              <span>BST Thu Đông Premium 2026</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
              Định Hình Style <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
                Thời Trang Đẳng Cấp
              </span>
            </h1>

            <p className="text-slate-300 text-base md:text-lg max-w-xl font-normal leading-relaxed">
              Khám phá các thiết kế quần áo chuẩn phom dáng, chất liệu sợi cao cấp dệt 100% Cotton thoáng mát. Nâng tầm cá tính cùng thương hiệu thời trang HUGAN.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button 
                onClick={onExploreClick}
                className="btn-primary px-8 py-3.5 text-base shadow-[0_0_20px_rgba(234,179,8,0.4)]"
              >
                <span>Khám Phá Ngay</span>
                <ArrowRight size={18} />
              </button>
              <div className="flex items-center gap-3 text-slate-300 text-sm font-semibold pl-2">
                <span className="text-amber-400 font-extrabold text-xl">500+</span>
                <span className="leading-tight text-xs text-slate-400">Sản phẩm <br/>mẫu mã mới</span>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Freeship Đơn 500k</p>
                  <p className="text-[10px] text-slate-400">Giao hàng 24h toàn quốc</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Đổi Trả 30 Ngày</p>
                  <p className="text-[10px] text-slate-400">Hoàn tiền 100% nếu lỗi</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Chính Hãng 100%</p>
                  <p className="text-[10px] text-slate-400">Cam kết chất lượng vải</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right Image Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-2xl overflow-hidden shadow-2xl border border-amber-500/30 group">
              <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80" 
                alt="HUGAN Fashion Showcase"
                className="w-full h-[450px] object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded w-fit mb-2">
                  HOT TREND
                </span>
                <h3 className="text-xl font-extrabold text-white">Bản Phối Minimalist Chic</h3>
                <p className="text-xs text-slate-300">Phong cách đơn giản, tinh tế cho người hiện đại</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
