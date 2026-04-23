import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "cookie-consent";

type CookiePreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const save = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setVisible(false);
    setCustomizeOpen(false);
  };

  if (!visible) return null;

  return (
    <>
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg"
    >
      <div className="container mx-auto flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">We use cookies</p>
            <p className="text-sm text-muted-foreground">
              We use essential cookies to make this site work. With your permission, we'd
              also like to use optional analytics cookies to help us improve the booking
              experience. You can change your choice anytime.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end md:shrink-0">
          <Button
            variant="outline"
            onClick={() => save({ essential: true, analytics: false, marketing: false })}
            className="w-full sm:w-auto"
          >
            Essential only
          </Button>
          <Button
            variant="outline"
            onClick={() => setCustomizeOpen(true)}
            className="w-full sm:w-auto"
          >
            Customize
          </Button>
          <Button
            onClick={() => save({ essential: true, analytics: true, marketing: true })}
            className="w-full sm:w-auto"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>

    <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cookie preferences</DialogTitle>
          <DialogDescription>
            Choose which categories of cookies you want to allow. You can change
            these settings anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Essential</Label>
              <p className="text-sm text-muted-foreground">
                Required for the site to work — for example, remembering your
                booking progress. Always on.
              </p>
            </div>
            <Switch checked disabled aria-label="Essential cookies (always on)" />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="analytics-switch" className="text-sm font-semibold">
                Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Help us understand how the site is used so we can improve it.
                No personal information is collected.
              </p>
            </div>
            <Switch
              id="analytics-switch"
              checked={analytics}
              onCheckedChange={setAnalytics}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="marketing-switch" className="text-sm font-semibold">
                Marketing
              </Label>
              <p className="text-sm text-muted-foreground">
                Used to show you relevant offers and measure the performance of
                our campaigns.
              </p>
            </div>
            <Switch
              id="marketing-switch"
              checked={marketing}
              onCheckedChange={setMarketing}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => save({ essential: true, analytics: false, marketing: false })}
          >
            Reject optional
          </Button>
          <Button
            onClick={() => save({ essential: true, analytics, marketing })}
          >
            Save preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CookieBanner;