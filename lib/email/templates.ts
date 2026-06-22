export function activationEmail(name: string, url: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height:1.4;">
      <h2>Activate your account</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Click the button below to activate your account:</p>
      <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#7c3aed;color:white;border-radius:6px;text-decoration:none">Activate account</a></p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
  `;
}

export function resetPasswordEmail(name: string, url: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height:1.4;">
      <h2>Password reset request</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Click the link below to reset your password (expires in 1 hour):</p>
      <p><a href="${url}">${url}</a></p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
  `;
}

export default { activationEmail, resetPasswordEmail };
