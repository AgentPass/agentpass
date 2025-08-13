export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const daysToDateRange = (days: string): [Date, Date] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const fromDate = new Date(yesterday);
  fromDate.setDate(fromDate.getDate() - parseInt(days) + 1);
  fromDate.setHours(0, 0, 0, 0);

  return [fromDate, yesterday];
};

export const formatNumber = (num: number): string => num.toLocaleString("en-US");

export const formatPercent = (decimal: number): string => (decimal * 100).toFixed(1) + "%";

export const formatResponseTime = (ms: number): string => {
  if (ms < 0) {
    ms = -ms;
  }
  if (ms === 0) {
    return "0 milliseconds";
  }
  const time = {
    day: Math.floor(ms / 86400000),
    hour: Math.floor(ms / 3600000) % 24,
    minute: Math.floor(ms / 60000) % 60,
    second: Math.floor(ms / 1000) % 60,
    millisecond: Math.floor(ms) % 1000,
  };
  return Object.entries(time)
    .filter((val) => val[1] !== 0)
    .map(([key, val]) => `${val} ${key}${val !== 1 ? "s" : ""}`)
    .join(", ");
};
