"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { BankName, PayoutMethod, PublicBeneficiary } from "@/lib/api/types";

const BANK_OPTIONS: { value: BankName; label: string }[] = [
  { value: "CBE", label: "Commercial Bank of Ethiopia (CBE)" },
  { value: "AWASH", label: "Awash Bank" },
  { value: "DASHEN", label: "Dashen Bank" },
];

const PAYOUT_OPTIONS: { value: PayoutMethod; label: string }[] = [
  { value: "BANK", label: "Bank account" },
  { value: "TELEBIRR", label: "Telebirr" },
];

export interface BeneficiaryFormValues {
  fullName: string;
  country: string;
  payoutMethod: PayoutMethod;
  bank: BankName | "";
  accountNumber: string;
  phoneNumber: string;
}

const emptyForm = (): BeneficiaryFormValues => ({
  fullName: "",
  country: "Ethiopia",
  payoutMethod: "BANK",
  bank: "CBE",
  accountNumber: "",
  phoneNumber: "",
});

export function beneficiaryToForm(b: PublicBeneficiary): BeneficiaryFormValues {
  return {
    fullName: b.fullName,
    country: b.country,
    payoutMethod: b.payoutMethod,
    bank: b.bank ?? "CBE",
    accountNumber: b.accountNumber ?? "",
    phoneNumber: b.phoneNumber ?? "",
  };
}

interface BeneficiaryFormProps {
  initial?: PublicBeneficiary | null;
  onSubmit: (values: BeneficiaryFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function BeneficiaryForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save beneficiary",
}: BeneficiaryFormProps) {
  const [form, setForm] = useState<BeneficiaryFormValues>(
    initial ? beneficiaryToForm(initial) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initial ? beneficiaryToForm(initial) : emptyForm());
    setError(null);
  }, [initial]);

  const update = <K extends keyof BeneficiaryFormValues>(key: K, value: BeneficiaryFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (form.payoutMethod === "BANK") {
      if (!form.bank) {
        setError("Please select a bank.");
        return;
      }
      if (!form.accountNumber.trim()) {
        setError("Account number is required for bank payouts.");
        return;
      }
    }
    if (form.payoutMethod === "TELEBIRR" && !form.phoneNumber.trim()) {
      setError("Phone number is required for Telebirr payouts.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save beneficiary.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      <Input
        label="Full name"
        placeholder="Recipient's full name"
        value={form.fullName}
        onChange={(e) => update("fullName", e.target.value)}
        required
      />

      <Input
        label="Country"
        placeholder="Ethiopia"
        value={form.country}
        onChange={(e) => update("country", e.target.value)}
        required
      />

      <Select
        label="Payout method"
        value={form.payoutMethod}
        onChange={(e) => update("payoutMethod", e.target.value as PayoutMethod)}
        options={PAYOUT_OPTIONS}
      />

      {form.payoutMethod === "BANK" ? (
        <>
          <Select
            label="Bank"
            value={form.bank}
            onChange={(e) => update("bank", e.target.value as BankName)}
            options={BANK_OPTIONS}
          />
          <Input
            label="Account number"
            placeholder="1234567890"
            value={form.accountNumber}
            onChange={(e) => update("accountNumber", e.target.value)}
            required
          />
        </>
      ) : (
        <Input
          label="Telebirr phone number"
          type="tel"
          placeholder="+251 9XX XXX XXX"
          value={form.phoneNumber}
          onChange={(e) => update("phoneNumber", e.target.value)}
          required
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={submitting} className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
