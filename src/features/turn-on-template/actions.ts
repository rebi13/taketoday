"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { turnOnTemplate } from "@/server/services";

/** S15 기본 미션 켜기 */
export async function turnOnTemplateAction(
  templateId: string,
): Promise<boolean> {
  const result = await turnOnTemplate({ templateId });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok;
}
