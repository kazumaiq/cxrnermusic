import type { Metadata } from "next";
import JoinClientView from "./JoinClientView";

export const metadata: Metadata = {
  title: "Присоединяйтесь к CXRNER MUSIC — Приглашение артиста",
  description: "Официальное приглашение в цифровую экосистему CXRNER MUSIC. Получите CXRNER ID, приветственные бонусы CXP и доступ к музыкальной дистрибуции.",
};

export default async function JoinPage(props: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const searchParams = await props.searchParams;
  const refCode = searchParams.ref || "";

  return <JoinClientView initialRefCode={refCode} />;
}
