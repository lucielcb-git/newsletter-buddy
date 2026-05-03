import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Settings as SettingsIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_COMPANY_NAME,
  EMAIL_REGEX,
  cacheTestEmail,
  fetchSettings,
  fileToAsset,
  loadCachedTestEmail,
  loadLocalAssets,
  saveLocalAssets,
  saveSettings,
  type LocalAsset,
  type LocalAssets,
} from "@/lib/settings-api";
import { useCurrentCompany } from "@/lib/current-company";

const Settings = () => {
  const [currentCompany, setCurrentCompany] = useCurrentCompany();
  const [companyName, setCompanyName] = useState(currentCompany);
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testEmailError, setTestEmailError] = useState<string | null>(null);
  const [assets, setAssets] = useState<LocalAssets>({});
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const guideInput = useRef<HTMLInputElement>(null);

  // Initial load: fetch saved settings for the session's current company
  useEffect(() => {
    void loadFor(currentCompany);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFor = async (name: string) => {
    const resolved = name.trim() || DEFAULT_COMPANY_NAME;
    setIsFetching(true);
    setAssets(loadLocalAssets(resolved));
    setTestEmail(loadCachedTestEmail(resolved));
    setCurrentCompany(resolved);
    try {
      const s = await fetchSettings(resolved);
      if (s) {
        setCompanyName(s.companyName || resolved);
        setKeywords(s.keywords || "");
        setTone(s.tone || "");
        if (s.testEmail) {
          setTestEmail(s.testEmail);
          cacheTestEmail(s.companyName || resolved, s.testEmail);
        }
        setCurrentCompany(s.companyName || resolved);
      } else {
        setCompanyName(resolved);
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load saved settings.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleFetch = () => loadFor(companyName.trim() || DEFAULT_COMPANY_NAME);

  const handleFile = async (kind: "logo" | "styleGuide", file: File | null) => {
    if (!file) return;
    try {
      const asset = await fileToAsset(file);
      const next = { ...assets, [kind]: asset } as LocalAssets;
      setAssets(next);
      saveLocalAssets(companyName.trim() || DEFAULT_COMPANY_NAME, next);
      toast.success(`${kind === "logo" ? "Logo" : "Style guide"} saved locally`);
    } catch {
      toast.error("Failed to read file.");
    }
  };

  const removeAsset = (kind: "logo" | "styleGuide") => {
    const next = { ...assets, [kind]: null } as LocalAssets;
    setAssets(next);
    saveLocalAssets(companyName.trim() || DEFAULT_COMPANY_NAME, next);
  };

  const handleSave = async () => {
    const name = companyName.trim() || DEFAULT_COMPANY_NAME;
    const email = testEmail.trim();
    if (!email) {
      setTestEmailError("Test email is required.");
      toast.error("Please enter a test email address.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setTestEmailError("Please enter a valid email address.");
      toast.error("Invalid test email address.");
      return;
    }
    setTestEmailError(null);
    setIsSaving(true);
    try {
      await saveSettings({ companyName: name, keywords, tone, testEmail: email });
      saveLocalAssets(name, assets); // ensure assets stay tied to current name
      setCurrentCompany(name);
      toast.success("Settings saved! ✨");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-3xl w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <SettingsIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
        <span className="w-12" />
      </header>

      <div className="flex-1 px-4 pb-10 md:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company preferences</CardTitle>
              <CardDescription>
                Save the defaults your newsletter agent should use when drafting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <div className="flex gap-2">
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={DEFAULT_COMPANY_NAME}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetch}
                    disabled={isFetching}
                  >
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Textarea
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. AI, productivity, weekly tips"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Textarea
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g. friendly, witty, professional"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testEmail">Test email address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => {
                    setTestEmail(e.target.value);
                    if (testEmailError) setTestEmailError(null);
                  }}
                  placeholder="you@example.com"
                  aria-invalid={!!testEmailError}
                />
                <p className={`text-xs ${testEmailError ? "text-destructive" : "text-muted-foreground"}`}>
                  {testEmailError ?? "Where should we send test newsletters?"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand assets</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <AssetUploader
                label="Logo"
                accept="image/*"
                asset={assets.logo ?? null}
                inputRef={logoInput}
                onPick={(f) => handleFile("logo", f)}
                onRemove={() => removeAsset("logo")}
                preview
              />
              <AssetUploader
                label="Style guide"
                accept=".pdf,.doc,.docx,.md,.txt"
                asset={assets.styleGuide ?? null}
                inputRef={guideInput}
                onPick={(f) => handleFile("styleGuide", f)}
                onRemove={() => removeAsset("styleGuide")}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save settings
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

interface AssetUploaderProps {
  label: string;
  accept: string;
  asset: LocalAsset | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onPick: (file: File | null) => void;
  onRemove: () => void;
  preview?: boolean;
}

const AssetUploader = ({ label, accept, asset, inputRef, onPick, onRemove, preview }: AssetUploaderProps) => (
  <div className="rounded-lg border border-border/60 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      {asset && (
        <button
          onClick={onRemove}
          className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
          type="button"
        >
          <X className="h-3 w-3" /> Remove
        </button>
      )}
    </div>
    {asset ? (
      <div className="space-y-2">
        {preview && asset.type.startsWith("image/") && (
          <img
            src={asset.dataUrl}
            alt={asset.name}
            className="h-20 w-full object-contain rounded bg-muted"
          />
        )}
        <p className="text-xs text-muted-foreground truncate" title={asset.name}>
          {asset.name}
        </p>
      </div>
    ) : (
      <p className="text-xs text-muted-foreground">No file selected.</p>
    )}
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => onPick(e.target.files?.[0] ?? null)}
    />
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-4 w-4" />
      {asset ? "Replace" : "Upload"}
    </Button>
  </div>
);

export default Settings;
