import { useLanguage } from "../i18n";
import { useState } from "react";
import type { FanGroup, ExcludedEntry, TicketQueueEntry } from "../core/types";
const PAGE_SIZE = 10;
function Pager({
  page,
  count,
  onChange,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
}) {
  const { t } = useLanguage();
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e7eb] px-[9px] pt-2.5 text-[11px] text-[#626873] [&_button]:px-[9px] [&_button]:py-[5px] [&_button]:text-[11px]">
      <span>
        {t("{from}–{to} of {count}", {
          from: count ? page * PAGE_SIZE + 1 : 0,
          to: Math.min((page + 1) * PAGE_SIZE, count),
          count,
        })}
      </span>
      {pages > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="cursor-pointer rounded-[5px] border border-[#bbc0c7] bg-white px-2.5 py-2 text-xs font-medium text-inherit transition-colors hover:border-[#8b929d] hover:bg-[#f4f5f6] disabled:cursor-default disabled:opacity-40 aria-pressed:border-[#d94d26] aria-pressed:bg-[#d94d26] aria-pressed:text-white min-[481px]:px-3.5 min-[481px]:py-[9px] min-[481px]:text-[13px]"
            disabled={!page}
            onClick={() => onChange(page - 1)}
          >
            {t("Previous")}
          </button>
          <button
            className="cursor-pointer rounded-[5px] border border-[#bbc0c7] bg-white px-2.5 py-2 text-xs font-medium text-inherit transition-colors hover:border-[#8b929d] hover:bg-[#f4f5f6] disabled:cursor-default disabled:opacity-40 aria-pressed:border-[#d94d26] aria-pressed:bg-[#d94d26] aria-pressed:text-white min-[481px]:px-3.5 min-[481px]:py-[9px] min-[481px]:text-[13px]"
            disabled={page >= pages - 1}
            onClick={() => onChange(page + 1)}
          >
            {t("Next")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
function LoyaltyInput({
  entry,
  onChange,
}: {
  entry: TicketQueueEntry;
  onChange: (id: string, value: number) => void;
}) {
  const { t, translateData } = useLanguage();
  return (
    <label className="flex items-center justify-between gap-2.5 text-[11px]">
      <span>{translateData(entry.fanName)}</span>
      <input
        className="w-[88px] shrink-0 rounded border border-[#bfc4cb] bg-white px-2 py-1.5 text-[13px] text-inherit"
        type="number"
        min="0"
        max="1000"
        step="1"
        aria-label={t("Loyalty points for {name}", {
          name: translateData(entry.fanName),
        })}
        value={entry.loyaltyPoints ?? 0}
        onChange={(event) => {
          const value = event.currentTarget.valueAsNumber;
          onChange(
            entry.id,
            Number.isFinite(value)
              ? Math.max(0, Math.min(1000, Math.floor(value)))
              : 0,
          );
        }}
      />
    </label>
  );
}
function GroupDetails({
  group,
  onLoyaltyChange,
}: {
  group: FanGroup;
  onLoyaltyChange: (id: string, value: number) => void;
}) {
  const { t, translateData } = useLanguage();
  const [memberPage, setMemberPage] = useState(0);
  const [connectionPage, setConnectionPage] = useState(0);
  const safeMemberPage = Math.min(
    memberPage,
    Math.max(0, Math.ceil(group.entries.length / PAGE_SIZE) - 1),
  );
  const safeConnectionPage = Math.min(
    connectionPage,
    Math.max(0, Math.ceil(group.connectionReasons.length / PAGE_SIZE) - 1),
  );
  return (
    <div className="grid grid-cols-1 items-start gap-2.5 border-t border-[#e5e7eb] px-0.5 py-3.5 min-[481px]:grid-cols-[160px_minmax(0,1fr)] min-[801px]:grid-cols-[170px_minmax(0,1fr)_240px] min-[801px]:gap-5 min-[1101px]:grid-cols-[200px_minmax(0,1fr)_280px]">
      <div className="[&>span]:ml-2.5 [&>span]:text-[10px] [&>span]:text-[#626873] [&_p]:mt-[5px] [&_p]:text-[11px] [&_p]:text-[#626873] [&_p_strong]:block [&_p_strong]:text-xs [&_p_strong]:text-[#303744]">
        <strong className="font-mono text-[11px]">{group.id}</strong>
        <span>
          {group.entries.length}{" "}
          {t(group.entries.length === 1 ? "account" : "accounts")}
        </span>
        <p>
          {t("Representative")}
          <strong>{translateData(group.representative.entry.fanName)}</strong>
        </p>
      </div>
      <div className="min-w-0 pt-0.5 text-[11px] break-words text-[#626873] [&_ul]:list-disc [&_ul]:pl-3.5 [&_li+li]:mt-1">
        {group.connectionReasons.length ? (
          <>
            <ul>
              {group.connectionReasons
                .slice(
                  safeConnectionPage * PAGE_SIZE,
                  (safeConnectionPage + 1) * PAGE_SIZE,
                )
                .map((reason, i) => (
                  <li key={i}>{translateData(reason)}</li>
                ))}
            </ul>
            {group.connectionReasons.length > PAGE_SIZE ? (
              <Pager
                page={safeConnectionPage}
                count={group.connectionReasons.length}
                onChange={setConnectionPage}
              />
            ) : null}
          </>
        ) : (
          <p>{t("No shared identifiers with another eligible entry.")}</p>
        )}
      </div>
      <div className="col-span-full grid gap-1.5 min-[481px]:max-w-[400px] min-[801px]:col-span-1">
        {group.entries
          .slice(safeMemberPage * PAGE_SIZE, (safeMemberPage + 1) * PAGE_SIZE)
          .map((entry) => (
            <LoyaltyInput
              key={entry.id}
              entry={entry}
              onChange={onLoyaltyChange}
            />
          ))}
        {group.entries.length > PAGE_SIZE ? (
          <Pager
            page={safeMemberPage}
            count={group.entries.length}
            onChange={setMemberPage}
          />
        ) : null}
      </div>
    </div>
  );
}
export function FanGroups({
  groups,
  onLoyaltyChange,
}: {
  groups: FanGroup[];
  onLoyaltyChange: (id: string, value: number) => void;
}) {
  const { t } = useLanguage();
  const [requestedPage, setPage] = useState(0);
  const page = Math.min(
    requestedPage,
    Math.max(0, Math.ceil(groups.length / PAGE_SIZE) - 1),
  );
  return (
    <section className="min-w-0 rounded-[7px] border border-[#d5d8dd] bg-white px-3 py-[15px] min-[481px]:px-[18px] min-[481px]:py-[17px] mb-4">
      <div className="flex items-center justify-between gap-[15px] [&>span]:shrink-0 [&>span]:text-[11px] [&>span]:text-[#626873]">
        <h2 className="mb-1.5 text-[19px] leading-snug font-bold min-[481px]:text-xl">
          {t("Fan groups")}
        </h2>
        <span>{t("{count} groups", { count: groups.length })}</span>
      </div>
      <p className="mb-[13px] text-xs text-[#626873]">
        {t(
          "Inspect connections and edit loyalty points for any eligible entry.",
        )}
      </p>
      {groups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((group) => (
        <GroupDetails
          key={group.id}
          group={group}
          onLoyaltyChange={onLoyaltyChange}
        />
      ))}
      {!groups.length ? (
        <p className="px-2.5 py-5 text-[13px] text-[#626873]">
          {t("No eligible fan groups.")}
        </p>
      ) : null}
      <Pager page={page} count={groups.length} onChange={setPage} />
    </section>
  );
}
export function ExcludedEntries({ entries }: { entries: ExcludedEntry[] }) {
  const { t, translateData } = useLanguage();
  const [requestedPage, setPage] = useState(0);
  const page = Math.min(
    requestedPage,
    Math.max(0, Math.ceil(entries.length / PAGE_SIZE) - 1),
  );
  return (
    <section className="min-w-0 rounded-[7px] border border-[#d5d8dd] bg-white px-3 py-[15px] min-[481px]:px-[18px] min-[481px]:py-[17px] mb-4">
      <div className="flex items-center justify-between gap-[15px] [&>span]:shrink-0 [&>span]:text-[11px] [&>span]:text-[#626873]">
        <h2 className="mb-1.5 text-[19px] leading-snug font-bold min-[481px]:text-xl">
          {t("Excluded entries")}
        </h2>
        <span>{t("{count} excluded", { count: entries.length })}</span>
      </div>
      <p className="mb-[13px] text-xs text-[#626873]">
        {t("Ineligible entries remain visible with a clear reason.")}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px] [&_tbody_tr:last-child_td]:border-0 [&_tbody_tr:last-child_th]:border-0">
          <thead className="bg-[#f0f1f3]">
            <tr>
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
                {t("Entry")}
              </th>
              <th
                className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
                scope="col"
              >
                {t("Reason")}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries
              .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
              .map(({ entry, reason }) => (
                <tr key={entry.id}>
                  <th
                    className="border-b border-[#e5e7eb] px-[7px] py-2 text-xs font-semibold min-[481px]:px-2.5"
                    scope="row"
                  >
                    {translateData(entry.fanName)}
                  </th>
                  <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5 font-mono text-[11px]">
                    {entry.id}
                  </td>
                  <td className="border-b border-[#e5e7eb] px-[7px] py-2 min-[481px]:px-2.5">
                    {translateData(reason)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!entries.length ? (
        <p className="px-2.5 py-5 text-[13px] text-[#626873]">
          {t("No excluded entries.")}
        </p>
      ) : null}
      <Pager page={page} count={entries.length} onChange={setPage} />
    </section>
  );
}
