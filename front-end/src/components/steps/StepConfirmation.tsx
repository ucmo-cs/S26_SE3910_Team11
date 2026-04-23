import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Appointment, Topic, Branch } from "@/data/appointmentData";
import { generateTimeSlots } from "@/data/appointmentData";
import { CheckCircle2 } from "lucide-react";

interface Props {
  appointment: Appointment;
  topic: Topic;
  branch: Branch;
  onNewAppointment: () => void;
}

export const StepConfirmation = ({ appointment, topic, branch, onNewAppointment }: Props) => {
  const timeLabel = generateTimeSlots().find((s) => s.time === appointment.time)?.label ?? appointment.time;
  const dateObj = new Date(appointment.date + "T00:00:00");

  return (
    <section className="max-w-lg mx-auto text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
        You're all set!
      </h2>
      <p className="text-muted-foreground mb-6">
        Your appointment has been confirmed. Here are your details:
      </p>

      <Card className="p-6 text-left space-y-3">
        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <span className="font-semibold text-foreground">Name</span>
          <span className="text-foreground">{appointment.firstName} {appointment.lastName}</span>

          <span className="font-semibold text-foreground">Email</span>
          <span className="text-foreground">{appointment.email}</span>

          <span className="font-semibold text-foreground">Topic</span>
          <span className="text-foreground">{topic.name}</span>

          <span className="font-semibold text-foreground">Branch</span>
          <span className="text-foreground">
            {branch.name}
            <br />
            <span className="text-muted-foreground text-xs">
              {branch.address}, {branch.city}, {branch.state} {branch.zip}
            </span>
          </span>

          <span className="font-semibold text-foreground">Date</span>
          <span className="text-foreground">
            {dateObj.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>

          <span className="font-semibold text-foreground">Time</span>
          <span className="text-foreground">{timeLabel}</span>

          <span className="font-semibold text-foreground">Confirmation #</span>
          <span className="text-foreground font-mono text-xs">{appointment.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </Card>

      <Button className="mt-6" onClick={onNewAppointment}>
        Schedule Another Appointment
      </Button>
    </section>
  );
};
