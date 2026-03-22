import { useState, useRef, useEffect, useCallback, type PointerEvent } from "react";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ComboInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

const ComboInput = ({ value, onChange, options, placeholder = "Velg eller skriv inn..." }: ComboInputProps) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [typingEnabled, setTypingEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const filtered = options.filter((o) =>
    o.toLowerCase().includes((open ? filter : "").toLowerCase())
  );

  const handleInputChange = (val: string) => {
    setFilter(val);
    onChange(val);
    if (!open) setOpen(true);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setFilter("");
    setOpen(false);
    setTypingEnabled(false);
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
      setTypingEnabled(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleInputPointerDown = (e: PointerEvent<HTMLInputElement>) => {
    if (!isMobile) return;

    if (!open) {
      // First tap on mobile: open list only, no keyboard
      e.preventDefault();
      setOpen(true);
      setFilter("");
      setTypingEnabled(false);
      return;
    }

    if (!typingEnabled) {
      // Second tap on mobile: make editable before focus so keyboard can open
      if (inputRef.current) {
        inputRef.current.readOnly = false;
      }
      setTypingEnabled(true);
    }
  };

  const handleFocus = () => {
    if (!isMobile) {
      setOpen(true);
      setFilter("");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          value={open ? filter || value : value}
          readOnly={isMobile && !typingEnabled}
          onFocus={handleFocus}
          onPointerDown={handleInputPointerDown}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-8 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (open) {
              setOpen(false);
              setTypingEnabled(false);
              return;
            }

            setOpen(true);
            setFilter("");
            setTypingEnabled(false);
            if (!isMobile) inputRef.current?.focus();
          }}
          className="absolute right-0 top-0 flex h-10 w-8 items-center justify-center text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-[60vh] w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-md">
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
              className={`cursor-pointer px-3 py-2 font-body text-sm hover:bg-accent hover:text-accent-foreground ${
                opt === value ? "bg-accent/50 font-medium text-foreground" : "text-foreground"
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ComboInput;
