import { useLanguage } from "./i18n";
import { useMemo, useState } from "react";
import { buildFrontRowUpgradeQueue, DEFAULT_MODES } from "./core/queue";
import type { PriorityModes } from "./core/types";
import { INITIAL_TIME, SAMPLE_ENTRIES } from "./sample-data";
import { QueueControls } from "./components/QueueControls";
import { Winner, TopCandidates, PrioritySettings } from "./components/Results";
import { FanGroups, ExcludedEntries } from "./components/QueueDetails";
export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const [entries, setEntries] = useState(() =>
    SAMPLE_ENTRIES.map((entry) => ({ ...entry })),
  );
  const [now, setNow] = useState(INITIAL_TIME);
  const [modes, setModes] = useState<PriorityModes>({ ...DEFAULT_MODES });
  const result = useMemo(
    () => buildFrontRowUpgradeQueue(entries, new Date(now), modes),
    [entries, now, modes],
  );
  function reset() {
    setEntries(SAMPLE_ENTRIES.map((entry) => ({ ...entry })));
    setNow(INITIAL_TIME);
    setModes({ ...DEFAULT_MODES });
  }
  return (
    <div className="mx-auto max-w-[1440px] bg-white px-3.5 font-sans leading-relaxed text-[#1d232d] min-[481px]:px-5 min-[801px]:px-[34px] [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-blue-600 [&_input:focus-visible]:outline-3 [&_input:focus-visible]:outline-blue-600 [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-blue-600">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[#d5d8dd] py-3 text-sm">
        <a
          className="text-xl font-extrabold tracking-[-1px] text-inherit no-underline min-[481px]:text-[23px]"
          href="#main"
        >
          FRONT ROW
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden text-xs text-[#626873] sm:inline">
            {t("Queue simulator")}
          </span>
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label={t("Language")}
          >
            {(["th", "en"] as const).map((code) => (
              <button
                className="cursor-pointer rounded-[5px] border border-[#bbc0c7] bg-white px-2.5 py-2 text-xs font-medium text-inherit transition-colors hover:border-[#8b929d] hover:bg-[#f4f5f6] disabled:cursor-default disabled:opacity-40 aria-pressed:border-[#d94d26] aria-pressed:bg-[#d94d26] aria-pressed:text-white min-[481px]:px-3.5 min-[481px]:py-[9px] min-[481px]:text-[13px]"
                key={code}
                lang={code}
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main id="main">
        <div className="mt-6 mb-[22px]">
          <h1 className="mb-[5px] text-[28px] leading-snug font-bold tracking-tight min-[481px]:text-[34px]">
            {t("Front Row Upgrade Queue")}
          </h1>
          <p className="text-sm text-[#626873] min-[481px]:text-[17px]">
            {t("Fair upgrades. Every decision explained.")}
          </p>
        </div>
        <QueueControls
          now={now}
          modes={modes}
          advance={(minutes) =>
            setNow((value) =>
              new Date(Date.parse(value) + minutes * 60_000).toISOString(),
            )
          }
          toggle={(key) =>
            setModes((value) => ({ ...value, [key]: !value[key] }))
          }
          reset={reset}
        />
        <div className="mb-5 grid grid-cols-1 items-stretch gap-[22px] min-[801px]:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] min-[1101px]:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <Winner result={result} />
            <TopCandidates result={result} />
          </div>
          <PrioritySettings modes={modes} />
        </div>
        <FanGroups
          groups={result.fanGroups}
          onLoyaltyChange={(id, loyaltyPoints) =>
            setEntries((value) =>
              value.map((entry) =>
                entry.id === id ? { ...entry, loyaltyPoints } : entry,
              ),
            )
          }
        />
        <ExcludedEntries entries={result.excludedEntries} />
        <footer className="flex flex-col justify-between gap-1 pt-[5px] pb-6 text-[11px] text-[#626873] min-[481px]:flex-row min-[481px]:gap-[15px]">
          <span>
            {t(
              "{entries} entries · {groups} eligible groups · {excluded} excluded",
              {
                entries: entries.length,
                groups: result.fanGroups.length,
                excluded: result.excludedEntries.length,
              },
            )}
          </span>
          <span>{t("Simulation only · No tickets are issued")}</span>
        </footer>
      </main>
    </div>
  );
}
