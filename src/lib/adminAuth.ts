export function setAdminAuth() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_auth', 'true');
    localStorage.setItem('admin_auth_time', Date.now().toString());
  }
}

export function checkAdminAuth() {
  if (typeof window !== 'undefined') {
    const isAuth = localStorage.getItem('admin_auth') === 'true';
    const time = parseInt(localStorage.getItem('admin_auth_time') || '0');
    // セッションは24時間有効
    if (isAuth && Date.now() - time < 24 * 60 * 60 * 1000) {
      return true;
    }
    localStorage.removeItem('admin_auth');
  }
  return false;
}

export function clearAdminAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_auth');
  }
}
