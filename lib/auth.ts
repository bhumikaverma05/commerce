export function verifyAdminAuth(request: Request) {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) return false;

  const header = request.headers.get('x-admin-secret') || '';
  return header === secret;
}

export function requireAdminAuth(request: Request) {
  if (!verifyAdminAuth(request)) {
    throw new Error('Unauthorized');
  }
}
