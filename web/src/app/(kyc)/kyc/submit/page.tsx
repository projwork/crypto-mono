"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CameraCapture } from "@/components/kyc/CameraCapture";
import { DocumentDropzone } from "@/components/kyc/DocumentDropzone";
import { KycLimitsTable } from "@/components/kyc/KycLimitsTable";
import { ApiError } from "@/lib/api/client";
import { kycApi } from "@/lib/api/kyc";
import type { KycStatusResponse, KycTier } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";

type WizardStep = "personal" | "document" | "selfie" | "review";

interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  kycTier: string;
  kycStatus: string;
}

const COUNTRIES = [
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" }
];

export default function KycSubmitPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [kycData, setKycData] = useState<KycStatusResponse | null>(null);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [passport, setPassport] = useState<File | null>(null);
  const [nationalId, setNationalId] = useState<File | null>(null);
  const [driversLicense, setDriversLicense] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [proofOfAddressUrl, setProofOfAddressUrl] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [selectedTier, setSelectedTier] = useState<KycTier>("TIER_2");
  
  const [selectedDocType, setSelectedDocType] = useState<"citizenship_id" | "license" | "passport">("citizenship_id");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[2]); 
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState<WizardStep>("document");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadInitialState = useCallback(async () => {
    setLoading(true);
    try {
      const profileRes = await fetch("/api/auth/me");
      if (profileRes.ok) {
        const profileJson = await profileRes.json();
        if (profileJson.success && profileJson.data?.user) {
          setUserData(profileJson.data.user);
          const matchedCountry = COUNTRIES.find(c => c.name.toLowerCase() === profileJson.data.user.country?.toLowerCase());
          if (matchedCountry) setSelectedCountry(matchedCountry);
        }
      }

      const status = await kycApi.getStatus();
      setKycData(status);
      setSelectedTier(status.verification?.tier ?? status.tier ?? "TIER_2");
      
      if (status.verification?.status === "PENDING") {
        router.replace("/kyc/status");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load workflow state mappings.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadInitialState();
  }, [loadInitialState]);

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    if (currentStep === "document") {
      const hasId = passport || nationalId || driversLicense;
      if (!hasId) errors.documents = "Please upload an authorization file framework asset item.";
    }
    if (currentStep === "selfie" && !selfie) {
      errors.selfie = "Biometric check requires selfie portrait capture.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep()) return;
    setError(null);
    if (currentStep === "personal") setCurrentStep("document");
    else if (currentStep === "document") setCurrentStep("selfie");
    else if (currentStep === "selfie") setCurrentStep("review");
  };

  const handleBackStep = () => {
    setError(null);
    if (currentStep === "review") setCurrentStep("selfie");
    else if (currentStep === "selfie") setCurrentStep("document");
    else if (currentStep === "document") setCurrentStep("personal");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const idFile = nationalId ?? driversLicense ?? passport ?? undefined;
      await kycApi.submit({
        tier: selectedTier,
        passport: selectedDocType === "passport" ? passport ?? undefined : undefined,
        nationalId: selectedDocType === "citizenship_id" ? idFile : undefined,
        selfie: selfie ?? undefined,
        proofOfAddressUrl: proofOfAddressUrl.trim() || undefined,
        sourceOfFunds: sourceOfFunds.trim() || undefined,
      });
      await refresh();
      router.replace("/kyc/status");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err.message);
      } else {
        setError("Error finalizing document payload transmission pipeline.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030922] flex-col gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-400">Loading component matrix pipelines...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030922] text-white font-sans antialiased selection:bg-blue-500/30">
      
      {/* LagerPay Global Branding Header */}
      <header className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between border-b border-slate-900/40">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">LagerPay</p>
            <p className="text-[11px] text-slate-400">Crypto → ETB</p>
          </div>
        </Link>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          Connect Wallet
        </Button>
      </header>

      {/* Main Container Layout */}
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Timeline Rail (Perfect right-aligned step circle layout) */}
        <div className="lg:col-span-4 space-y-2 lg:border-r lg:border-slate-900/60 lg:pr-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">KYC Verification</h1>
            <p className="text-xs text-slate-400 mt-1">Verify your identity and get started</p>
          </div>

          <div className="relative flex flex-col gap-10 pr-4">
            {/* Right-aligned track vertical vector anchor line */}
            <div className="absolute right-[18px] top-4 bottom-4 w-[1px] bg-slate-800" />

            {/* Step 1 Node: Personal Info */}
            <div className="flex items-center justify-end text-right gap-4 cursor-pointer z-10" onClick={() => setCurrentStep("personal")}>
              <div>
                <h4 className={`text-xs font-bold transition-colors ${currentStep === "personal" ? "text-white" : "text-slate-400"}`}>Personal Information</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Profile and identity metadata</p>
              </div>
              <div className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center transition-all ${
                currentStep === "personal" ? "bg-blue-600 border-2 border-blue-400 ring-4 ring-blue-500/20" : "bg-[#090f2c] border border-slate-800 text-slate-400"
              }`}>
                <div className={`h-2 w-2 rounded-full ${currentStep === "personal" ? "bg-white" : "bg-blue-500"}`} />
              </div>
            </div>

            {/* Step 2 Node: ID Verification */}
            <div className="flex items-center justify-end text-right gap-4 cursor-pointer z-10" onClick={() => setCurrentStep("document")}>
              <div>
                <h4 className={`text-xs font-bold transition-colors ${currentStep === "document" ? "text-white" : "text-slate-400"}`}>ID Verification</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Browse and upload</p>
              </div>
              <div className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center transition-all ${
                currentStep === "document" ? "bg-blue-600 border-2 border-blue-400 ring-4 ring-blue-500/20" : "bg-[#090f2c] border border-slate-800 text-slate-400"
              }`}>
                <div className={`h-2 w-2 rounded-full ${currentStep === "document" ? "bg-white" : "bg-blue-500"}`} />
              </div>
            </div>

            {/* Step 3 Node: Selfie Tracking */}
            <div className="flex items-center justify-end text-right gap-4 cursor-pointer z-10" onClick={() => setCurrentStep("selfie")}>
              <div>
                <h4 className={`text-xs font-bold transition-colors ${currentStep === "selfie" ? "text-white" : "text-slate-400"}`}>Selfie</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Biometric facial tracking</p>
              </div>
              <div className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center transition-all ${
                currentStep === "selfie" ? "bg-blue-600 border-2 border-blue-400 ring-4 ring-blue-500/20" : "bg-[#090f2c] border border-slate-800 text-slate-400"
              }`}>
                <div className={`h-2 w-2 rounded-full ${currentStep === "selfie" ? "bg-white" : "bg-slate-700"}`} />
              </div>
            </div>

            {/* Step 4 Node: Ledger Review Submission */}
            <div className="flex items-center justify-end text-right gap-4 cursor-pointer z-10" onClick={() => setCurrentStep("review")}>
              <div>
                <h4 className={`text-xs font-bold transition-colors ${currentStep === "review" ? "text-white" : "text-slate-400"}`}>Review</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Final data submission ledger</p>
              </div>
              <div className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center transition-all ${
                currentStep === "review" ? "bg-blue-600 border-2 border-blue-400 ring-4 ring-blue-500/20" : "bg-[#090f2c] border border-slate-800 text-slate-400"
              }`}>
                <div className={`h-2 w-2 rounded-full ${currentStep === "review" ? "bg-white" : "bg-slate-700"}`} />
              </div>
            </div>

          </div>
        </div>

        {/* Right Form Wizard Window Deck */}
        <div className="lg:col-span-8 bg-[#090f2c]/40 border border-slate-900 rounded-2xl p-6 md:p-8 space-y-6 min-h-[520px] flex flex-col justify-between">
          
          <div className="space-y-6">
            {error && (
              <div className="rounded-xl overflow-hidden bg-red-950/40 border border-red-900 text-red-400">
                <Alert tone="error">{error}</Alert>
              </div>
            )}

            {/* STEP 1: PERSONAL INFORMATION DISPLAY */}
            {currentStep === "personal" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Step 1/4</span>
                  <h2 className="text-xl font-bold mt-1 text-white">Personal Information</h2>
                  <p className="text-xs text-slate-400 mt-1">Verify imported account parameter profiles.</p>
                </div>

                {userData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#030922] border border-slate-800/60 p-5 rounded-xl">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Full Name</p>
                      <p className="text-sm font-medium text-slate-200">{userData.firstName} {userData.lastName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Address</p>
                      <p className="text-sm font-medium text-slate-200">{userData.email}</p>
                    </div>
                    <div className="space-y-1 pt-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phone Index</p>
                      <p className="text-sm font-medium text-slate-200">{userData.phone || "N/A"}</p>
                    </div>
                    <div className="space-y-1 pt-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Base Territory Context</p>
                      <p className="text-sm font-medium text-slate-200">{userData.country}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: ID DOCUMENTATION DROPZONE COMPONENT */}
            {currentStep === "document" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Step 2/4</span>
                  <h2 className="text-xl font-bold mt-1 text-white">Intermediate Verification</h2>
                  <p className="text-xs text-slate-400 mt-1">Fill in the parts inside completing the identity parameters.</p>
                </div>

                {/* Country List Selector Dropdown */}
                <div className="space-y-2 relative">
                  <label className="text-xs font-medium text-slate-400">Select document issues country.</label>
                  <div 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full bg-[#030922] border border-slate-800/80 rounded-xl px-4 py-3 flex items-center justify-between text-sm text-slate-200 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span>{selectedCountry.name}</span>
                    </div>
                    <span className="text-blue-500 text-xs">{dropdownOpen ? "▲" : "▼"}</span>
                  </div>

                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#030922] border border-slate-800 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl">
                      {COUNTRIES.map((country) => (
                        <div 
                          key={country.code}
                          onClick={() => { setSelectedCountry(country); setDropdownOpen(false); }}
                          className="px-4 py-2.5 hover:bg-[#0b133a] transition-colors text-sm text-slate-200 flex items-center gap-3 cursor-pointer"
                        >
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid Framework Options */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-400">Select document type</label>
                  
                  <div 
                    onClick={() => { setSelectedDocType("citizenship_id"); setDriversLicense(null); setPassport(null); }}
                    className={`p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer ${
                      selectedDocType === "citizenship_id" ? "bg-[#0b133a] border-emerald-500/80 shadow-md" : "bg-[#030922]/80 border-slate-900 hover:border-slate-800"
                    }`}
                  >
                    <div className="p-2.5 rounded-lg bg-[#030922] border border-slate-800 text-xl">🪪</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Citizenship ID Card</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Create your account context matrix with National ID cards.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => { setSelectedDocType("license"); setNationalId(null); setPassport(null); }}
                    className={`p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer ${
                      selectedDocType === "license" ? "bg-[#0b133a] border-emerald-500/80 shadow-md" : "bg-[#030922]/80 border-slate-900 hover:border-slate-800"
                    }`}
                  >
                    <div className="p-2.5 rounded-lg bg-[#030922] border border-slate-800 text-xl">🪪</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Driving License</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Create your account context matrix with Driving License assets.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => { setSelectedDocType("passport"); setNationalId(null); setDriversLicense(null); }}
                    className={`p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer ${
                      selectedDocType === "passport" ? "bg-[#0b133a] border-emerald-500/80 shadow-md" : "bg-[#030922]/80 border-slate-900 hover:border-slate-800"
                    }`}
                  >
                    <div className="p-2.5 rounded-lg bg-[#030922] border border-slate-800 text-xl">📕</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Passport</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Create your account context matrix with Passport items.</p>
                    </div>
                  </div>
                </div>

                {/* Sub-label text header configuration visibility enhancements wrapper */}
                <div className="pt-4 border-t border-slate-900/60 space-y-3">
                  <label className="text-xs font-bold tracking-wide text-slate-200">
                    Upload File Profile Asset ({selectedDocType.replace("_", " ").toUpperCase()})
                  </label>
                  
                  {/* High contrast container text properties injection wrapper for file drops boxes */}
                  <div className="bg-[#121a3e] border border-slate-700 rounded-xl p-6 text-slate-600 placeholder-slate-300 [&_p]:text-slate-200 [&_span]:text-white font-medium">
                    <DocumentDropzone
                      label="Drag & drop or browse image files directly"
                      hint="Accepts high resolution JPEG, PNG, WEBP or PDF format frameworks up to 5MB maximum parameters size limit"
                      icon={selectedDocType === "passport" ? "passport" : "id"}
                      value={selectedDocType === "citizenship_id" ? nationalId : selectedDocType === "license" ? driversLicense : passport}
                      onChange={selectedDocType === "citizenship_id" ? setNationalId : selectedDocType === "license" ? setDriversLicense : setPassport}
                    />
                  </div>
                  {fieldErrors.documents && <p className="text-xs text-red-400 mt-2 font-semibold">{fieldErrors.documents}</p>}
                </div>
              </div>
            )}

            {/* STEP 3: BIOMETRIC LIVE LOOK FACIAL ATTACHMENTS */}
            {currentStep === "selfie" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Step 3/4</span>
                  <h2 className="text-xl font-bold mt-1 text-white">Biometric Liveness Match</h2>
                  <p className="text-xs text-slate-400 mt-1">Please provide a frontal facial mapping photo framework to bypass compliance checks.</p>
                </div>

                <div className="bg-[#121a3e] border border-slate-700 rounded-xl p-6 text-slate-100 font-medium">
                  <DocumentDropzone
                    label="Selfie Portrait Verification Identity Match Camera Capture"
                    hint="Ensure facial map properties are perfectly illuminated and cleanly rendered inside target grids"
                    icon="id"
                    value={selfie}
                    onChange={setSelfie}
                    error={fieldErrors.selfie}
                    showCamera
                    cameraActive={cameraOpen}
                    onCameraClick={() => setCameraOpen(true)}
                    cameraSlot={
                      <CameraCapture
                        onCapture={(file) => { setSelfie(file); setCameraOpen(false); }}
                        onClose={() => setCameraOpen(false)}
                      />
                    }
                  />
                </div>
              </div>
            )}

            {/* STEP 4: REVIEWS AND TRANSIT PARAMETERS */}
            {currentStep === "review" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Step 4/4</span>
                  <h2 className="text-xl font-bold mt-1 text-white">Review & Complete Profile Submission</h2>
                  <p className="text-xs text-slate-400 mt-1">Please perform final validations on structural details before updating compliance metrics ledger configurations.</p>
                </div>

                <div className="bg-[#030922] border border-slate-800/80 rounded-xl p-5 space-y-4 text-sm">
                  <div className="flex justify-between border-b border-slate-900/60 pb-2">
                    <span className="text-slate-400">Target Level Tier</span>
                    <span className="font-semibold text-emerald-400">{selectedTier}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/60 pb-2">
                    <span className="text-slate-400">Verification Document Type</span>
                    <span className="font-semibold text-slate-200">{selectedDocType.replace("_", " ").toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/60 pb-2">
                    <span className="text-slate-400">Issuing Region Origin</span>
                    <span className="font-semibold text-slate-200">{selectedCountry.flag} {selectedCountry.name}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400">Selfie Snapshot Identity File</span>
                    <span className={`font-semibold ${selfie ? "text-emerald-400" : "text-red-400"}`}>{selfie ? "Attached Ready" : "Missing"}</span>
                  </div>
                </div>

                <Input
                  label="Proof of Address Reference Asset Location"
                  placeholder="Insert secure tracking destination URL context path parameters…"
                  value={proofOfAddressUrl}
                  onChange={(e) => setProofOfAddressUrl(e.target.value)}
                  className="bg-[#030922] border-slate-800 text-white h-11 focus:border-blue-500"
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="sourceOfFunds" className="text-xs font-medium text-slate-400">Origin / Description of Declared Funds</label>
                  <textarea
                    id="sourceOfFunds"
                    rows={3}
                    placeholder="Provide details mapping data tracking asset origin registries..."
                    value={sourceOfFunds}
                    onChange={(e) => setSourceOfFunds(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#030922] px-3.5 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Flow Nav Footer */}
          <div className="border-t border-slate-900/60 pt-6 flex items-center justify-end gap-4">
            {currentStep !== "personal" && (
              <button 
                type="button"
                onClick={handleBackStep}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2"
              >
                Back
              </button>
            )}

            {currentStep !== "review" ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 h-11 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.25)]"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                loading={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-8 h-11 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.35)]"
              >
                Submit For Verification
              </Button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}