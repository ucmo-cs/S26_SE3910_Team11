import { Card } from "@/components/ui/card";
import type { Topic } from "@/data/appointmentData";
import { Landmark, Home, TrendingUp, HelpCircle } from "lucide-react";

const iconMap: Record<number, React.ReactNode> = {
  1: <Landmark className="w-6 h-6" />,
  2: <Home className="w-6 h-6" />,
  3: <TrendingUp className="w-6 h-6" />,
  4: <HelpCircle className="w-6 h-6" />,
};

interface Props {
  topics: Topic[];
  selected: Topic | null;
  onSelect: (topic: Topic) => void;
}

export const StepTopicSelect = ({ topics, selected, onSelect }: Props) => {
  return (
    <section>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
        What can we help you with?
      </h2>
      <p className="text-muted-foreground mb-6">Select a reason for your appointment.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <Card
            key={topic.id}
            className={`p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
              selected?.id === topic.id ? "border-primary ring-2 ring-ring" : ""
            }`}
            onClick={() => onSelect(topic)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
                {iconMap[topic.id]}
              </div>
              <span className="font-semibold text-foreground">{topic.name}</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
