import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import type { Topic, Branch } from "@/data/appointmentData";
import { generateTimeSlots } from "@/data/appointmentData";

interface Props {
  firstName: string;
  lastName: string;
  email: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  selectedTopic: Topic;
  selectedBranch: Branch;
  selectedDate: Date;
  selectedTime: string;
  onSubmit: () => void;
  onBack: () => void;
}

export const StepUserDetails = ({
  firstName,
  lastName,
  email,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  selectedTopic,
  selectedBranch,
  selectedDate,
  selectedTime,
  onSubmit,
  onBack,
}: Props) => {
  const timeLabel = generateTimeSlots().find((s) => s.time === selectedTime)?.label ?? selectedTime;
  const isValid = firstName.trim() && lastName.trim() && email.trim() && email.includes("@");

  return (
    <section>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
        Now we just need a few more details.
      </h2>
      <p className="text-muted-foreground mb-6">Please confirm your appointment and enter your information.</p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Summary */}
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Appointment Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CalendarDays className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{selectedTopic.name}</p>
                <p className="text-muted-foreground">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  at {timeLabel}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{selectedBranch.name}</p>
                <p className="text-muted-foreground">
                  {selectedBranch.address}, {selectedBranch.city}, {selectedBranch.state}{" "}
                  {selectedBranch.zip}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="john.doe@example.com"
            />
          </div>
          <Button className="w-full mt-2" disabled={!isValid} onClick={onSubmit}>
            Confirm Appointment
          </Button>
        </Card>
      </div>
    </section>
  );
};
