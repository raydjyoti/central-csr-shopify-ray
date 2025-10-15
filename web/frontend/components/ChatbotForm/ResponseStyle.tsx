import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-medium text-gray-700 bg-white/70">
      {children}
    </span>
  );
}

interface BubbleProps {
  children: React.ReactNode;
  side?: "left" | "right";
  label?: string;
  animateOnMount?: boolean;
}

function Bubble({ children, side = "left", label, animateOnMount = true }: BubbleProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="">
          <Badge>{label}</Badge>
        </div>
      )}
      <motion.div
        initial={
          animateOnMount ? { opacity: 0, x: side === "left" ? -16 : 16, scale: 0.98 } : false
        }
        animate={animateOnMount ? { opacity: 1, x: 0, scale: 1 } : undefined}
        transition={animateOnMount ? { type: "spring", stiffness: 260, damping: 22 } : undefined}
        className={cn(
          "max-w-xl max-h-[80px] flex flex-col justify-center rounded-2xl px-4 py-3 shadow-sm border",
          side === "left"
            ? "bg-white text-gray-900 border-gray-200"
            : "bg-gray-900 text-white border-transparent ml-auto"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

const commonMessage = "Hello there - how can I help you today? 😊";

interface DotCycleProps {
  base: string;
  periodMs?: number;
  className?: string;
}

function DotCycle({ base, periodMs = 400, className }: DotCycleProps) {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), periodMs);
    return () => clearInterval(id);
  }, [periodMs]);
  return <div className={className}>{base + ".".repeat(dots)}</div>;
}

interface TypingThenMessageProps {
  cycle?: number;
  message?: string;
}

function TypingThenMessage({ cycle = 0, message = commonMessage }: TypingThenMessageProps) {
  const [phase, setPhase] = useState<"typing" | "done">("typing");

  useEffect(() => {
    setPhase("typing");
    const t = setTimeout(() => {
      setPhase("done");
    }, 2500);
    return () => clearTimeout(t);
  }, [cycle]);

  return (
    <div className="space-y-2">
      <Bubble label="Human-like • slower / natural" animateOnMount={false}>
        {phase === "typing" && (
          <DotCycle
            base="Typing"
            periodMs={400}
            className="text-sm font-medium text-gray-500 italic"
          />
        )}
        {phase === "done" && (
          <div
            key={`msg-${cycle}`}
            className="text-[15px] leading-relaxed whitespace-pre-wrap reveal-once"
          >
            {message}
          </div>
        )}
      </Bubble>
    </div>
  );
}

interface ThinkingThenStreamingProps {
  cycle?: number;
  thinkingMs?: number;
  message?: string;
  charsPerTick?: number;
  tickMs?: number;
}

function ThinkingThenStreaming({
  cycle = 0,
  thinkingMs = 1000,
  message = commonMessage,
  charsPerTick = 2,
  tickMs = 40,
}: ThinkingThenStreamingProps) {
  const [phase, setPhase] = useState<"thinking" | "stream" | "done">("thinking");
  const [visible, setVisible] = useState(0);
  const textArray = useMemo(() => Array.from(message), [message]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setPhase("thinking");
    setVisible(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [cycle]);

  useEffect(() => {
    if (phase !== "thinking") return;
    const t = window.setTimeout(() => setPhase("stream"), thinkingMs);
    return () => clearTimeout(t);
  }, [phase, thinkingMs]);

  useEffect(() => {
    if (phase !== "stream") return;
    timerRef.current = window.setInterval(() => {
      setVisible((v) => Math.min(v + charsPerTick, textArray.length));
    }, tickMs);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, charsPerTick, tickMs, textArray.length]);

  useEffect(() => {
    if (visible === textArray.length && timerRef.current) {
      clearInterval(timerRef.current);
      setPhase("done");
    }
  }, [visible, textArray.length]);

  return (
    <div className="space-y-2">
      <Bubble label="AI • ChatGPT-like streaming">
        {phase === "thinking" && (
          <DotCycle
            base="Thinking"
            periodMs={400}
            className="text-sm font-medium text-gray-500 italic"
          />
        )}
        {(phase === "stream" || phase === "done") && (
          <motion.div
            key={`stream-${cycle}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="text-[15px] leading-relaxed whitespace-pre-wrap"
          >
            {textArray.slice(0, visible).join("")}
            {phase === "stream" && <Cursor />}
          </motion.div>
        )}
      </Bubble>
    </div>
  );
}

function Cursor() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block w-[2px] h-[1.1em] align-[-0.2em] bg-gray-500"
      style={{ animation: "cursorBlink 1s steps(2, start) infinite" }}
    >
      {" "}
      <style>{`@keyframes cursorBlink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }`}</style>
    </span>
  );
}

interface ResponseStyleProps {
  streamResponse: boolean;
  onStreamResponseChange: (stream: boolean) => void;
}

const RadioIcon = ({ selected }: { selected: boolean }) => (
  <span
    role="radio"
    aria-checked={selected}
    className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
      selected ? "bg-blue-600 border-[#289EFD]   " : "border-gray-300 bg-white"
    }`}
  >
    {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
  </span>
);

const ResponseStyle: React.FC<ResponseStyleProps> = ({
  streamResponse,
  onStreamResponseChange,
}) => {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCycle((c) => c + 1);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-transparent text-gray-900">
      <div className="mr-auto max-w-3xl">
        <style>{`
          @keyframes slideFadeIn { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }
          .reveal-once { animation: slideFadeIn 0.45s ease-out 1 both; }
        `}</style>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onStreamResponseChange(true)}
            className={`p-3 text-sm rounded-lg text-left transition-all flex items-start gap-3 ${
              streamResponse
                ? "border-2 border-[#289EFD] bg-white"
                : "border border-gray-300 bg-white hover:bg-gray-50"
            }`}
          >
            <RadioIcon min-w-8 min-h-8 selected={streamResponse} />
            <div>
              <h3 className="font-semibold text-gray-800">AI-like</h3>
              <p className="text-gray-500 text-sm">Fast, word-by-word response.</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onStreamResponseChange(false)}
            className={`p-3 text-sm rounded-lg text-left transition-all flex items-start gap-3 ${
              !streamResponse
                ? "border-2 border-[#289EFD] bg-white"
                : "border border-gray-300 bg-white hover:bg-gray-50"
            }`}
          >
            <RadioIcon selected={!streamResponse} />
            <div>
              <h3 className="font-semibold text-gray-800">Human-like</h3>
              <p className="text-gray-500 text-sm">Slower, more natural typing.</p>
            </div>
          </button>
        </div>
        <div className="grid gap-6">
          <section className="rounded-2xl flex flex-col items-start justify-center bg-white border border-gray-200 p-5 shadow-sm min-h-[90px]">
            <h2 className="text-lg font-medium mb-3">Preview</h2>

            <div className="space-y-4 w-full">
              {streamResponse && <ThinkingThenStreaming cycle={cycle} />}
              {!streamResponse && <TypingThenMessage cycle={cycle} />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResponseStyle;
