import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, StickyNote } from "lucide-react";

interface Props {
  open: boolean;
  initialNotes: string;
  customerName: string;
  saving: boolean;
  onSave: (notes: string) => void;
  onClose: () => void;
}

export const NotesDialog = ({
  open,
  initialNotes,
  customerName,
  saving,
  onSave,
  onClose,
}: Props) => {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (open) setNotes(initialNotes);
  }, [open, initialNotes]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" /> Internal Notes
          </DialogTitle>
          <DialogDescription>
            Add notes for {customerName}. These are visible only to staff and admin —
            never shown to the customer.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Customer called to confirm, prefers afternoon callbacks..."
          rows={6}
          maxLength={2000}
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground text-right">
          {notes.length} / 2000
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(notes)} disabled={saving || notes === initialNotes}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Save notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
