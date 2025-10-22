import * as React from "react";
import { Dot } from "lucide-react";

import { cn } from "@/lib/utils";

// Context type and default value
type Slot = {
  char: string;
  hasFakeCaret: boolean;
  isActive: boolean;
};

type OTPInputContextType = {
  slots: Slot[];
  setSlotChar: (index: number, char: string) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
};

const OTPInputContext = React.createContext<OTPInputContextType | undefined>(undefined);

// The main OTPInput component
const OTPInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    length?: number; // Number of OTP digits
    value?: string;
    onChange?: (value: string) => void;
    containerClassName?: string;
    className?: string;
  }
>(
  (
    {
      length = 6,
      value = "",
      onChange,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    const [slots, setSlots] = React.useState<Slot[]>(
      Array(length)
        .fill(null)
        .map((_, i) => ({
          char: value[i] || "",
          hasFakeCaret: false,
          isActive: i === 0,
        }))
    );

    const [activeIndex, setActiveIndex] = React.useState(0);

    React.useEffect(() => {
      // Update slots if value changes externally
      setSlots((prev) =>
        prev.map((slot, i) => ({
          ...slot,
          char: value[i] || "",
          isActive: i === activeIndex,
        }))
      );
    }, [value, activeIndex]);

    const setSlotChar = (index: number, char: string) => {
      setSlots((prev) => {
        const newSlots = [...prev];
        newSlots[index] = {
          ...newSlots[index],
          char,
        };
        return newSlots;
      });
      const newValue = slots
        .map((s, i) => (i === index ? char : s.char))
        .join("");
      onChange?.(newValue);
    };

    // Handle keyboard input on the whole container
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (slots[activeIndex].char) {
          setSlotChar(activeIndex, "");
        } else if (activeIndex > 0) {
          setActiveIndex(activeIndex - 1);
          setSlotChar(activeIndex - 1, "");
        }
      }
      else if (e.key.length === 1 && /^[0-9a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        setSlotChar(activeIndex, e.key);
        if (activeIndex < length - 1) {
          setActiveIndex(activeIndex + 1);
        }
      }
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeIndex > 0) setActiveIndex(activeIndex - 1);
      }
      else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (activeIndex < length - 1) setActiveIndex(activeIndex + 1);
      }
    };

    // Update isActive and hasFakeCaret flags for slots
    React.useEffect(() => {
      setSlots((prev) =>
        prev.map((slot, i) => ({
          ...slot,
          isActive: i === activeIndex,
          hasFakeCaret: i === activeIndex,
        }))
      );
    }, [activeIndex]);

    return (
      <OTPInputContext.Provider
        value={{ slots, setSlotChar, activeIndex, setActiveIndex }}
      >
        <div
          ref={ref}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={cn("inline-flex", containerClassName)}
          {...props}
        >
          {slots.map((slot, index) => (
            <div
              key={index}
              className={cn(
                "relative flex h-10 w-10 cursor-text items-center justify-center border border-gray-300 text-lg font-mono",
                slot.isActive ? "border-blue-500 ring-2 ring-blue-400" : "",
                className
              )}
              onClick={() => setActiveIndex(index)}
            >
              {slot.char}
              {slot.hasFakeCaret && (
                <div className="absolute right-2 top-2 h-5 w-px animate-caret-blink bg-black" />
              )}
            </div>
          ))}
        </div>
      </OTPInputContext.Provider>
    );
  }
);

OTPInput.displayName = "OTPInput";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center", className)} {...props} />,
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  if (!inputOTPContext) {
    throw new Error("InputOTPSlot must be used within an OTPInputProvider");
  }
  const { slots } = inputOTPContext;
  const { char, hasFakeCaret, isActive } = slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ ...props }, ref) => (
    <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>
  ),
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export {
  OTPInput,
  OTPInputContext,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
};
