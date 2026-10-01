import { setRequestLocale } from "next-intl/server";
import { OrderSuccessClient } from "./success-client";

export default async function OrderSuccessPage({
  params,
}: PageProps<"/[lang]/order/success">) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <OrderSuccessClient />;
}
