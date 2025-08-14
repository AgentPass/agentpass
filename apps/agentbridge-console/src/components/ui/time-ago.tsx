import JsTimeAgo from "javascript-time-ago";
import { useMemo } from "react";

import { formatDateTime } from "@/utils/formatters.ts";
import en from "javascript-time-ago/locale/en";

JsTimeAgo.addDefaultLocale(en);

const timeAgo = new JsTimeAgo("en-US");

interface TimeAgoProps {
  date: string;
  className?: string;
}

export const TimeAgo = ({ date, className = "" }: TimeAgoProps) => {
  const fullDate = useMemo(() => formatDateTime(date), [date]);
  const humanFormatted = useMemo(() => timeAgo.format(new Date(date)), [date]);

  return (
    <span title={fullDate} className={className}>
      {humanFormatted}
    </span>
  );
};
