"use client";

import { useCallback, useEffect, useState } from "react";
import { BeneficiaryForm, type BeneficiaryFormValues } from "@/components/beneficiaries/BeneficiaryForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { beneficiariesApi } from "@/lib/api/beneficiaries";
import type { BankName, PublicBeneficiary } from "@/lib/api/types";
import { humanize } from "@/lib/utils";

function bankLabel(bank: string | null): string {
  if (!bank) return "";
  const labels: Record<string, string> = {
    CBE: "CBE",
    AWASH: "Awash",
    DASHEN: "Dashen",
  };
  return labels[bank] ?? bank;
}

function payoutDetail(b: PublicBeneficiary): string {
  if (b.payoutMethod === "TELEBIRR") return b.phoneNumber ?? "";
  return `${bankLabel(b.bank)} · ${b.accountNumber ?? ""}`;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<PublicBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PublicBeneficiary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await beneficiariesApi.list();
      setBeneficiaries(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load beneficiaries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (b: PublicBeneficiary) => {
    setEditing(b);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async (values: BeneficiaryFormValues) => {
    const payload = {
      fullName: values.fullName.trim(),
      country: values.country.trim(),
      payoutMethod: values.payoutMethod,
      ...(values.payoutMethod === "BANK"
        ? { bank: values.bank as BankName, accountNumber: values.accountNumber.trim() }
        : { phoneNumber: values.phoneNumber.trim() }),
    };

    if (editing) {
      await beneficiariesApi.update(editing.id, payload);
    } else {
      await beneficiariesApi.create(payload);
    }

    closeModal();
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this beneficiary? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await beneficiariesApi.remove(id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete beneficiary.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    setTogglingId(id);
    try {
      const updated = await beneficiariesApi.toggleFavorite(id);
      setBeneficiaries((prev) =>
        [...prev.map((b) => (b.id === id ? updated : b))].sort(
          (a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.fullName.localeCompare(b.fullName),
        ),
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update favorite.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beneficiaries"
        description="Save recipients for faster transfers to Ethiopian bank accounts and Telebirr."
        action={<Button onClick={openCreate}>Add beneficiary</Button>}
      />

      {loading && <LoadingBlock label="Loading beneficiaries…" />}

      {!loading && error && (
        <ErrorBlock message={error} onRetry={load} />
      )}

      {!loading && !error && beneficiaries.length === 0 && (
        <Card>
          <CardContent>
            <EmptyBlock
              title="No beneficiaries yet"
              description="Add someone you'd like to send money to — their details will be saved for next time."
              action={<Button onClick={openCreate}>Add your first beneficiary</Button>}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
                </svg>
              }
            />
          </CardContent>
        </Card>
      )}

      {!loading && !error && beneficiaries.length > 0 && (
        <div className="grid gap-3">
          {beneficiaries.map((b) => (
            <Card key={b.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(b.id)}
                    disabled={togglingId === b.id}
                    className={`mt-0.5 shrink-0 rounded-lg p-1 transition-colors ${
                      b.isFavorite
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-slate-300 hover:text-amber-400 dark:text-slate-600"
                    }`}
                    aria-label={b.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <StarIcon filled={b.isFavorite} />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{b.fullName}</p>
                      {b.isFavorite && <Badge tone="warning">Favorite</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {b.country} · {humanize(b.payoutMethod)}
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-300">
                      {payoutDetail(b)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 sm:ml-4">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(b)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"
                    onClick={() => handleDelete(b.id)}
                    loading={deletingId === b.id}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit beneficiary" : "Add beneficiary"}
      >
        <BeneficiaryForm
          initial={editing}
          onSubmit={handleSave}
          onCancel={closeModal}
          submitLabel={editing ? "Save changes" : "Add beneficiary"}
        />
      </Modal>
    </div>
  );
}
