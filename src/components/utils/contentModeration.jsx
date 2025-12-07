import { InvokeLLM } from '@/integrations/Core';

// רשימת מילות מפתח מסוכנות
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
  // Hebrew patterns
  /\b(רצח|הרג|מוות ל)\s+[א-ת]+/,
  /\b(בומבה|חבלה|טרור)\b/,
  /\b(נאצי|היטלר)\b/
];

// פונקציה לבדיקת תוכן מסוכן
export const moderateContent = async (content) => {
  if (!content || typeof content !== 'string') return { safe: true };
  
  const lowerContent = content.toLowerCase();
  
  // בדיקה ראשונית - מילות מפתח מסוכנות
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return {
        safe: false,
        reason: 'dangerous_keyword',
        keyword: keyword,
        severity: 'high'
      };
    }
  }
  
  // בדיקת דפוסים של דברי שנאה
  for (const pattern of HATE_SPEECH_PATTERNS) {
    if (pattern.test(content)) {
      return {
        safe: false,
        reason: 'hate_speech_pattern',
        severity: 'high'
      };
    }
  }
  
  // בדיקה מתקדמת עם AI אם התוכן ארוך
  if (content.length > 50) {
    try {
      const aiResponse = await InvokeLLM({
        prompt: `Analyze this text for dangerous content, terrorism, hate speech, antisemitism, or incitement to violence. Respond ONLY with a JSON object:

Text to analyze: "${content}"

Return: {"safe": true/false, "reason": "explanation", "severity": "low"/"medium"/"high"}`,
        response_json_schema: {
          type: "object",
          properties: {
            safe: { type: "boolean" },
            reason: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high"] }
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
      console.error('AI moderation failed:', error);
      // אם AI נכשל, נמשיך עם הבדיקות הבסיסיות
    }
  }
  
  return { safe: true };
};

// פונקציה לבדיקת פרופיל משתמש
export const moderateUserProfile = async (userData) => {
  const checks = [];
  
  if (userData.bio) {
    const bioCheck = await moderateContent(userData.bio);
    if (!bioCheck.safe) checks.push({ field: 'bio', ...bioCheck });
  }
  
  if (userData.full_name) {
    const nameCheck = await moderateContent(userData.full_name);
    if (!nameCheck.safe) checks.push({ field: 'name', ...nameCheck });
  }
  
  if (userData.location) {
    const locationCheck = await moderateContent(userData.location);
    if (!locationCheck.safe) checks.push({ field: 'location', ...locationCheck });
  }
  
  return {
    safe: checks.length === 0,
    issues: checks
  };
};

// פונקציה לבדיקת rate limiting
export const checkRateLimit = (userId, action, maxAttempts = 5, windowMinutes = 15) => {
  const key = `rateLimit_${userId}_${action}`;
  const now = Date.now();
  const window = windowMinutes * 60 * 1000;
  
  let attempts = JSON.parse(localStorage.getItem(key) || '[]');
  attempts = attempts.filter(timestamp => now - timestamp < window);
  
  if (attempts.length >= maxAttempts) {
    return {
      allowed: false,
      resetIn: Math.ceil((attempts[0] + window - now) / 60000)
    };
  }
  
  attempts.push(now);
  localStorage.setItem(key, JSON.stringify(attempts));
  
  return { allowed: true };
};