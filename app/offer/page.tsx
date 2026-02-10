import type { Metadata } from "next";
import Container from "@/components/Container";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Публичная оферта — CXRNER MUSIC",
  description: "Публичная оферта и условия сотрудничества с CXRNER MUSIC.",
};

export default function OfferPage() {
  return (
    <section className="section-padding">
      <Container>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">Документ</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl font-display">Публичная оферта</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-3xl text-base text-white/70">
            Настоящая публичная оферта определяет условия сотрудничества с CXRNER MUSIC. Принимая условия,
            артист соглашается с правилами дистрибуции, продвижения и монетизации.
          </p>
        </Reveal>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/70">
          <div>
            <h2 className="text-lg font-semibold text-white">1. Общие положения</h2>
            <p className="mt-3">
              1.1. Настоящая оферта является официальным предложением CXRNER MUSIC заключить договор на условиях,
              изложенных ниже.
            </p>
            <p className="mt-3">
              1.2. Акцептом оферты является отправка релиза и согласие с условиями через официальный канал связи.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">2. Предмет договора</h2>
            <p className="mt-3">
              2.1. CXRNER MUSIC оказывает услуги по дистрибуции музыкального контента, маркетингу, питчингу и
              монетизации на условиях настоящей оферты.
            </p>
            <p className="mt-3">
              2.2. Артист гарантирует наличие прав на передаваемый контент и ответственность за его легальность.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">3. Права и обязанности сторон</h2>
            <p className="mt-3">
              3.1. Лейбл обязуется обеспечить размещение релиза на согласованных платформах и предоставлять
              отчетность по запросу.
            </p>
            <p className="mt-3">
              3.2. Артист обязуется предоставить материалы в требуемом формате и участвовать в согласованных
              промо-активностях.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">4. Вознаграждение</h2>
            <p className="mt-3">
              4.1. Размер вознаграждения и распределение доходов фиксируются в индивидуальном соглашении после
              принятия релиза.
            </p>
            <p className="mt-3">
              4.2. Выплаты производятся в сроки, согласованные сторонами, при достижении минимального порога.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">5. Конфиденциальность</h2>
            <p className="mt-3">
              5.1. Стороны обязуются не раскрывать коммерческие и персональные данные, полученные в рамках
              сотрудничества, без согласия другой стороны.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">6. Ответственность</h2>
            <p className="mt-3">
              6.1. Стороны несут ответственность за нарушение условий договора в соответствии с действующим
              законодательством.
            </p>
            <p className="mt-3">
              6.2. CXRNER MUSIC не несет ответственности за действия платформ, влияющие на доступность контента,
              при условии соблюдения обязательств со своей стороны.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">7. Заключительные положения</h2>
            <p className="mt-3">
              7.1. Оферта вступает в силу с момента публикации и действует до ее отзыва.
            </p>
            <p className="mt-3">
              7.2. Все вопросы и разногласия решаются путем переговоров, а при невозможности — в порядке,
              установленном законом.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">8. Контакты</h2>
            <p className="mt-3">Email: cxrner.label@gmail.com</p>
            <p className="mt-2">Telegram: @kazumaiq</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
