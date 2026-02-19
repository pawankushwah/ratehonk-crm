import { useState, useEffect } from "react";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Save } from "lucide-react";

export default function SaasSettings() {
  const { user } = useSaasAuth();
  const { toast } = useToast();
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportWhatsapp, setSupportWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== "saas_owner") return;
    const token = localStorage.getItem("saas_auth_token");
    fetch("/api/saas/settings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setSupportEmail(data.support_email || "");
        setSupportPhone(data.support_phone || "");
        setSupportWhatsapp(data.support_whatsapp || "");
      })
      .catch(() => toast({ title: "Error", description: "Failed to load settings", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const handleSave = async () => {
    if (user?.role !== "saas_owner") return;
    setSaving(true);
    const token = localStorage.getItem("saas_auth_token");
    try {
      const res = await fetch("/api/saas/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          support_email: supportEmail.trim(),
          support_phone: supportPhone.trim(),
          support_whatsapp: supportWhatsapp.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Saved", description: "Settings updated successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "saas_owner") {
    return (
      <SaasLayout>
        <div className="p-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">This page is only accessible to SaaS owners.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SaasLayout>
    );
  }

  return (
    <SaasLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage SaaS platform settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Support Contact Details
            </CardTitle>
            <CardDescription>
              These details are shown to tenants on the Support page Contact tab. Support requests will be sent to the email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email Address</Label>
                  <Input
                    id="support_email"
                    type="email"
                    placeholder="support@yourcompany.com"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    When tenants submit a support request from /support, you will receive a notification at this address.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_phone">Support Phone Number</Label>
                  <Input
                    id="support_phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Displayed on the tenant Support page. Tenants can tap to call.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_whatsapp">Support WhatsApp Number</Label>
                  <Input
                    id="support_whatsapp"
                    type="tel"
                    placeholder="+1234567890"
                    value={supportWhatsapp}
                    onChange={(e) => setSupportWhatsapp(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g. +91 for India). Tenants can tap to open WhatsApp chat.
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SaasLayout>
  );
}
