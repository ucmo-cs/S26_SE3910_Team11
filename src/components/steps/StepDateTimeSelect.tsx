import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateTimeSlots, isSlotBooked } from "@/data/appointmentData";
import { ArrowLeft, Clock } from "lucide-react";

interface Props {
  branchId: number;
  selectedDate: Date | undefined;
  selectedTime: string;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
  onBack: () => void;
}

export const StepDateTimeSelect = ({
  branchId,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onBack,
}: Props) => {
  const allSlots = generateTimeSlots();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateStr = selectedDate ? selectedDate.toISOString().split("T")[0] : "";

  const availableSlots = selectedDate
    ? allSlots.filter((slot) => !isSlotBooked(branchId, dateStr, slot.time))
    : [];

  return (
    <section>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
        Let's find a time that works for you.
      </h2>
      <p className="text-muted-foreground mb-6">Select a date, then pick an available 30-minute time slot.</p>

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <Card className="p-4 w-fit">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={(date) => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              return d < today || d.getDay() === 0 || d.getDay() === 6;
            }}
          />
        </Card>

        <div>
          {!selectedDate && (
            <p className="text-muted-foreground text-center py-8">
              Please select a date to view available times.
            </p>
          )}
          {selectedDate && availableSlots.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No available times for this date. Please select another date.
            </p>
          )}
          {selectedDate && availableSlots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  className="justify-start gap-2"
                  onClick={() => onTimeSelect(slot.time)}
                >
                  <Clock className="w-4 h-4" />
                  {slot.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
