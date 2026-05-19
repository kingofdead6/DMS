// emailReminders.js
import cron from 'node-cron';
import { Resend } from 'resend';
import CalendarEvent from '../Models/CalendarEvent.js';
import User from '../Models/User.js';

const resend = new Resend('re_C14fFRKS_P2DXMBjkE7WSRsPKs9NDYiNW');

async function getSuperAdminEmail() {
  const superAdmin = await User.findOne({ usertype: 'superadmin' }).select('email').lean();
  if (!superAdmin) throw new Error('No superadmin account found in database');
  return superAdmin.email;
}

async function sendReminderEmail(event, hoursLeft, superAdminEmail) {
  const dateStr = new Date(event.date).toLocaleString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const caseInfo = event.caseRef
    ? `<p><strong>Dossier :</strong> ${event.caseRef.caseName} — ${event.caseRef.clientFullName}</p>`
    : '';

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: superAdminEmail,           // superadmin receives
    replyTo: superAdminEmail,      // replies go back to superadmin
    subject: `⏰ Rappel ${hoursLeft}h — ${event.title}`,
    html: `
      <h2>Rappel : événement dans ${hoursLeft} heures</h2>
      <p><strong>Titre :</strong> ${event.title}</p>
      ${event.description ? `<p><strong>Description :</strong> ${event.description}</p>` : ''}
      <p><strong>Date :</strong> ${dateStr}</p>
      ${caseInfo}
      <p><strong>Type :</strong> ${event.type ?? '—'}</p>
      <hr/>
      <small>Rappel automatique envoyé au compte : ${superAdminEmail}</small>
    `,
  });
}

export async function checkAndSendReminders() {
  // Fetch superadmin email once per cron tick
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

    const events = await CalendarEvent.find({
      date: { $gte: windowStart, $lte: windowEnd },
      [`reminder${hoursLeft}hSent`]: { $ne: true },
    }).populate('caseRef', 'caseName clientFullName').lean();

    for (const event of events) {
      try {
        await sendReminderEmail(event, hoursLeft, superAdminEmail);
        await CalendarEvent.findByIdAndUpdate(event._id, {
          [`reminder${hoursLeft}hSent`]: true,
        });
        console.log(`[Reminder] ${hoursLeft}h email sent to ${superAdminEmail} for: ${event.title}`);
      } catch (err) {
        console.error(`[Reminder] Failed for "${event.title}":`, err.message);
      }
    }
  }
}

export function startReminderScheduler() {
  console.log('[Reminder] Scheduler started — checks every 30 minutes');
  cron.schedule('*/30 * * * *', () => {
    checkAndSendReminders().catch(err =>
      console.error('[Reminder] Scheduler error:', err.message)
    );
  });
}