import { Resend } from 'resend';
import CalendarEvent from '../Models/CalendarEvent.js';
import User from '../Models/User.js';

// Key comes from env — never hardcode credentials
const resend = new Resend(process.env.RESEND_API_KEY);

async function getSuperAdminEmail() {
  const superAdmin = await User.findOne({ usertype: 'superadmin' })
    .select('email').lean();
  if (!superAdmin) throw new Error('No superadmin account found in database');
  return superAdmin.email;
}

async function sendReminderEmail(event, hoursLeft, superAdminEmail) {
  const dateStr = new Date(event.date).toLocaleString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const caseInfo = event.caseRef
    ? `${event.caseRef.caseName} &mdash; ${event.caseRef.clientFullName}`
    : null;

  const is48 = hoursLeft === 48;

  const accentColor  = is48 ? '#c8a96e' : '#e07b54';
  const badgeBg      = is48 ? '#fdf6e9' : '#fef0ea';
  const badgeText    = is48 ? '#a0742a' : '#b94f28';
  const urgencyLabel = is48 ? 'Rappel — 48 heures' : '⚠️ Rappel — 24 heures';
  const urgencyNote  = is48
    ? 'Cet événement aura lieu dans deux jours.'
    : 'Cet événement aura lieu demain. Préparez-vous.';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Rappel Agenda</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1ec;font-family:'Georgia',serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">

          <!-- Top accent bar -->
          <tr>
            <td style="height:5px;background:linear-gradient(90deg,${accentColor},#2c2c2c);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:44px 48px 32px;background:#1e1e1e;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${accentColor};font-family:'Georgia',serif;">
                      Agenda Juridique
                    </p>
                    <h1 style="margin:0;font-size:26px;font-weight:400;color:#ffffff;font-family:'Georgia',serif;line-height:1.3;">
                      ${event.title}
                    </h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;background:${badgeBg};color:${badgeText};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:6px 14px;border-radius:2px;font-family:Arial,sans-serif;">
                      ${hoursLeft}H
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Urgency banner -->
          <tr>
            <td style="padding:0 48px;">
              <div style="border-left:3px solid ${accentColor};background:${badgeBg};padding:14px 20px;margin-top:0;">
                <p style="margin:0;font-size:13px;color:${badgeText};font-family:Arial,sans-serif;letter-spacing:0.5px;">
                  <strong>${urgencyLabel}</strong> &nbsp;—&nbsp; ${urgencyNote}
                </p>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 48px 40px;">

              <!-- Date block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;background:#f9f7f4;border-radius:3px;border:1px solid #ede9e2;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#999;font-family:Arial,sans-serif;">Date & Heure</p>
                    <p style="margin:0;font-size:17px;color:#1e1e1e;font-family:'Georgia',serif;text-transform:capitalize;">
                      ${dateStr}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Details grid -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>

                  <!-- Type -->
                  <td width="48%" valign="top" style="padding:16px 20px;background:#f9f7f4;border-radius:3px;border:1px solid #ede9e2;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#999;font-family:Arial,sans-serif;">Type</p>
                    <p style="margin:0;font-size:15px;color:#1e1e1e;font-family:'Georgia',serif;text-transform:capitalize;">
                      ${event.type ?? '—'}
                    </p>
                  </td>

                  <td width="4%"></td>

                  <!-- Case -->
                  <td width="48%" valign="top" style="padding:16px 20px;background:#f9f7f4;border-radius:3px;border:1px solid #ede9e2;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#999;font-family:Arial,sans-serif;">Dossier</p>
                    <p style="margin:0;font-size:15px;color:#1e1e1e;font-family:'Georgia',serif;">
                      ${caseInfo ?? '<span style="color:#aaa;">—</span>'}
                    </p>
                  </td>

                </tr>
              </table>

              <!-- Description -->
              ${event.description ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="padding:16px 20px;background:#f9f7f4;border-radius:3px;border:1px solid #ede9e2;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#999;font-family:Arial,sans-serif;">Description</p>
                    <p style="margin:0;font-size:15px;color:#1e1e1e;font-family:'Georgia',serif;line-height:1.6;">
                      ${event.description}
                    </p>
                  </td>
                </tr>
              </table>` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 48px 32px;border-top:1px solid #ede9e2;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:#aaa;font-family:Arial,sans-serif;line-height:1.6;">
                      Rappel automatique &nbsp;&bull;&nbsp; Agenda Juridique<br/>
                      Envoyé à : ${superAdminEmail}
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:11px;color:#ccc;font-family:Arial,sans-serif;">
                      ${new Date().getFullYear()}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: superAdminEmail,
    replyTo: superAdminEmail,
    subject: `${is48 ? '📅' : '⚠️'} ${urgencyLabel} — ${event.title}`,
    html,
  });
}

export async function checkAndSendReminders() {
  let superAdminEmail;
  try {
    superAdminEmail = await getSuperAdminEmail();
  } catch (err) {
    console.error('[Reminder] Aborted — could not find superadmin:', err.message);
    return;
  }

  const now = new Date();

  for (const hoursLeft of [48, 24]) {
    const windowEnd   = new Date(now.getTime() + hoursLeft * 60 * 60 * 1000);
    const windowStart = new Date(windowEnd.getTime() - 30 * 60 * 1000);

    let events;
    try {
      events = await CalendarEvent.find({
        date: { $gte: windowStart, $lte: windowEnd },
        [`reminder${hoursLeft}hSent`]: { $ne: true },
      }).populate('caseRef', 'caseName clientFullName').lean();
    } catch (err) {
      // DB not ready yet — don't crash the loop, retry next tick
      console.error(`[Reminder] DB query failed for ${hoursLeft}h window:`, err.message);
      continue;
    }

    for (const event of events) {
      try {
        await sendReminderEmail(event, hoursLeft, superAdminEmail);
        // Use updateOne instead of findByIdAndUpdate to avoid a second round-trip
        await CalendarEvent.updateOne(
          { _id: event._id },
          { $set: { [`reminder${hoursLeft}hSent`]: true } }
        );
        console.log(`[Reminder] ${hoursLeft}h sent for: "${event.title}"`);
      } catch (err) {
        console.error(`[Reminder] Failed for "${event.title}":`, err.message);
      }
    }
  }
}

export function startReminderScheduler() {
  const INTERVAL_MS = 1 * 1 * 1000; // 30 minutes

  async function tick() {
    console.log('[Reminder] Tick —', new Date().toISOString());
    try {
      await checkAndSendReminders();
    } catch (err) {
      console.error('[Reminder] Tick error:', err.message);
    }
    // Schedule next tick regardless of whether this one succeeded
    setTimeout(tick, INTERVAL_MS);
  }

  // First tick after 30 minutes — don't run immediately on server start
  // (DB may not be ready, and you don't want to flood on redeploy)
  setTimeout(tick, INTERVAL_MS);
  console.log('[Reminder] Scheduler armed — first check in 1 minutes');
}