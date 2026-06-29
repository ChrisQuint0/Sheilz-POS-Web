import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldX } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { useProfile } from "@/components/profile-provider";

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: () => void;
  actionType: "edit" | "delete";
}

export function AuthorizationModal({
  isOpen,
  onClose,
  onAuthorize,
  actionType,
}: AuthorizationModalProps) {
  const { profile } = useProfile();
  const isDelete = actionType === "delete";

  const isAuthorized =
    profile?.role === "Administrator" || profile?.role === "Manager";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  const handleAuthorize = async () => {
    if (!profile?.email) {
      setError("Unable to verify identity. Please refresh and try again.");
      return;
    }

    setIsVerifying(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    setIsVerifying(false);

    if (authError) {
      setError("Incorrect password.");
      setPassword("");
      return;
    }

    setPassword("");
    onAuthorize();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Unauthorized state */}
        {!isAuthorized ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldX className="h-5 w-5" />
                Access Denied
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm text-muted-foreground">
                Only Administrators and Managers are authorized to perform this
                action.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-2 ${isDelete ? "text-destructive" : "text-amber-600"}`}
              >
                <AlertTriangle className="h-5 w-5" />
                {isDelete ? "Authorize Deletion" : "Authorize Edit"}
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm text-muted-foreground">
                <div className="space-y-2">
                  {isDelete ? (
                    <>
                      <div>
                        Deleting transaction records may permanently affect
                        reporting accuracy, revenue calculations, inventory
                        consumption records, and analytics.
                      </div>
                      <div className="font-semibold text-foreground">
                        This action cannot be undone. All deletions will be
                        recorded in the audit logs.
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        Editing transaction records can affect reports,
                        analytics, inventory calculations, and financial data.
                      </div>
                      <div className="font-semibold text-foreground">
                        Proceed only if this correction is absolutely necessary.
                        This action will be permanently recorded in the audit
                        logs.
                      </div>
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Your Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password && !isVerifying)
                      handleAuthorize();
                  }}
                  className={
                    error
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {error && (
                  <p className="text-sm text-destructive font-medium">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                variant={isDelete ? "destructive" : "default"}
                onClick={handleAuthorize}
                disabled={!password || isVerifying}
              >
                {isVerifying
                  ? "Verifying..."
                  : isDelete
                    ? "Delete Permanently"
                    : "Verify & Continue"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
