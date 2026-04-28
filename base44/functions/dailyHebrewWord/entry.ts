import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role for scheduled/admin task
    const words = await base44.asServiceRole.entities.HebrewWord.list();
    if (!words || words.length === 0) {
      return Response.json({ error: 'No Hebrew words found' }, { status: 404 });
    }

    // Pick a random word
    const word = words[Math.floor(Math.random() * words.length)];

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    if (!users || users.length === 0) {
      return Response.json({ message: 'No users to notify' });
    }

    // Send email to each user
    const results = [];
    for (const user of users) {
      if (!user.email) continue;

      const body = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7c3aed;">🌟 Word of the Day</h2>
          <div style="background: linear-gradient(135deg, #f3e8ff, #fce7f3); border-radius: 16px; padding: 24px; margin: 16px 0;">
            <h1 style="font-size: 48px; text-align: center; color: #1e293b; margin: 0 0 8px 0;">${word.word}</h1>
            <p style="text-align: center; color: #64748b; font-size: 18px; margin: 0;">${word.pronunciation || ''}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 8px; font-weight: bold; color: #7c3aed;">🇺🇸 English</td><td style="padding: 8px;">${word.translation_en || ''}</td></tr>
            ${word.translation_he ? `<tr><td style="padding: 8px; font-weight: bold; color: #7c3aed;">🇮🇱 Hebrew</td><td style="padding: 8px;">${word.translation_he}</td></tr>` : ''}
            ${word.translation_es ? `<tr><td style="padding: 8px; font-weight: bold; color: #7c3aed;">🇪🇸 Spanish</td><td style="padding: 8px;">${word.translation_es}</td></tr>` : ''}
            ${word.translation_fr ? `<tr><td style="padding: 8px; font-weight: bold; color: #7c3aed;">🇫🇷 French</td><td style="padding: 8px;">${word.translation_fr}</td></tr>` : ''}
          </table>
          ${word.example_sentence_en ? `
          <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-left: 4px solid #7c3aed; border-radius: 4px;">
            <p style="margin: 0; color: #475569;"><strong>Example:</strong> ${word.example_sentence_en}</p>
          </div>` : ''}
          <p style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 14px;">Keep learning with OneOlam! 🕍</p>
        </div>
      `;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `✨ Hebrew Word of the Day: ${word.word}`,
          body
        });
        results.push({ email: user.email, status: 'sent' });
      } catch (err) {
        results.push({ email: user.email, status: 'failed', error: err.message });
      }
    }

    return Response.json({ 
      word: word.word, 
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});