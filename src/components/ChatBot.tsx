import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Bot, User as UserIcon } from "lucide-react";
import { getDevices } from "@/lib/devices";

type Message = { role: "user" | "bot"; content: string };

const suggestions = [
  "Check health",
  "Explain sensors",
  "Predict failure",
  "Improve lifespan",
];

function generateReply(input: string): string {
  const q = input.toLowerCase();
  const devices = getDevices();
  const risky = devices.filter((d) => d.risk === "high");
  const hot = devices.filter((d) => d.temperature > 70);

  if (q.includes("safe") || q.includes("health") || q.includes("check health")) {
    if (risky.length) {
      return `⚠️ ${risky.length} device(s) are at HIGH risk: ${risky.map((d) => d.deviceName).join(", ")}. Average health across fleet is ${Math.round(devices.reduce((a, d) => a + d.healthScore, 0) / devices.length)}%. I recommend immediate inspection.`;
    }
    return `✅ All devices are operating safely. Average fleet health: ${Math.round(devices.reduce((a, d) => a + d.healthScore, 0) / devices.length)}%.`;
  }
  if (q.includes("temperature") || q.includes("hot") || q.includes("temp")) {
    if (hot.length) {
      return `🌡️ ${hot.length} device(s) are running hot: ${hot.map((d) => `${d.deviceName} (${d.temperature}°C)`).join(", ")}. Likely causes: heavy load, blocked ventilation, or aging cooling components. Suggestion: reduce load and inspect cooling.`;
    }
    return "All devices are within normal temperature range (<70°C).";
  }
  if (q.includes("sensor") || q.includes("explain")) {
    return "Each device uses 4 sensors: **DS18B20** (digital temperature), **ACS712** (current via Hall-effect), **ZMPT101B** (precision AC voltage), and **DS3231** (RTC for accurate timestamps). Together they enable aging prediction.";
  }
  if (q.includes("predict") || q.includes("failure") || q.includes("risk")) {
    const top = [...devices].sort((a, b) => a.healthScore - b.healthScore)[0];
    return `📉 Highest failure risk: **${top.deviceName}** with ${top.healthScore}% health and ${top.usageHours}h usage. Trend: ${top.trend}. Estimated remaining service life: ${Math.max(0, Math.round((top.healthScore / 100) * 6))} months without intervention.`;
  }
  if (q.includes("improve") || q.includes("lifespan") || q.includes("life")) {
    return "🛠️ To improve device lifespan: 1) Keep operating temperature below 60°C, 2) Avoid sustained current spikes, 3) Schedule preventive maintenance every 1000 hours, 4) Stabilize voltage supply (±5%), 5) Replace aging components when health drops below 60%.";
  }
  if (q.includes("current") || q.includes("amp")) {
    return "High current draw often indicates increased mechanical load or insulation degradation. Inspect bearings, lubrication, and wiring. ACS712 readings >20A on small motors warrant immediate attention.";
  }
  if (q.includes("hello") || q.includes("hi ") || q === "hi") {
    return "Hello! I'm your AI maintenance assistant. Ask me about device health, sensor readings, or maintenance suggestions.";
  }
  return "I can help with device health, temperature trends, failure prediction, and maintenance advice. Try asking 'Is my device safe?' or use a quick question below.";
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hi! 👋 I'm your IoT AI assistant. I can analyze your devices and recommend actions. How can I help?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", content: t }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", content: generateReply(t) }]);
    }, 500);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-primary shadow-elegant text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform animate-pulse-glow"
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[32rem] bg-card border rounded-2xl shadow-elegant flex flex-col animate-slide-up overflow-hidden">
          <div className="bg-gradient-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">AI Assistant</div>
              <div className="text-xs opacity-80 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success-foreground/80 animate-pulse" />
                Online
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}>
                {m.role === "bot" && (
                  <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t bg-card">
            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your devices..."
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-muted border border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="h-9 w-9 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
