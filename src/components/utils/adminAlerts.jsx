import { Notification, User } from '@/entities/all';

// פונקציה לשליחת התראות אבטחה למנהלים
export const sendSecurityAlert = async (alertType, userEmail, userName, details) => {
  try {
    // קבלת רשימת מנהלים
    const admins = await User.filter({ role: 'admin' });
    
    if (admins.length === 0) {
      console.warn('No administrators found to send security alert');
      return false;
    }

    const alertMessages = {
      dangerous_content: `🚨 SECURITY ALERT: User ${userName} (${userEmail}) attempted to post dangerous content.`,
      suspicious_activity: `⚠️ SECURITY ALERT: Suspicious activity detected from user ${userName} (${userEmail}).`,
      mass_reporting: `📊 SECURITY ALERT: User ${userName} (${userEmail}) has been reported multiple times.`,
      account_breach: `🔒 SECURITY ALERT: Potential account breach detected for ${userName} (${userEmail}).`
    };

    const alertContent = `${alertMessages[alertType] || 'Security alert'}
    
Details: ${details}
Time: ${new Date().toISOString()}
    
Please review immediately in the admin dashboard.`;

    // שליחה לכל המנהלים
    for (const admin of admins) {
      await Notification.create({
        recipient_email: admin.email,
        sender_email: 'system@oneolam.com',
        sender_name: 'OneOlam Security System',
        type: 'security_alert',
        content: alertContent,
        is_read: false
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to send security alert:', error);
    return false;
  }
};

// פונקציה למעקב אחר פעילות חשודה
export const trackSuspiciousActivity = (userEmail, activityType, details = '') => {
  const key = `suspicious_${userEmail}`;
  const activities = JSON.parse(localStorage.getItem(key) || '[]');
  
  activities.push({
    type: activityType,
    timestamp: Date.now(),
    details
  });
  
  // שמירה של רק פעילויות מה-24 שעות האחרונות
  const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const recentActivities = activities.filter(a => a.timestamp > dayAgo);
  
  localStorage.setItem(key, JSON.stringify(recentActivities));
  
  // אם יש הרבה פעילות חשודה - שליחת התראה
  if (recentActivities.length >= 10) {
    sendSecurityAlert('suspicious_activity', userEmail, 'Unknown User', 
      `${recentActivities.length} suspicious activities in 24 hours: ${recentActivities.map(a => a.type).join(', ')}`);
  }
  
  return recentActivities;
};