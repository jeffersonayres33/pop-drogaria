import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'POPs Drogaria <noreply@seudominio.com.br>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

export async function sendDownloadEmail({
  to,
  token,
  popTitles,
  expiresAt,
}: {
  to: string
  token: string
  popTitles: string[]
  expiresAt: string
}) {
  const downloadUrl = `${BASE_URL}/download?token=${token}`
  const expireDate = new Date(expiresAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  const popList = popTitles.map(t => `<li style="margin-bottom:4px">✅ ${t}</li>`).join('')

  await resend.emails.send({
    from: FROM,
    to,
    subject: '✅ Seu pedido foi aprovado – Acesse seus POPs',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1ece0;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1ece0;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      
      <!-- Header -->
      <tr><td style="background:#1a5c3a;padding:32px 40px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">💊 POPs Drogaria</h1>
        <p style="color:#d4ede0;margin:8px 0 0;font-size:14px">Procedimentos Operacionais Padrão</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:40px">
        <h2 style="color:#1a5c3a;margin:0 0 16px;font-size:20px">Pagamento confirmado! 🎉</h2>
        <p style="color:#444;line-height:1.6;margin:0 0 24px">
          Seu pagamento foi aprovado. Clique no botão abaixo para preencher os dados da sua drogaria e gerar o PDF dos seus POPs.
        </p>

        <div style="background:#f0f9f4;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="color:#1a5c3a;font-weight:700;margin:0 0 12px;font-size:14px">📋 POPs adquiridos:</p>
          <ul style="margin:0;padding-left:16px;color:#333;font-size:14px">${popList}</ul>
        </div>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td align="center" style="padding:8px 0 24px">
            <a href="${downloadUrl}"
               style="display:inline-block;background:#1a5c3a;color:#fff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.5px">
              Acessar meus POPs →
            </a>
          </td></tr>
        </table>

        <div style="border:1.5px solid #fee;border-radius:10px;padding:16px;background:#fffaf5">
          <p style="color:#b45309;font-size:13px;margin:0;font-weight:600">⚠️ Atenção:</p>
          <p style="color:#92400e;font-size:13px;margin:6px 0 0;line-height:1.5">
            Este link é de <strong>uso único</strong> e expira em <strong>${expireDate}</strong>.<br>
            Após o download, o link será desativado automaticamente.
          </p>
        </div>

        <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
        <p style="color:#999;font-size:12px;margin:0;line-height:1.6">
          Se tiver dúvidas, responda este e-mail.<br>
          Link direto: <a href="${downloadUrl}" style="color:#1a5c3a">${downloadUrl}</a>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9f6ef;padding:20px 40px;text-align:center">
        <p style="color:#aaa;font-size:12px;margin:0">© ${new Date().getFullYear()} POPs Drogaria. Todos os direitos reservados.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>
    `,
  })
}
