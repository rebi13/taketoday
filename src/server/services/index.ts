import "server-only";

export {
  authRouteHandlers,
  getSessionUser,
  signInWithGoogle,
  signOutUser,
  type SessionUser,
} from "./session";
export {
  agreeToTerms,
  chooseCharacter,
  finishOnboarding,
  getAppEntry,
  listCharacterTypes,
  listStartingMissionCandidates,
  saveLifeInfo,
  type FinishOnboardingResult,
  type SaveLifeInfoResult,
  type StartingMissionCandidate,
  type AgreeToTermsResult,
  type AppEntry,
  type CharacterTypeOption,
  type ChooseCharacterResult,
} from "./onboarding";
export {
  getAccount,
  updateNickname,
  type Account,
  type UpdateNicknameResult,
} from "./account";
