import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Branch } from "@/data/appointmentData";
import { MapPin, ArrowLeft } from "lucide-react";

interface Props {
  branches: Branch[];
  selected: Branch | null;
  onSelect: (branch: Branch) => void;
  onBack: () => void;
}

export const StepBranchSelect = ({ branches, selected, onSelect, onBack }: Props) => {
  return (
    <section>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
        Which location works best for you?
      </h2>
      <p className="text-muted-foreground mb-6">Choose a branch that supports your selected topic.</p>
      <div className="grid gap-3">
        {branches.map((branch) => (
          <Card
            key={branch.id}
            className={`p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
              selected?.id === branch.id ? "border-primary ring-2 ring-ring" : ""
            }`}
            onClick={() => onSelect(branch)}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{branch.name}</p>
                <p className="text-sm text-muted-foreground">
                  {branch.address}, {branch.city}, {branch.state} {branch.zip}
                </p>
              </div>
            </div>
          </Card>
        ))}
        {branches.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No branches support this topic. Please go back and select a different topic.
          </p>
        )}
      </div>
    </section>
  );
};
