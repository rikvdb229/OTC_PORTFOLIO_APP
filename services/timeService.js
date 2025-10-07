const NtpTimeSync = require('ntp-time-sync').NtpTimeSync;

// Initialize NTP client with reliable NTP servers
const ntpClient = NtpTimeSync.getInstance({
  servers: [
    'time.google.com',      // Google's NTP (very reliable)
    'time.cloudflare.com',  // Cloudflare NTP (very reliable)
    '0.europe.pool.ntp.org', // European NTP pool
    'pool.ntp.org'          // NTP Pool Project
  ],
  sampleCount: 4,           // Fewer samples for faster response
  replyTimeout: 5000        // 5 second timeout per server
});

async function getBelgianTime() {
  try {
    // Get current time from NTP servers
    const ntpTime = await ntpClient.getTime();

    // NTP returns UTC time, convert to Belgian time (CET/CEST)
    // Belgium is UTC+1 (CET) in winter, UTC+2 (CEST) in summer
    const utcDate = ntpTime.now;

    // Use Intl API to get Belgian local time with proper DST handling
    const belgianTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(utcDate);

    const [hour, minute] = belgianTime.split(':').map(Number);

    return {
      isAfter9AM: hour >= 9,
      hour,
      minute,
      datetime: utcDate.toISOString(),
      offset: ntpTime.offset // Time difference between system and NTP (useful for tamper detection)
    };
  } catch (error) {
    console.error('❌ NTP time sync failed:', error.message);
    throw new Error('Cannot verify Belgian time');
  }
}

function minutesUntil902AM(hour, minute) {
  if (hour >= 9) return 0;
  const minutesUntil9 = (9 - hour) * 60 - minute;
  return minutesUntil9 + 2;
}

module.exports = { getBelgianTime, minutesUntil902AM };
