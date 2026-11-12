import Container from "../../components/Container";
import Link from "next/link";
import { ArrowRight, Sparkles, Link2, BarChart3, Clock, ShieldCheck, Disc3 } from "lucide-react";

export const metadata = {
  title: "CXRNER LINK — Музыкальные смарт-ссылки и Pre-save платформа",
  description:
    "Создавайте профессиональные смарт-ссылки на релизы, запускайте Pre-save кампании и отслеживайте аналитику стримингов в экосистеме CXRNER MUSIC.",
};

export default function LinkLandingPage() {
  return (
    <div className="relative min-h-[100svh] bg-[#050407] text-white pt-24 pb-20 overflow-x-hidden">
      {/* Background ambient light */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(135,55,255,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#00F0FF]/5 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10 space-y-20">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#B46BFF]/40 bg-[#8737FF]/15 font-mono text-xs uppercase tracking-[0.24em] text-[#D9D9E2]">
            <Sparkles className="w-3.5 h-3.5 text-[#B46BFF]" />
            <span>MUSIC SMART LINKS &amp; PRE-SAVE PLATFORM</span>
          </div>

          <h1 className="font-heavy text-5xl sm:text-7xl lg:text-8xl uppercase tracking-tight leading-[0.9]">
            <span className="block text-white">CXRNER</span>
            <span className="block text-violet-energy">LINK</span>
          </h1>

          <p className="text-base sm:text-lg text-[#D9D9E2]/80 max-w-xl mx-auto leading-relaxed">
            Собственная платформа смарт-ссылок нового поколения. Собирайте переходы на 150+ музыкальных витрин, запускайте автоматические Pre-save кампании и отслеживайте конверсию фанатов.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/links/new"
              className="btn-energy px-8 py-4 rounded-full font-mono text-xs uppercase tracking-[0.2em] font-bold inline-flex items-center gap-2.5 shadow-[0_0_30px_rgba(135,55,255,0.4)]"
            >
              <span>Создать Smart Link</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/links"
              className="btn-void-ghost px-8 py-4 font-mono text-xs uppercase tracking-[0.18em]"
            >
              <span>Мои ссылки</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-7 rounded-3xl border border-white/10 bg-[#090611]/60 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#8737FF]/20 border border-[#8737FF]/40 flex items-center justify-center text-[#B46BFF]">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="font-heavy text-xl uppercase tracking-tight text-white">
              Автопоиск по UPC / EAN
            </h3>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70 leading-relaxed">
              Введите штрихкод релиза — система мгновенно подтянет официальную обложку, метаданные и прямые ссылки на стриминги.
            </p>
          </div>

          <div className="p-7 rounded-3xl border border-white/10 bg-[#090611]/60 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-heavy text-xl uppercase tracking-tight text-white">
              Автоматический Out Now
            </h3>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70 leading-relaxed">
              Страница сама отсчитывает время до даты премьеры, собирает подписчиков в Pre-save и ровно в полночь превращается в Out Now.
            </p>
          </div>

          <div className="p-7 rounded-3xl border border-white/10 bg-[#090611]/60 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/40 flex items-center justify-center text-[#FF2E93]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-heavy text-xl uppercase tracking-tight text-white">
              Детальная аналитика
            </h3>
            <p className="text-xs sm:text-sm text-[#D9D9E2]/70 leading-relaxed">
              Просматривайте реальные переходы по площадкам (Spotify, Apple, Яндекс, VK), географию слушателей и конверсию в прослушивания.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
