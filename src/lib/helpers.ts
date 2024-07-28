export function trimText(input: string, maxLength: number = 100): string {
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength - 3) + "...";
}

export function getCurrentTimeInCST(): Date {
  // Create a date object with the current UTC time
  const now = new Date();

  // Convert the UTC time to CST (UTC-6), accounting for Daylight Saving Time if needed
  const offsetCST = -5; // Adjust this based on Daylight Saving Time (CST is UTC-6, CDT is UTC-5)
  now.setHours(now.getUTCHours() + offsetCST);

  return now;
}

export function formatTimeForCST(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // This will format the time in 12-hour format with AM/PM
    timeZone: "America/Chicago", // CST/CDT is typically represented by the America/Chicago timezone
  };

  let formattedTime = new Intl.DateTimeFormat("en-US", options).format(date);

  // Append the time zone abbreviation. You can automate this with libraries like `moment-timezone`.
  // For simplicity, here I'm just appending "CST", but do remember that CST switches to CDT during Daylight Saving Time.
  formattedTime += " CST"; // You might want to dynamically check and append CDT during DST

  return formattedTime;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
