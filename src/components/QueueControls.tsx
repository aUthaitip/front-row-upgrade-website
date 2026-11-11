import type { TranslationKey } from "../data/translations";
import { useLanguage } from "../i18n";
import type { PriorityModes } from "../core/types";
type Props = {
  now: string;
  modes: PriorityModes;
  advance: (minutes: number) => void;
  toggle: (key: keyof PriorityModes) => void;
  reset: () => void;
};
const MODES: {
  key: keyof PriorityModes;
  label: TranslationKey;
  title: TranslationKey;
}[] = [
  {
    key: "rushHour",
    label: "Rush Hour",
    title: "Waiting time earns 4 points per minute instead of 2.",
  },
  {
    key: "vipHour",
    label: "VIP Hour",
    title: "VIP bonus increases from 20 to 30 points.",
  },
  {
    key: "fairQueue",
    label: "Fair Queue Mode",
    title: "Recent group upgrades cost 100 points each instead of 50.",
  },
];
export function QueueControls({ now, modes, advance, toggle, reset }: Props) {
  const { t, language } = useLanguage();
  const label = new Intl.DateTimeFormat(
    language === "th" ? "th-TH-u-ca-gregory" : "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      hour12: false,
    },
  ).format(new Date(now));
  return (
    <div className="mb-[26px] flex flex-wrap items-center justify-between gap-5">
      <div className="flex flex-wrap items-center gap-3.5">
        <time
          className="rounded-[5px] border border-[#bfc4cb] px-3 py-[9px] text-[13px] tabular-nums [&_span]:ml-[5px] [&_span]:text-[11px] [&_span]:text-[#626873]"
          dateTime={now}
          aria-live="polite"
        >
          {label} <span>UTC</span>
        </time>
        <div className="flex flex-wrap items-center gap-2">
          {[5, 15, 60].map((min) => (
            <button
              className="cursor-pointer rounded-[5px] border border-[#d94d26] bg-white px-2.5 py-2 text-xs font-medium text-[#d94d26] transition-colors hover:bg-[#fff0e9] disabled:cursor-default disabled:opacity-40 min-[481px]:px-3.5 min-[481px]:py-[9px] min-[481px]:text-[13px]"
              key={min}
              onClick={() => advance(min)}
            >
              +{min === 60 ? t("1 hour") : `${min} ${t("min")}`}
            </button>
          ))}
          <button
            className="cursor-pointer rounded-[5px] border border-[#bbc0c7] bg-white px-2.5 py-2 text-xs font-medium text-inherit transition-colors hover:border-[#8b929d] hover:bg-[#f4f5f6] disabled:cursor-default disabled:opacity-40 aria-pressed:border-[#d94d26] aria-pressed:bg-[#d94d26] aria-pressed:text-white min-[481px]:px-3.5 min-[481px]:py-[9px] min-[481px]:text-[13px]"
            onClick={reset}
          >
            {t("Reset")}
          </button>
        </div>
      </div>
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t("Priority modes")}
      >
        {MODES.map((mode) => (
          <button
            className="cursor-pointer rounded-[5px] border border-[#bbc0c7] bg-white px-2.5 py-2 text-xs font-medium text-inherit transition-colors hover:border-[#8b929d] hover:bg-[#f4f5f6] disabled:cursor-default disabled:opacity-40 aria-pressed:border-[#d94d26] aria-pressed:bg-[#d94d26] aria-pressed:text-white min-[481px]:px-3.5 min-[481px]:py-[9px] min-[481px]:text-[13px]"
            key={mode.key}
            aria-pressed={modes[mode.key]}
            title={t(mode.title)}
            onClick={() => toggle(mode.key)}
          >
            {t(mode.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
