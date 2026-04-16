'use client';

export async function registerUser(phone: string, password: string) {
  const res = await fetch('/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  return res.json();
}

export async function loginUser(phone: string, password: string) {
  const res = await fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  return res.json();
}

export async function logoutUser() {
  await fetch('/api/user/logout', { method: 'POST' });
}
