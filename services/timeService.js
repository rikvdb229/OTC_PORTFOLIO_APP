const fetch = require('node-fetch');

async function getBelgianTime() {
  try {
    const response = await fetch('http://worldtimeapi.org/api/timezone/Europe/Brussels', {
      timeout: 5000
    });
    if (response.ok) {
      const data = await response.json();
      const hour = parseInt(data.datetime.substring(11, 13));
      const minute = parseInt(data.datetime.substring(14, 16));
      return {
        isAfter9AM: hour >= 9,
        hour,
        minute,
        datetime: data.datetime
      };
    }
  } catch (error) {
    console.warn('⚠️ WorldTimeAPI failed, trying fallback');
  }

  try {
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Europe/Brussels', {
      timeout: 5000
    });
    const data = await response.json();
    return {
      isAfter9AM: data.hour >= 9,
      hour: data.hour,
      minute: data.minute,
      datetime: data.dateTime
    };
  } catch (error) {
    console.error('❌ All time APIs failed');
    throw new Error('Cannot verify Belgian time');
  }
}

function minutesUntil902AM(hour, minute) {
  if (hour >= 9) return 0;
  const minutesUntil9 = (9 - hour) * 60 - minute;
  return minutesUntil9 + 2;
}

module.exports = { getBelgianTime, minutesUntil902AM };
