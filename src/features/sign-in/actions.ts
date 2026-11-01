"use server";

import { signInWithGoogle } from "@/server/services";

export async function signInWithGoogleAction() {
  await signInWithGoogle();
}
