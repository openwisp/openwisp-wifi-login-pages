import prettyBytes from "pretty-bytes";
import {timeFromSeconds} from "duration-formatter";

export const getDuration = (seconds) => {
  const number = Number(seconds);
  const h = Math.floor(number / 3600);
  const m = Math.floor((number % 3600) / 60);
  const s = Math.floor((number % 3600) % 60);
  const hDisplay = h > 0 ? h + (h === 1 ? " hr " : " hrs ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " min " : " mins ") : "";
  const sDisplay = s > 0 ? s + (s === 1 ? " sec " : " secs ") : "";
  return hDisplay + mDisplay + sDisplay;
};

export const getDateTimeFormat = (language, timeOption, date) => {
  if (typeof Intl !== "undefined") {
    return new Intl.DateTimeFormat(language, timeOption).format(
      new Date(date),
    );
  }
  return String(new Date(date));
};

export const getUserCheckFormattedValue = (value, type) => {
  const intValue = parseInt(value, 10);
  switch (type) {
    case "bytes":
      return intValue === 0
        ? 0
        : prettyBytes(intValue, {space: true, maximumFractionDigits: 2});
    case "seconds":
      return timeFromSeconds(intValue);
    default:
      return value;
  }
};
