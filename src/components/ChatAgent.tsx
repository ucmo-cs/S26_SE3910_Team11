import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const KNOWLEDGE_BASE: { patterns: RegExp[]; response: string }[] = [
  {
    patterns: [/hello|hi|hey|good (morning|afternoon|evening)/i],
    response: "Hello! 👋 I'm your Commerce Bank virtual assistant. I can help you with booking appointments, branch information, and general banking questions. How can I assist you today?",
  },
  {
    patterns: [/appointment|book|schedule|reserve/i],
    response: "To book an appointment, simply use the wizard above! Here's how:\n\n1. **Select a topic** — choose the reason for your visit\n2. **Pick a branch** — select a convenient location\n3. **Choose date & time** — pick an available 30-minute slot\n4. **Enter your details** — provide your name and email\n5. **Confirm** — review and submit!\n\nWould you like to know more about any step?",
  },
  {
    patterns: [/topic|reason|purpose|what.*can.*help/i],
    response: "We offer appointments for the following topics:\n\n• **Open an Account** — checking, savings, or business accounts\n• **Loan & Mortgage Consultation** — home loans, auto loans, personal loans\n• **Financial Planning & Wealth Management** — investment advice, retirement planning\n• **Other** — any other banking needs\n\nJust select one to get started!",
  },
  {
    patterns: [/branch|location|where|address|harrisonville/i],
    response: "We have two branch locations:\n\n📍 **Southland Shopping Center**\n1731 E Mechanic St, Harrisonville, MO 64701\n\n📍 **Harrisonville Main Branch**\n1301 Locust St, Harrisonville, MO 64701\n\nNote: Not all branches support every topic. The wizard will show you which branches are available for your selected topic.",
  },
  {
    patterns: [/time|hour|when|slot|available|schedule/i],
    response: "Appointments are available in **30-minute slots** from **9:00 AM to 5:00 PM**, Monday through Friday.\n\nAlready-booked slots are automatically hidden, so you'll only see available times. Select a date on the calendar to view open slots!",
  },
  {
    patterns: [/cancel|reschedule|change/i],
    response: "Currently, appointment cancellations and rescheduling need to be handled by contacting the branch directly. We recommend calling your selected branch during business hours for assistance.",
  },
  {
    patterns: [/account|checking|saving/i],
    response: "We offer a variety of account options including checking, savings, and business accounts. To discuss which account is right for you, book an appointment under **\"Open an Account\"** and a representative will guide you through the options!",
  },
  {
    patterns: [/loan|mortgage|credit/i],
    response: "For loans, mortgages, or credit inquiries, book an appointment under **\"Loan & Mortgage Consultation\"**. Our specialists can help with:\n\n• Home mortgages & refinancing\n• Auto loans\n• Personal loans\n• Lines of credit",
  },
  {
    patterns: [/invest|wealth|financ|retire|plan/i],
    response: "Our financial planning services cover investment strategies, retirement planning, and wealth management. Book under **\"Financial Planning & Wealth Management\"** to meet with an advisor!",
  },
  {
    patterns: [/thank|thanks/i],
    response: "You're welcome! 😊 Is there anything else I can help you with?",
  },
  {
    patterns: [/bye|goodbye|see you/i],
    response: "Goodbye! Have a great day! Don't hesitate to reach out if you need anything. 👋",
  },
];

const DEFAULT_RESPONSE = "I'm not sure I understand that question. I can help you with:\n\n• **Booking appointments**\n• **Branch locations & hours**\n• **Available topics** (accounts, loans, financial planning)\n• **Time slot availability**\n\nTry asking about one of these, or use the appointment wizard above to get started!";

function getResponse(input: string): string {
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.patterns.some((p) => p.test(input))) {
      return entry.response;
    }
  }
  return DEFAULT_RESPONSE;
}

const ChatAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi there! 👋 I'm your Commerce Bank assistant. Ask me anything about booking appointments, branch locations, or our services!" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Message = { role: "user", content: trimmed };
    const assistantMsg: Message = { role: "assistant", content: getResponse(trimmed) };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Commerce Bank Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80" aria-label="Close chat">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question..."
              className="text-sm"
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAgent;
