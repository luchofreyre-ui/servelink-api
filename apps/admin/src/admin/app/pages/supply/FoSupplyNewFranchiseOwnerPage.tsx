import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { SupplyBackendBanner } from "../../../features/supply/components/SupplyBackendBanner";
import { FoSupplyActivationAlert } from "../../../features/supply/components/FoSupplyActivationAlert";
import { useCreateDraftFranchiseOwner } from "../../../features/supply/hooks/useSupply";
import { ADMIN_ROUTES } from "../../routes/adminRoutes";
import { setAdminDocumentTitle } from "../../lib/documentTitle";
import type { ApiError } from "../../api/adminApiClient";

export function FoSupplyNewFranchiseOwnerPage() {
  const navigate = useNavigate();
  const create = useCreateDraftFranchiseOwner();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [submitError, setSubmitError] = useState<ApiError | null>(null);

  useEffect(() => {
    setAdminDocumentTitle("New franchise owner");
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="New franchise owner"
        subtitle="Creates a draft FO in onboarding. You will continue setup on the supply detail page."
      />
      <SupplyBackendBanner />
      <section className="max-w-lg rounded-2xl border bg-white p-4">
        {submitError ? <FoSupplyActivationAlert error={submitError} /> : null}
        <form
          className="space-y-4"
          data-testid="fo-supply-new-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitError(null);
            void create
              .mutateAsync({
                displayName: displayName.trim(),
                email: email.trim(),
              })
              .then((res) => {
                navigate(ADMIN_ROUTES.foSupplyDetail(res.foId), { replace: true });
              })
              .catch((err) => {
                setSubmitError(err as ApiError);
              });
          }}
        >
          <label className="block text-sm">
            <span className="text-slate-600">Display name</span>
            <input
              required
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="organization"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Login email (unique)</span>
            <input
              required
              type="email"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <p className="text-xs text-slate-500">
            A placeholder password is set; the FO signs in later through your normal account
            flows. No activation runs on create.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              data-testid="fo-supply-new-submit"
              disabled={create.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create draft & continue setup"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
              onClick={() => navigate(ADMIN_ROUTES.foSupplyFleetOverview)}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
