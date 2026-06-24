import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: () => void;
  actionType: "edit" | "delete";
}

export function AuthorizationModal({ isOpen, onClose, onAuthorize, actionType }: AuthorizationModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAuthorize = () => {
    // Simulated check - in reality, would make an API call
    if (password === "admin") {
      onAuthorize();
      setPassword("");
      setError("");
    } else {
      setError("Incorrect password.");
    }
  };

  const isDelete = actionType === "delete";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isDelete ? 'text-destructive' : 'text-amber-600'}`}>
            <AlertTriangle className="h-5 w-5" />
            {isDelete ? "Authorize Deletion" : "Authorize Edit"}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted-foreground space-y-2">
            <div className="space-y-2">
              {isDelete ? (
                <>
                  <div>Deleting transaction records may permanently affect reporting accuracy, revenue calculations, inventory consumption records, and analytics.</div>
                  <div className="font-semibold text-foreground">This action cannot be undone. All deletions will be recorded in the audit logs.</div>
                </>
              ) : (
                <>
                  <div>Editing transaction records can affect reports, analytics, inventory calculations, and financial data.</div>
                  <div className="font-semibold text-foreground">Proceed only if this correction is absolutely necessary. This action will be permanently recorded in the audit logs.</div>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Super Admin Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className={error ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={isDelete ? "destructive" : "default"} onClick={handleAuthorize}>
            {isDelete ? "Delete Permanently" : "Verify & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
