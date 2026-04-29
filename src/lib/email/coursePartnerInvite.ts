export function buildCoursePartnerInviteEmail(params: {
  recipientName: string
  courseName: string
  setupUrl: string
  adminName: string
}) {
  const { recipientName, courseName, setupUrl, adminName } = params
  return {
    subject: `Your TeeAhead partner portal is ready — ${courseName}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#1A1A1A">
  <div style="margin-bottom:24px"><span style="font-size:24px;font-weight:700;color:#1B4332">TeeAhead</span></div>
  <h1 style="font-size:20px;font-weight:700;margin-bottom:8px">Hi ${recipientName},</h1>
  <p style="color:#6B7770;margin-bottom:24px">${adminName} has invited you to access the <strong>${courseName}</strong> partner portal on TeeAhead. Your portal includes booking analytics, member activity, revenue reports, and your monthly performance summary.</p>
  <a href="${setupUrl}" style="display:inline-block;background:#1B4332;color:#FAF7F2;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Set up your account</a>
  <p style="color:#6B7770;font-size:13px;margin-top:24px">This link expires in 72 hours.</p>
</body></html>`,
    text: `Hi ${recipientName},\n\n${adminName} invited you to the ${courseName} partner portal.\n\nSet up your account: ${setupUrl}\n\nExpires in 72 hours.`,
  }
}
