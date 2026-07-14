import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Content moderation rules (mirrors src/components/utils/contentModeration.jsx).
// These run server-side so they cannot be bypassed by calling the SDK directly.
const DANGEROUS_KEYWORDS = [
  'bomb', 'terror', 'kill', 'death to', 'destroy', 'attack', 'violence',
  'בומבה', 'טרור', 'רצח', 'מוות ל', 'להרוס', 'תקיפה', 'אלימות',
  'nazi', 'hitler', 'holocaust denial', 'jews control', 'blood libel',
  'נאצי', 'היטלר', 'הכחשת שואה', 'יהודים שולטים', 'עלילת דם'
];

const HATE_SPEECH_PATTERNS = [
  /\b(kill|murder|death to)\s+[a-z]+/i,
  /\b(bomb|explosive|terror)\b/i,
  /\b(nazi|hitler)\b/i,
  /\b(jews control|jewish conspiracy)\b/i,
  /\b(רצח|הרג|מוות ל)\s+[א-ת]+/,
  /\b(בומבה|חבלה|טרור)\b/,
  /\b(נאצי|היטלר)\b/
];

async function moderateContent(base44, content) {
  if (!content || typeof content !== 'string') return { safe: true };
  const lowerContent = content.toLowerCase();

  for (const keyword of DANGEROUS_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return { safe: false, reason: 'dangerous_keyword', keyword, severity: 'high' };
    }
  }

  for (const pattern of HATE_SPEECH_PATTERNS) {
    if (pattern.test(content)) {
      return { safe: false, reason: 'hate_speech_pattern', severity: 'high' };
    }
  }

  // Advanced AI check for longer content.
  if (content.length > 50) {
    try {
      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Analyze this text for dangerous content, terrorism, hate speech, antisemitism, or incitement to violence. Respond ONLY with a JSON object:\n\nText to analyze: "${content}"\n\nReturn: {"safe": true/false, "reason": "explanation", "severity": "low"/"medium"/"high"}`,
        response_json_schema: {
          type: 'object',
          properties: {
            safe: { type: 'boolean' },
            reason: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        }
      });
      if (!aiResponse.safe) {
        return {
          safe: false,
          reason: aiResponse.reason,
          severity: aiResponse.severity || 'medium',
          ai_detected: true
        };
      }
    } catch (error) {
      // If AI moderation fails, fall back to the keyword/pattern checks above.
    }
  }

  return { safe: true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { content, image_url, video_url, community_name } = body;

    const hasContent = content && typeof content === 'string' && content.trim();
    const hasMedia = image_url || video_url;
    if (!hasContent && !hasMedia) {
      return Response.json({ error: 'empty_post' }, { status: 400 });
    }

    // --- Server-side rate limiting: max 5 posts per 15 minutes per user. ---
    const MAX_POSTS = 5;
    const WINDOW_MS = 15 * 60 * 1000;
    const recentPosts = await base44.entities.Post.filter(
      { created_by_id: user.id },
      '-created_date',
      10
    );
    const now = Date.now();
    const recentInRange = recentPosts.filter((p) => {
      const created = new Date(p.created_date).getTime();
      return (now - created) < WINDOW_MS;
    });
    if (recentInRange.length >= MAX_POSTS) {
      const oldest = recentInRange[recentInRange.length - 1];
      const resetIn = Math.ceil(
        (new Date(oldest.created_date).getTime() + WINDOW_MS - now) / 60000
      );
      return Response.json(
        { error: 'rate_limited', resetIn: Math.max(1, resetIn) },
        { status: 429 }
      );
    }

    // --- Server-side content moderation. ---
    if (hasContent) {
      const moderationResult = await moderateContent(base44, content);
      if (!moderationResult.safe) {
        // Notify admins. Notification create is admin-only, so use service role.
        if (moderationResult.severity === 'high') {
          try {
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: 'admin@oneolam.com',
              sender_email: user.email,
              sender_name: user.full_name || 'Unknown',
              type: 'report_post',
              content: `SECURITY ALERT: User ${user.full_name || user.email} attempted to post dangerous content. Reason: ${moderationResult.reason}. Content: "${(content || '').substring(0, 100)}..."`,
              is_read: false
            });
          } catch (_e) {
            // Alert failure should not block the moderation decision.
          }
        }
        return Response.json(
          { error: 'content_blocked', reason: moderationResult.reason },
          { status: 400 }
        );
      }
    }

    // Extract hashtags.
    const hashtags = hasContent ? (content.match(/#[א-תa-zA-Z0-9_]+/g) || []) : [];

    // Create the post with the user's own scope so ownership (created_by) is
    // preserved for downstream delete/author/chat flows.
    const post = await base44.entities.Post.create({
      content: hasContent ? content.trim() : '',
      image_url: image_url || null,
      video_url: video_url || null,
      author_name: user.full_name || 'Unknown',
      author_avatar: user.avatar || null,
      tags: hashtags,
      community_name: community_name || null
    });

    return Response.json({ success: true, post });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});