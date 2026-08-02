import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Loader2,
  Mail,
  MessageCircle,
  Minus,
  Phone,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CHATBOT_CLOSING_MESSAGE,
  CHATBOT_DECLINED_MESSAGE,
  CHATBOT_DISCLAIMER,
  CHATBOT_ENQUIRY_NOTICE,
  CHATBOT_FAQ_FALLBACK,
  CHATBOT_MARKETING_CONSENT,
  CHATBOT_SENSITIVE_WARNING,
  chatbotFaqs,
  chatbotProducts,
  type ChatbotFaq,
  type ChatbotProductCode,
} from "@/content/chatbotContent";
import { trackChatbotEvent } from "@/lib/chatbotAnalytics";
import { cn } from "@/lib/utils";
import logo from "@/assets/icon-02.png";

type ChatStep =
  | "consent"
  | "name"
  | "phone"
  | "email"
  | "confirm"
  | "interests"
  | "options"
  | "faq-categories"
  | "faq-questions"
  | "faq-answer"
  | "declined"
  | "closing";

interface ContactDraft {
  fullName: string;
  phone: string;
  email: string;
}

interface ApiResult {
  success?: boolean;
  message?: string;
  sensitive?: boolean;
  prospectReference?: string;
  destination?: string;
  status?: string;
  resumed?: boolean;
  interests?: string[];
}

const publicChatPaths = new Set([
  "/",
  "/services",
  "/about",
  "/calculators",
  "/careers",
  "/contact",
  "/faq",
  "/service-areas",
]);

const sensitivePattern = /<[^>]+>|javascript:|social insurance|bank account|credit card|password|passport|health card|medical report|diagnosis|medication/i;
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,119}$/u;

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return "Phone number provided";
  return `(***) ***-${digits.slice(-4)}`;
}

function phoneIsValid(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national.length === 10 && !national.startsWith("0") && !national.startsWith("1");
}

function readUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const values: Record<string, string> = {};
  for (const key of ["source", "medium", "campaign", "term", "content"]) {
    const value = params.get(`utm_${key}`)?.trim();
    if (value) values[key] = value.slice(0, 100);
  }
  return values;
}

async function chatbotPost(action: string, payload: Record<string, unknown> = {}): Promise<ApiResult> {
  const response = await fetch("/api/chatbot", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, website: "", ...payload }),
  });
  const result = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok || !result.success) {
    const error = new Error(result.message || "The secure chat service is temporarily unavailable.") as Error & { sensitive?: boolean };
    error.sensitive = result.sensitive;
    throw error;
  }
  return result;
}

const ChatBot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ChatStep>("consent");
  const [contact, setContact] = useState<ContactDraft>({ fullName: "", phone: "", email: "" });
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [serverSessionStarted, setServerSessionStarted] = useState(false);
  const [prospectReference, setProspectReference] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<ChatbotProductCode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFaq, setSelectedFaq] = useState<ChatbotFaq | null>(null);
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const isAvailable = publicChatPaths.has(location.pathname);

  const categories = useMemo(
    () => Array.from(new Set(chatbotFaqs.map((faq) => faq.category))),
    [],
  );
  const categoryQuestions = useMemo(
    () => chatbotFaqs.filter((faq) => faq.category === selectedCategory),
    [selectedCategory],
  );

  useEffect(() => {
    setIsOpen(false);
    setError("");
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTarget = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-chatbot-autofocus]")?.focus();
    }, 30);
    return () => window.clearTimeout(focusTarget);
  }, [isOpen, step, selectedCategory, selectedFaq]);

  if (!isAvailable) return null;

  const setInlineError = (message: string) => {
    setError(message);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("[role='alert']")?.focus());
  };

  const openChat = () => {
    setIsOpen(true);
    trackChatbotEvent("chatbot_opened", { step });
  };

  const agreeAndContinue = async () => {
    setIsWorking(true);
    setError("");
    try {
      const result = await chatbotPost("start", {
        sourcePage: `${window.location.pathname}${window.location.hash || ""}`,
        referrer: document.referrer,
        utm: readUtm(),
        marketingConsent,
      });
      const resumedProducts = (result.interests || []).filter(
        (code): code is ChatbotProductCode => chatbotProducts.some((product) => product.code === code),
      );
      setServerSessionStarted(true);
      setSelectedProducts(resumedProducts);
      setProspectReference(result.prospectReference || "");
      if (["INTEREST_SELECTED", "HANDOFF_CREATED", "QUOTE_STARTED"].includes(result.status || "")) {
        setStep("options");
      } else if (result.status === "CONTACT_CONFIRMED" && result.prospectReference) {
        setStep("interests");
      } else {
        setStep("name");
      }
      trackChatbotEvent("chatbot_consent_accepted", { step: "consent", resumed: result.resumed === true });
    } catch (requestError) {
      setInlineError(requestError instanceof Error ? requestError.message : "Unable to start the secure chat.");
    } finally {
      setIsWorking(false);
    }
  };

  const submitName = (event: React.FormEvent) => {
    event.preventDefault();
    const value = contact.fullName.trim().replace(/\s+/g, " ");
    if (sensitivePattern.test(value)) return setInlineError(CHATBOT_SENSITIVE_WARNING);
    if (!namePattern.test(value)) return setInlineError("Enter your name using letters, spaces, apostrophes, periods, or hyphens.");
    setContact((current) => ({ ...current, fullName: value }));
    setError("");
    setStep("phone");
  };

  const submitPhone = (event: React.FormEvent) => {
    event.preventDefault();
    if (sensitivePattern.test(contact.phone)) return setInlineError(CHATBOT_SENSITIVE_WARNING);
    if (!phoneIsValid(contact.phone)) return setInlineError("Enter a valid 10-digit Canadian or US phone number.");
    setError("");
    setStep("email");
  };

  const submitEmail = (event: React.FormEvent) => {
    event.preventDefault();
    const value = contact.email.trim().toLowerCase();
    if (sensitivePattern.test(value)) return setInlineError(CHATBOT_SENSITIVE_WARNING);
    if (!emailPattern.test(value)) return setInlineError("Enter a valid email address.");
    setContact((current) => ({ ...current, email: value }));
    setError("");
    setStep("confirm");
  };

  const confirmContact = async () => {
    setIsWorking(true);
    setError("");
    try {
      const result = await chatbotPost("confirm-contact", { ...contact });
      setProspectReference(result.prospectReference || "");
      setStep("interests");
      trackChatbotEvent("chatbot_contact_completed", { step: "contact_confirmed" });
    } catch (requestError) {
      const typedError = requestError as Error & { sensitive?: boolean };
      setInlineError(typedError.sensitive ? CHATBOT_SENSITIVE_WARNING : typedError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const toggleProduct = (code: ChatbotProductCode) => {
    setError("");
    setSelectedProducts((current) => {
      if (code === "NOT_SURE") return current.includes(code) ? [] : [code];
      const withoutNotSure = current.filter((value) => value !== "NOT_SURE");
      return withoutNotSure.includes(code)
        ? withoutNotSure.filter((value) => value !== code)
        : [...withoutNotSure, code];
    });
  };

  const saveInterests = async () => {
    if (!selectedProducts.length) return setInlineError("Select at least one option, including “Not Sure Yet” if appropriate.");
    setIsWorking(true);
    setError("");
    try {
      await chatbotPost("interests", { interests: selectedProducts });
      setStep("options");
      trackChatbotEvent("chatbot_product_selected", { productCodes: selectedProducts });
    } catch (requestError) {
      setInlineError(requestError instanceof Error ? requestError.message : "Unable to save the selected interests.");
    } finally {
      setIsWorking(false);
    }
  };

  const continueToQuote = async () => {
    setIsWorking(true);
    setError("");
    try {
      const result = await chatbotPost("handoff");
      trackChatbotEvent("chatbot_quote_clicked", { productCodes: selectedProducts });
      setIsOpen(false);
      navigate(result.destination || "/quote");
    } catch (requestError) {
      setInlineError(requestError instanceof Error ? requestError.message : "Unable to prepare the secure quote handoff.");
    } finally {
      setIsWorking(false);
    }
  };

  const finishConversation = async (action: "follow-up" | "end") => {
    setIsWorking(true);
    setError("");
    try {
      await chatbotPost(action);
      setStep("closing");
    } catch (requestError) {
      setInlineError(requestError instanceof Error ? requestError.message : "Unable to update the conversation.");
    } finally {
      setIsWorking(false);
    }
  };

  const restartConversation = () => {
    setError("");
    setSelectedCategory("");
    setSelectedFaq(null);
    setSelectedProducts([]);
    if (prospectReference) {
      setStep("interests");
      return;
    }
    if (serverSessionStarted) {
      setContact({ fullName: "", phone: "", email: "" });
      setStep("name");
      return;
    }
    setMarketingConsent(false);
    setStep("consent");
  };

  const renderError = () => error ? (
    <p
      tabIndex={-1}
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm leading-relaxed text-destructive"
    >
      {error}
    </p>
  ) : null;

  const renderStep = () => {
    if (step === "consent") {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-foreground">Welcome to Estate Nest Inc.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              I can help you explore general insurance options and connect you with a licensed advisor.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
            <ShieldCheck aria-hidden="true" className="mb-2 h-5 w-5 text-primary" />
            {CHATBOT_ENQUIRY_NOTICE}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            By selecting Agree and Continue, you acknowledge Estate Nest Inc.’s{" "}
            <Link className="font-medium text-primary underline underline-offset-2" to="/privacy" onClick={() => setIsOpen(false)}>Privacy Policy</Link>,{" "}
            <Link className="font-medium text-primary underline underline-offset-2" to="/cookies" onClick={() => setIsOpen(false)}>Cookie Policy</Link>, and{" "}
            <Link className="font-medium text-primary underline underline-offset-2" to="/terms" onClick={() => setIsOpen(false)}>Terms and Conditions</Link>. Estate Nest Inc. is E&amp;O insured.
          </p>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm leading-relaxed">
            <Checkbox
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked === true)}
              aria-label={CHATBOT_MARKETING_CONSENT}
              className="mt-0.5 h-5 w-5"
            />
            <span>{CHATBOT_MARKETING_CONSENT} <span className="font-medium">Optional</span></span>
          </label>
          {renderError()}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button data-chatbot-autofocus type="button" className="min-h-11 bg-gradient-accent hover:shadow-glow" disabled={isWorking} onClick={agreeAndContinue}>
              {isWorking ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}
              Agree and Continue
            </Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => {
              setStep("declined");
              trackChatbotEvent("chatbot_abandoned", { step: "consent", action: "not_now" });
            }}>
              Not Now
            </Button>
          </div>
        </div>
      );
    }

    if (step === "name" || step === "phone" || step === "email") {
      const details = step === "name"
        ? { label: "May I have your full name?", field: "fullName" as const, type: "text", autoComplete: "name", inputMode: "text" as const, placeholder: "Full name" }
        : step === "phone"
          ? { label: "What is the best phone number for an Estate Nest advisor to reach you?", field: "phone" as const, type: "tel", autoComplete: "tel", inputMode: "tel" as const, placeholder: "780-555-0123" }
          : { label: "What email address should we use to follow up?", field: "email" as const, type: "email", autoComplete: "email", inputMode: "email" as const, placeholder: "name@example.ca" };
      const submit = step === "name" ? submitName : step === "phone" ? submitPhone : submitEmail;
      const progress = step === "name" ? "1 of 3" : step === "phone" ? "2 of 3" : "3 of 3";
      return (
        <form className="space-y-4" onSubmit={submit} noValidate data-clarity-mask="true">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Contact details · {progress}</p>
            <Label htmlFor={`chatbot-${details.field}`} className="mt-2 block text-base leading-snug">{details.label}</Label>
          </div>
          <Input
            data-chatbot-autofocus
            data-clarity-mask="true"
            id={`chatbot-${details.field}`}
            type={details.type}
            inputMode={details.inputMode}
            autoComplete={details.autoComplete}
            value={contact[details.field]}
            placeholder={details.placeholder}
            maxLength={details.field === "email" ? 255 : 120}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "chatbot-field-error" : undefined}
            onChange={(event) => {
              setError("");
              setContact((current) => ({ ...current, [details.field]: event.target.value }));
            }}
            className="h-12"
          />
          {error && <div id="chatbot-field-error">{renderError()}</div>}
          <div className="flex gap-2">
            {step !== "name" && (
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setStep(step === "email" ? "phone" : "name")}>
                <ArrowLeft aria-hidden="true" /> Back
              </Button>
            )}
            <Button type="submit" className="min-h-11 flex-1 bg-gradient-accent hover:shadow-glow">
              Continue <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">Do not enter medical, banking, identification, password, or payment information.</p>
        </form>
      );
    }

    if (step === "confirm") {
      return (
        <div className="space-y-4" data-clarity-mask="true">
          <div>
            <p className="text-base font-semibold">Please confirm your contact details</p>
            <p className="mt-1 text-sm text-muted-foreground">A CRM prospect is created only after you confirm.</p>
          </div>
          <dl className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <div><dt className="font-medium text-muted-foreground">Name</dt><dd className="mt-0.5 text-foreground">{contact.fullName}</dd></div>
            <div><dt className="font-medium text-muted-foreground">Phone</dt><dd className="mt-0.5 text-foreground">{maskPhone(contact.phone)}</dd></div>
            <div><dt className="font-medium text-muted-foreground">Email</dt><dd className="mt-0.5 break-all text-foreground">{contact.email}</dd></div>
          </dl>
          {renderError()}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button data-chatbot-autofocus type="button" className="min-h-11 bg-gradient-accent hover:shadow-glow" disabled={isWorking} onClick={confirmContact}>
              {isWorking ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}
              Confirm
            </Button>
            <Button type="button" variant="outline" className="min-h-11" disabled={isWorking} onClick={() => setStep("name")}>Edit</Button>
          </div>
        </div>
      );
    }

    if (step === "interests") {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold leading-snug">What type of insurance or financial protection would you like information about today?</p>
            <p className="mt-1 text-sm text-muted-foreground">Select one or more. This does not create a recommendation.</p>
          </div>
          {prospectReference && <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">Secure prospect reference: {prospectReference}</p>}
          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Insurance interests">
            {chatbotProducts.map((product, index) => {
              const selected = selectedProducts.includes(product.code);
              return (
                <Button
                  key={product.code}
                  data-chatbot-autofocus={index === 0 ? "true" : undefined}
                  type="button"
                  variant="outline"
                  aria-pressed={selected}
                  className={cn(
                    "min-h-12 h-auto justify-start whitespace-normal px-3 py-2 text-left",
                    selected && "border-primary bg-primary/10 text-primary shadow-card",
                  )}
                  onClick={() => toggleProduct(product.code)}
                >
                  <span aria-hidden="true" className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                  {product.label}
                </Button>
              );
            })}
          </div>
          {renderError()}
          <Button type="button" className="min-h-11 w-full bg-gradient-accent hover:shadow-glow" disabled={isWorking || !selectedProducts.length} onClick={saveInterests}>
            {isWorking ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
            Save Interests <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      );
    }

    if (step === "options") {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold">How would you like to continue?</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Thank you. To provide the remaining information securely, continue to the Estate Nest Quote Request form.</p>
          </div>
          <div className="space-y-2">
            <Button data-chatbot-autofocus type="button" className="min-h-12 w-full justify-between bg-gradient-accent hover:shadow-glow" disabled={isWorking} onClick={continueToQuote}>
              Continue to Quote Request <ArrowRight aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" className="min-h-11 w-full justify-start" disabled={isWorking} onClick={() => setStep("faq-categories")}>
              <CircleHelp aria-hidden="true" /> Ask a General Question
            </Button>
            <Button type="button" variant="outline" className="min-h-11 w-full justify-start" disabled={isWorking} onClick={() => finishConversation("follow-up")}>
              <Phone aria-hidden="true" /> Request Advisor Follow-Up
            </Button>
            <Button type="button" variant="ghost" className="min-h-11 w-full" disabled={isWorking} onClick={() => finishConversation("end")}>End Chat</Button>
          </div>
          {renderError()}
          <p className="rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">{CHATBOT_DISCLAIMER}</p>
        </div>
      );
    }

    if (step === "faq-categories") {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold">Choose a general topic</p>
            <p className="mt-1 text-sm text-muted-foreground">Answers come from Estate Nest’s versioned, approved FAQ library.</p>
          </div>
          <div className="space-y-2">
            {categories.map((category, index) => (
              <Button key={category} data-chatbot-autofocus={index === 0 ? "true" : undefined} type="button" variant="outline" className="min-h-11 h-auto w-full justify-between whitespace-normal py-2 text-left" onClick={() => {
                setSelectedCategory(category);
                setStep("faq-questions");
              }}>
                {category}<ArrowRight aria-hidden="true" />
              </Button>
            ))}
          </div>
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => setStep("options")}><ArrowLeft aria-hidden="true" /> Back</Button>
        </div>
      );
    }

    if (step === "faq-questions") {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{selectedCategory}</p>
            <p className="mt-1 text-base font-semibold">Select a question</p>
          </div>
          <div className="space-y-2">
            {categoryQuestions.map((faq, index) => (
              <Button key={faq.id} data-chatbot-autofocus={index === 0 ? "true" : undefined} type="button" variant="outline" className="min-h-11 h-auto w-full justify-between whitespace-normal py-3 text-left leading-snug" onClick={() => {
                setSelectedFaq(faq);
                setStep("faq-answer");
              }}>
                {faq.question}<ArrowRight aria-hidden="true" />
              </Button>
            ))}
            <Button type="button" variant="outline" className="min-h-11 h-auto w-full whitespace-normal py-3 text-left" onClick={() => {
              setSelectedFaq({ id: "fallback", category: selectedCategory, question: "My question is not listed", answer: CHATBOT_FAQ_FALLBACK });
              setStep("faq-answer");
            }}>My question is not listed</Button>
          </div>
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => setStep("faq-categories")}><ArrowLeft aria-hidden="true" /> Topics</Button>
        </div>
      );
    }

    if (step === "faq-answer" && selectedFaq) {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{selectedFaq.category}</p>
            <h3 className="mt-1 text-base font-semibold leading-snug">{selectedFaq.question}</h3>
          </div>
          <p data-chatbot-autofocus tabIndex={-1} className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">{selectedFaq.answer}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{CHATBOT_DISCLAIMER}</p>
          <div className="space-y-2">
            <Button type="button" className="min-h-11 w-full bg-gradient-accent hover:shadow-glow" disabled={isWorking} onClick={continueToQuote}>Continue to Quote Request <ArrowRight aria-hidden="true" /></Button>
            <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => setStep("faq-questions")}><ArrowLeft aria-hidden="true" /> More Questions</Button>
            <Button type="button" variant="ghost" className="min-h-11 w-full" disabled={isWorking} onClick={() => finishConversation("follow-up")}>Request Advisor Follow-Up</Button>
          </div>
          {renderError()}
        </div>
      );
    }

    if (step === "declined") {
      return (
        <div className="space-y-4 text-center">
          <p data-chatbot-autofocus tabIndex={-1} className="text-sm leading-relaxed text-foreground">{CHATBOT_DECLINED_MESSAGE}</p>
          <div className="space-y-2">
            <Button type="button" className="min-h-11 w-full bg-gradient-accent hover:shadow-glow" onClick={restartConversation}><RefreshCcw aria-hidden="true" /> Restart Conversation</Button>
            <Button asChild variant="outline" className="min-h-11 w-full"><a href="tel:780-860-3191"><Phone aria-hidden="true" /> Call 780-860-3191</a></Button>
            <Button asChild variant="outline" className="min-h-11 w-full"><a href="mailto:hello@estatenest.ca"><Mail aria-hidden="true" /> Email Estate Nest</a></Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Check aria-hidden="true" className="h-6 w-6" /></div>
        <p data-chatbot-autofocus tabIndex={-1} className="text-sm leading-relaxed text-foreground">{CHATBOT_CLOSING_MESSAGE}</p>
        <div className="space-y-2">
          <Button type="button" className="min-h-11 w-full bg-gradient-accent hover:shadow-glow" disabled={isWorking} onClick={continueToQuote}>Continue to Quote Request <ArrowRight aria-hidden="true" /></Button>
          <Button asChild variant="outline" className="min-h-11 w-full"><a href="mailto:hello@estatenest.ca"><Mail aria-hidden="true" /> Email hello@estatenest.ca</a></Button>
          <Button type="button" variant="ghost" className="min-h-11 w-full" onClick={restartConversation}><RefreshCcw aria-hidden="true" /> Restart Conversation</Button>
        </div>
        {renderError()}
      </div>
    );
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && isOpen && !["closing", "declined"].includes(step)) {
        trackChatbotEvent("chatbot_abandoned", { step, action: "closed" });
      }
    }}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          onClick={openChat}
          aria-label="Open Estate Nest insurance assistant"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-accent px-4 font-semibold text-accent-foreground shadow-glow transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
        >
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
          <span className="hidden sm:inline">Chat with Estate Nest</span>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-slate-950/25 backdrop-blur-[1px] data-[state=open]:animate-fade-in motion-reduce:animate-none" />
        <DialogPrimitive.Content
          ref={panelRef}
          data-testid="insurance-assistant-panel"
          data-clarity-mask="true"
          aria-describedby="estate-nest-chatbot-description"
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[80] flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant outline-none data-[state=open]:animate-scale-in motion-reduce:animate-none sm:left-auto sm:right-6 sm:w-[410px] sm:max-w-[calc(100vw-3rem)]"
        >
          <div className="flex items-center justify-between gap-3 bg-gradient-primary px-4 py-3 text-primary-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/95 p-1"><img src={logo} alt="" className="h-8 w-8 object-contain" /></span>
              <div className="min-w-0">
                <DialogPrimitive.Title className="truncate text-base font-semibold">Estate Nest Insurance Assistant</DialogPrimitive.Title>
                <DialogPrimitive.Description id="estate-nest-chatbot-description" className="text-xs text-primary-foreground/85">General information and advisor connection</DialogPrimitive.Description>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" aria-label="Restart conversation" className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={restartConversation}><RefreshCcw aria-hidden="true" className="h-4 w-4" /></button>
              <DialogPrimitive.Close asChild>
                <button type="button" aria-label="Minimize chat" className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Minus aria-hidden="true" className="h-5 w-5" /></button>
              </DialogPrimitive.Close>
              <DialogPrimitive.Close asChild>
                <button type="button" aria-label="Close chat" className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><X aria-hidden="true" className="h-5 w-5" /></button>
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
            {renderStep()}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground">
            <Link to="/privacy" onClick={() => setIsOpen(false)} className="min-h-8 inline-flex items-center font-medium text-primary underline underline-offset-2">Privacy</Link>
            <span>Do not enter sensitive information</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default ChatBot;
