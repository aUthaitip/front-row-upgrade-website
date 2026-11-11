import { useLanguage } from "../i18n";
import type { FrontRowUpgradeResult, PriorityModes } from "../core/types";
export const points = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
export function Winner({ result }: { result: FrontRowUpgradeResult }) {
  const { t, translateData } = useLanguage();
  const winner = result.winner;
  return (
    <section
      className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-[15px] rounded-[7px] border border-[#e87753] bg-[#fff0e9] p-[17px] min-[481px]:grid-cols-2 min-[801px]:p-5"
      aria-labelledby="winner-heading"
      aria-live="polite"
    >
      <div className="min-w-0 [&_h3]:my-2 [&_h3]:text-[29px] [&_h3]:leading-tight [&_h3]:font-bold min-[1101px]:[&_h3]:text-[31px]">
        <h2
          className="mb-1.5 text-[19px] leading-snug font-bold min-[481px]:text-xl"
          id="winner-heading"
        >
          {t("Next upgrade")}
        </h2>
        <h3>
          {winner ? translateData(winner.entry.fanName) : t("No eligible fans")}
        </h3>
        {winner ? (
          <strong className="text-[36px] leading-tight font-bold tracking-[-1px] text-[#d94d26] [&_span]:text-xl min-[1101px]:text-[37px]">
            {points(winner.score)} <span>{t("pts")}</span>
          </strong>
        ) : (
          <p>{t("Reset the simulator to restore the sample queue.")}</p>
        )}
        {winner ? (
          <p className="mt-[5px] text-xs text-[#795c51]">
            {winner.entry.id} · {t("Group")} {winner.groupId}
          </p>
        ) : null}
      </div>
      {winner ? (
        <div className="min-w-0 border-t border-[#e3c9bc] pt-3 min-[481px]:border-t-0 min-[481px]:border-l min-[481px]:pt-0 min-[481px]:pl-[22px] [&_h3]:mb-[7px] [&_h3]:text-sm [&_h3]:font-bold [&_dl]:text-xs [&_dl>div]:flex [&_dl>div]:justify-between [&_dl>div]:gap-2.5 [&_dl>div]:border-b [&_dl>div]:border-[#e9d6cc] [&_dl>div]:py-[3px] [&_dl>div:last-child]:border-0 [&_dd]:shrink-0 [&_dd]:font-bold [&_dd]:text-[#d94d26] [&_dd]:tabular-nums">
          <h3>{t("Score breakdown")}</h3>
          <dl>
            {Object.entries(winner.breakdown).map(([key, value]) => (
              <div key={key}>
                <dt>
                  {
                    {
                      waiting: t("Waiting · {minutes} min", {
                        minutes: winner.waitMinutes,
                      }),
                      loyalty: t("Loyalty points"),
                      vip: t("VIP membership"),
                      ticket: t("Ticket value"),
                      recentUpgrades: t("Group recent upgrades"),
                    }[key]
                  }
                </dt>
                <dd>
                  {value >= 0 ? "+" : ""}
                  {points(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      <p className="col-span-full border-t border-[#e5cfc3] pt-2.5 text-[11px] text-[#78523f]">
        {translateData(result.selectionReason)}
      </p>
    </section>
  );
}
export function TopCandidates({ result }: { result: FrontRowUpgradeResult }) {
  const { t, translateData } = useLanguage();
  return (
    <section
      className="min-w-0 rounded-[7px] border border-[#d5d8dd] bg-white px-3 py-[15px] min-[481px]:px-[18px] min-[481px]:py-[17px]"
      aria-labelledby="candidates-heading"
    >
      <h2
        className="mb-1.5 text-[19px] leading-snug font-bold min-[481px]:text-xl"
        id="candidates-heading"
      >
        {t("Top candidates")}
      </h2>
      <p className="mb-[13px] text-xs text-[#626873]">
        {t("One representative per fan group.")}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px] [&_tbody_tr:last-child_td]:border-0 [&_tbody_tr:last-child_th]:border-0">
          <thead className="bg-[#f0f1f3]">
            <tr>
              <th
                className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
                scope="col"
              >
                #
              </th>
              <th
                className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
                scope="col"
              >
                {t("Name")}
              </th>
              <th
                className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
                scope="col"
              >
                {t("Group")}
              </th>
              <th
                className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
                scope="col"
              >
                {t("Wait")}
              </th>
              <th
                scope="col"
                className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5 text-right"
              >
                {t("Score")}
              </th>
            </tr>
          </thead>
          <tbody>
            {result.topCandidates.map((candidate, i) => (
              <tr key={candidate.entry.id}>
                <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5">
                  {i + 1}
                </td>
                <th
                  className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
                  scope="row"
                >
                  {translateData(candidate.entry.fanName)}
                </th>
                <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5 font-mono text-[11px]">
                  {candidate.groupId}
                </td>
                <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5">
                  {candidate.waitMinutes} {t("min")}
                </td>
                <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5 font-bold text-[#d94d26] tabular-nums text-right">
                  {points(candidate.score)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!result.topCandidates.length ? (
        <p className="px-2.5 py-5 text-[13px] text-[#626873]">
          {t("No candidates at this time.")}
        </p>
      ) : null}
    </section>
  );
}
export function PrioritySettings({ modes }: { modes: PriorityModes }) {
  const { t } = useLanguage();
  return (
    <aside className="min-w-0 rounded-[7px] border border-[#d5d8dd] bg-white px-3 py-[15px] min-[481px]:px-[18px] min-[481px]:py-[17px] [&_table]:text-xs [&_th]:px-[7px] [&_th]:py-[11px] [&_td]:px-[7px] [&_td]:py-[11px]">
      <h2 className="mb-1.5 text-[19px] leading-snug font-bold min-[481px]:text-xl">
        {t("Priority settings")}
      </h2>
      <p className="mb-[13px] text-xs text-[#626873]">
        {t(
          "Each score is calculated independently. Linked accounts never pool their points.",
        )}
      </p>
      <table className="w-full border-collapse text-left text-[13px] [&_tbody_tr:last-child_td]:border-0 [&_tbody_tr:last-child_th]:border-0">
        <thead className="bg-[#f0f1f3]">
          <tr>
            <th
              className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
              scope="col"
            >
              {t("Factor")}
            </th>
            <th
              className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
              scope="col"
            >
              {t("Contribution")}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
              scope="row"
            >
              {t("Waiting time")}
            </th>
            <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5">
              {t("{weight} pts / minute", { weight: modes.rushHour ? 4 : 2 })}
            </td>
          </tr>
          <tr>
            <th
              className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
              scope="row"
            >
              {t("Loyalty")}
            </th>
            <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5">
              {t("0.1 pt / point · cap 100")}
            </td>
          </tr>
          <tr>
            <th
              className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
              scope="row"
            >
              {t("VIP status")}
            </th>
            <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5">
              {t("+{bonus} pts", { bonus: modes.vipHour ? 30 : 20 })}
            </td>
          </tr>
          <tr>
            <th
              className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
              scope="row"
            >
              {t("Ticket value")}
            </th>
            <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5">
              {t("value ÷ 1,000 · cap 10")}
            </td>
          </tr>
          <tr>
            <th
              className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
              scope="row"
            >
              {t("Recent upgrades")}
            </th>
            <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5">
              {t("−{penalty} pts / upgrade", {
                penalty: modes.fairQueue ? 100 : 50,
              })}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3.5 text-[11px] leading-relaxed text-[#626873]">
        {t(
          "Recent upgrades use the highest count in the group, capped at 1,000. Ties go to the earliest queue join, then the smallest entry ID.",
        )}
      </p>
      <div className="mt-[21px] border-t border-[#d5d8dd] pt-[13px] text-xs [&_p]:mt-1 [&_p]:text-[#626873]">
        <strong>{t("A longer wait matters.")}</strong>
        <p>
          {t(
            "Waiting points keep growing. Loyalty and ticket bonuses have a ceiling.",
          )}
        </p>
      </div>
    </aside>
  );
}
