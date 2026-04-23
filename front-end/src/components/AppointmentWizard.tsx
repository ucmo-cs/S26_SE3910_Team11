import { useState } from "react";
import ChatAgent from "./ChatAgent";
import { StepTopicSelect } from "./steps/StepTopicSelect";
import { StepBranchSelect } from "./steps/StepBranchSelect";
import { StepDateTimeSelect } from "./steps/StepDateTimeSelect";
import { StepUserDetails } from "./steps/StepUserDetails";
import { StepConfirmation } from "./steps/StepConfirmation";
import { topics, getBranchesByTopic, bookAppointment } from "@/data/appointmentData";
import type { Branch, Topic, Appointment } from "@/data/appointmentData";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

const STEPS = ["Topic", "Location", "Date & Time", "Details", "Confirmation"];

const AppointmentWizard = () => {
  const [step, setStep] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredBranches = selectedTopic ? getBranchesByTopic(selectedTopic.id) : [];

  const handleSubmit = async () => {
    if (!selectedTopic || !selectedBranch || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const appt = await bookAppointment(
        {
          topicId: selectedTopic.id,
          branchId: selectedBranch.id,
          date: dateStr,
          time: selectedTime,
          firstName,
          lastName,
          email,
          phone,
        },
        selectedTopic.name,
        selectedBranch.name,
        `${selectedBranch.address}, ${selectedBranch.city}, ${selectedBranch.state} ${selectedBranch.zip}`
      );
      setConfirmedAppointment(appt);
      setStep(4);
      toast.success("Appointment booked successfully!");
    } catch (error) {
      console.error("Booking error:", error);
      const message = error instanceof Error ? error.message : "Failed to book appointment.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setSelectedTopic(null);
    setSelectedBranch(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setConfirmedAppointment(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-lg font-serif">
              C
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">Commerce Bank</span>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/employee-login">
              <Lock className="w-4 h-4 mr-1" /> Employee Login
            </Link>
          </Button>
        </div>
      </header>

      <div className="bg-primary/95 text-primary-foreground py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Schedule an appointment.</h1>
          <p className="mt-2 text-primary-foreground/80 text-lg">
            Book a time with one of our representatives at a branch near you.
          </p>
        </div>
      </div>

      {step < 4 && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-1">
            {STEPS.slice(0, 4).map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      i <= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{label}</span>
                </div>
                {i < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 pb-16">
        {step === 0 && (
          <StepTopicSelect
            topics={topics}
            selected={selectedTopic}
            onSelect={(t) => {
              setSelectedTopic(t);
              setSelectedBranch(null);
              setSelectedDate(undefined);
              setSelectedTime("");
              setStep(1);
            }}
          />
        )}
        {step === 1 && (
          <StepBranchSelect
            branches={filteredBranches}
            selected={selectedBranch}
            onSelect={(b) => {
              setSelectedBranch(b);
              setSelectedDate(undefined);
              setSelectedTime("");
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && selectedBranch && (
          <StepDateTimeSelect
            branchId={selectedBranch.id}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={(t) => {
              setSelectedTime(t);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepUserDetails
            firstName={firstName}
            lastName={lastName}
            email={email}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
            phone={phone}
            selectedTopic={selectedTopic!}
            selectedBranch={selectedBranch!}
            selectedDate={selectedDate!}
            selectedTime={selectedTime}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
            isSubmitting={isSubmitting}
          />
        )}
        {step === 4 && confirmedAppointment && (
          <StepConfirmation
            appointment={confirmedAppointment}
            topic={selectedTopic!}
            branch={selectedBranch!}
            onNewAppointment={handleReset}
          />
        )}
      </main>
      <ChatAgent />
    </div>
  );
};

export default AppointmentWizard;
