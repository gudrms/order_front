/** 관리자 로그인 화면의 '아이디 저장' / '로그인 상태 유지' 설정 (이 브라우저·PC에만 저장) */
const SAVED_EMAIL_KEY = 'admin-saved-email';
const KEEP_LOGIN_KEY = 'admin-keep-login';
/** 탭·앱을 닫으면 사라지는 표시 — 로그인 상태 유지를 끈 경우 다음 실행 때 로그아웃시키는 기준 */
const SESSION_ALIVE_KEY = 'admin-session-alive';

export function getSavedEmail() {
  return localStorage.getItem(SAVED_EMAIL_KEY) ?? '';
}

export function getKeepLogin() {
  return localStorage.getItem(KEEP_LOGIN_KEY) !== 'false';
}

export function saveLoginPreferences({ email, rememberEmail, keepLogin }: { email: string; rememberEmail: boolean; keepLogin: boolean }) {
  if (rememberEmail) localStorage.setItem(SAVED_EMAIL_KEY, email);
  else localStorage.removeItem(SAVED_EMAIL_KEY);
  localStorage.setItem(KEEP_LOGIN_KEY, String(keepLogin));
  sessionStorage.setItem(SESSION_ALIVE_KEY, '1');
}

/** 로그인 상태 유지를 끄고 로그인했는데 브라우저·PC 앱을 다시 켠 경우 */
export function shouldExpireSession() {
  return !getKeepLogin() && !sessionStorage.getItem(SESSION_ALIVE_KEY);
}
