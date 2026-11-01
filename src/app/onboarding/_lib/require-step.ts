import { redirect } from "next/navigation";
import { getAppEntry } from "@/server/services";

/**
 * 지금 해야 할 온보딩 단계가 path가 아니면 맞는 곳으로 보낸다.
 * 로그인하지 않았으면 로그인, 온보딩을 마쳤으면 홈.
 */
export async function requireOnboardingStep(path: string) {
  const entry = await getAppEntry();
  if (entry.kind === "login") redirect("/login");
  if (entry.kind === "ready") redirect("/");
  if (entry.path !== path) redirect(entry.path);
}
