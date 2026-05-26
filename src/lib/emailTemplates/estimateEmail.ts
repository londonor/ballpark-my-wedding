interface EstimateEmailProps {
  cityTitle: string;
  pdfFilename: string;
}

export function buildEstimateEmail({ cityTitle, pdfFilename }: EstimateEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your BallparkMyWedding estimate for ${cityTitle}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #3a3028; }
    .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e0d9d0; }
    .header { background-color: #4a7560; padding: 28px 36px; }
    .header-wordmark { font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; }
    .header-tagline { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 2px; }
    .body { padding: 36px; }
    .greeting { font-size: 22px; font-weight: 700; color: #1e1812; margin: 0 0 16px 0; line-height: 1.3; }
    p { font-size: 15px; line-height: 1.7; color: #5a5048; margin: 0 0 16px 0; }
    .attachment-note { background-color: #f7f5f2; border: 1px solid #e0d9d0; border-radius: 10px; padding: 14px 18px; margin: 24px 0; font-size: 13px; color: #6b5f52; }
    .attachment-note strong { color: #3a3028; }
    .divider { border: none; border-top: 1px solid #e0d9d0; margin: 28px 0; }
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
      <h1 class="greeting">Your estimate for ${escapeHtml(cityTitle)}</h1>
      <p>
        Your full wedding cost breakdown — by category and tier — is attached as a PDF.
        Consider it your planning starting point, not the final word.
      </p>
      <div class="attachment-note">
        📎 <strong>${escapeHtml(pdfFilename)}</strong> is attached to this email.
        Open it for your complete breakdown by category, your grand total range, and per-guest cost.
      </div>
      <p>
        The numbers exist to reduce stress, not add to it. Use this as a conversation starter
        with your partner and your vendors — not as a ceiling.
      </p>
      <hr class="divider" />
      <p style="font-size: 13px; color: #a09080; margin: 0;">— The BallparkMyWedding team</p>
    </div>
    <div class="footer">
      This estimate is a ballpark figure. Actual costs will vary based on vendor availability,
      timing, and your specific choices. It does not include honeymoon travel, rings, or legal fees.<br /><br />
      <a href="https://ballparkmywedding.com">ballparkmywedding.com</a>
    </div>
  </div>
</body>
</html>`;

  const text = `Your BallparkMyWedding estimate for ${cityTitle}

Your full wedding cost breakdown is attached as a PDF (${pdfFilename}).

The numbers exist to reduce stress, not add to it. Use this as a conversation starter with your partner and your vendors.

— The BallparkMyWedding team

---
This estimate is a ballpark figure. Actual costs will vary based on vendor availability, timing, and your specific choices.
ballparkmywedding.com`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
