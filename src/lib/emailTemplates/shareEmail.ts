interface ShareEmailProps {
  senderName: string;
  message?: string;
  cityTitle: string;
  weddingYear: number;
}

export function buildShareEmail({ senderName, message, cityTitle, weddingYear }: ShareEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${escapeHtml(senderName)} shared a wedding estimate for ${cityTitle}`;
  const messageBlock = message
    ? `<div style="background:#f7f5f2;border:1px solid #e0d9d0;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:14px;color:#5a5048;font-style:italic;">"${escapeHtml(message)}"</div>`
    : "";
  const messageTxt = message ? `\n\n"${message}"\n` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #3a3028; }
    .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e0d9d0; }
    .header { background-color: #4a7560; padding: 28px 36px; }
    .header-wordmark { font-size: 18px; font-weight: 700; color: #ffffff; }
    .header-tagline { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 2px; }
    .body { padding: 36px; }
    .greeting { font-size: 22px; font-weight: 700; color: #1e1812; margin: 0 0 16px 0; }
    p { font-size: 15px; line-height: 1.7; color: #5a5048; margin: 0 0 16px 0; }
    .footer { padding: 0 36px 32px; font-size: 12px; color: #a09080; line-height: 1.6; }
    .footer a { color: #4a7560; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-wordmark">BallparkMyWedding</div>
      <div class="header-tagline">ballparkmywedding.com</div>
    </div>
    <div class="body">
      <h1 class="greeting">${escapeHtml(senderName)} shared a wedding estimate with you</h1>
      <p>
        ${escapeHtml(senderName)} used BallparkMyWedding to put together a cost estimate for a
        ${escapeHtml(cityTitle)} wedding in ${weddingYear}. The full PDF is attached.
      </p>
      ${messageBlock}
      <p>
        Open the attached PDF for the complete breakdown — grand total range, per-guest cost,
        and a category-by-category look at where the money goes.
      </p>
    </div>
    <div class="footer">
      Shared via <a href="https://ballparkmywedding.com">ballparkmywedding.com</a>.
      Want to build your own estimate? It takes under 2 minutes.
    </div>
  </div>
</body>
</html>`;

  const text = `${senderName} shared a wedding estimate with you
${messageTxt}
They used BallparkMyWedding to build a cost estimate for a ${cityTitle} wedding in ${weddingYear}. The full PDF is attached.

---
Shared via ballparkmywedding.com`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
