"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSystemTestIncidentActions } from "@/lib/api/systemTestIncidentActions";
import type { SystemTestIncidentActionListItem } from "@/types/systemTestIncidentActions";
import { SystemTestIncidentActionSummaryCards } from "./SystemTestIncidentActionSummaryCards";
import { SystemTestIncidentActionsPanel } from "./SystemTestIncidentActionsPanel";

const ACTIVE_STATUSES = ["open", "investigating", "fixing", "validating"] as const;

type PanelState = {
  items: SystemTestIncidentActionListItem[];
  loading: boolean;
  error: string | null;
};

const emptyPanel = (): PanelState => ({
  items: [],
  loading: true,
  error: null,
});

type Props = {
  accessToken: string;
};

export function SystemTestIncidentOperationsSection({ accessToken }: Props) {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [unassignedCriticalCount, setUnassignedCriticalCount] = useState<number | null>(null);
  const [needsValidationCount, setNeedsValidationCount] = useState<number | null>(null);
  const [overdueCount, setOverdueCount] = useState<number | null>(null);
  const [dueSoonCount, setDueSoonCount] = useState<number | null>(null);
  const [escalationReadyCount, setEscalationReadyCount] = useState<number | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [p1, setP1] = useState<PanelState>(emptyPanel);
  const [p2, setP2] = useState<PanelState>(emptyPanel);
  const [p3, setP3] = useState<PanelState>(emptyPanel);
  const [p4, setP4] = useState<PanelState>(emptyPanel);
  const [p5, setP5] = useState<PanelState>(emptyPanel);
  const [p6, setP6] = useState<PanelState>(emptyPanel);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      setP1({ ...emptyPanel() });
      setP2({ ...emptyPanel() });
      setP3({ ...emptyPanel() });
      setP4({ ...emptyPanel() });
      setP5({ ...emptyPanel() });
      setP6({ ...emptyPanel() });

      try {
        const [
          activeRes,
          critRes,
          needsRes,
          overdueRes,
          dueSoonRes,
          escalationRes,
        ] = await Promise.all([
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            limit: 1,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            priority: ["critical"],
            unassignedOnly: true,
            limit: 1,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            needsValidation: true,
            limit: 1,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            slaStatus: ["overdue"],
            limit: 1,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            slaStatus: ["due_soon"],
            limit: 1,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            escalationReady: true,
            limit: 1,
          }),
        ]);

        if (cancelled) return;
        setActiveCount(activeRes.count);
        setUnassignedCriticalCount(critRes.count);
        setNeedsValidationCount(needsRes.count);
        setOverdueCount(overdueRes.count);
        setDueSoonCount(dueSoonRes.count);
        setEscalationReadyCount(escalationRes.count);
      } catch (e) {
        if (!cancelled) {
          setSummaryError(
            e instanceof Error ? e.message : "Failed to load incident action summary.",
          );
          setActiveCount(null);
          setUnassignedCriticalCount(null);
          setNeedsValidationCount(null);
          setOverdueCount(null);
          setDueSoonCount(null);
          setEscalationReadyCount(null);
        }
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [r1, r2, r3, r4, r5, r6] = await Promise.all([
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            priority: ["critical"],
            unassignedOnly: true,
            limit: 8,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            needsValidation: true,
            limit: 8,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            limit: 12,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            status: ["resolved"],
            limit: 8,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            slaStatus: ["overdue"],
            limit: 8,
          }),
          fetchSystemTestIncidentActions(accessToken, {
            status: [...ACTIVE_STATUSES],
            escalationReady: true,
            limit: 8,
          }),
        ]);
        if (cancelled) return;
        setP1({
          items: r1.items,
          loading: false,
          error: null,
        });
        setP2({ items: r2.items, loading: false, error: null });
        setP3({ items: r3.items, loading: false, error: null });
        setP4({ items: r4.items, loading: false, error: null });
        setP5({ items: r5.items, loading: false, error: null });
        setP6({ items: r6.items, loading: false, error: null });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load panels";
        if (!cancelled) {
          setP1((s) => ({ ...s, loading: false, error: msg }));
          setP2((s) => ({ ...s, loading: false, error: msg }));
          setP3((s) => ({ ...s, loading: false, error: msg }));
          setP4((s) => ({ ...s, loading: false, error: msg }));
          setP5((s) => ({ ...s, loading: false, error: msg }));
          setP6((s) => ({ ...s, loading: false, error: msg }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <section className="space-y-8 border-b border-white/10 pb-10">
      <SystemTestIncidentActionSummaryCards
        activeCount={activeCount}
        unassignedCriticalCount={unassignedCriticalCount}
        needsValidationCount={needsValidationCount}
        overdueCount={overdueCount}
        dueSoonCount={dueSoonCount}
        escalationReadyCount={escalationReadyCount}
        loading={summaryLoading}
        error={summaryError}
      />

      <div>
        <h3 className="text-base font-semibold text-white">Action queues</h3>
        <p className="mt-1 text-sm text-white/50">
          Click a row to open the operator workstation.{" "}
          <Link href="/admin/system-tests/incidents" className="text-teal-300 hover:text-teal-200">
            Full incident actions list
          </Link>
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SystemTestIncidentActionsPanel
            title="Unassigned critical"
            subtitle="Critical priority, active, no owner"
            items={p1.items}
            loading={p1.loading}
            error={p1.error}
            emptyLabel="No unassigned critical incidents."
            viewAllHref="/admin/system-tests/incidents?preset=unassigned-critical"
          />
          <SystemTestIncidentActionsPanel
            title="Needs validation"
            subtitle="Resolved but not validation-passed"
            items={p2.items}
            loading={p2.loading}
            error={p2.error}
            emptyLabel="Nothing waiting on validation."
            viewAllHref="/admin/system-tests/incidents?needsValidation=1"
          />
          <SystemTestIncidentActionsPanel
            title="Active by priority"
            subtitle="Open through validating (recent list)"
            items={p3.items}
            loading={p3.loading}
            error={p3.error}
            emptyLabel="No active incident actions."
            viewAllHref="/admin/system-tests/incidents?preset=active"
          />
          <SystemTestIncidentActionsPanel
            title="Recently resolved"
            subtitle="Latest resolved actions (by API order)"
            items={p4.items}
            loading={p4.loading}
            error={p4.error}
            emptyLabel="No resolved actions yet."
            viewAllHref="/admin/system-tests/incidents?preset=resolved"
          />
          <SystemTestIncidentActionsPanel
            title="Overdue (SLA)"
            subtitle="Active work past SLA due"
            items={p5.items}
            loading={p5.loading}
            error={p5.error}
            emptyLabel="No overdue incidents."
            viewAllHref="/admin/system-tests/incidents?preset=sla-overdue"
          />
          <SystemTestIncidentActionsPanel
            title="Escalation ready"
            subtitle="Meets escalation criteria"
            items={p6.items}
            loading={p6.loading}
            error={p6.error}
            emptyLabel="Nothing escalation-ready."
            viewAllHref="/admin/system-tests/incidents?preset=escalation-ready"
          />
        </div>
      </div>
    </section>
  );
}
