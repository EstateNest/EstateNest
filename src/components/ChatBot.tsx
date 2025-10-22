import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hi! I'm here to help you find the perfect insurance solution. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");

  const quickReplies = [
    "Get a Quote",
    "Schedule Appointment",
    "Learn About Life Insurance",
    "Contact Agent",
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { type: "user", text: input }]);
    
    // Simulate bot response
    setTimeout(() => {
      let botResponse = "I'd be happy to help! ";
      
      if (input.toLowerCase().includes("quote")) {
        botResponse += "To get a personalized quote, please visit our quote page or call us at 780-860-3191.";
      } else if (input.toLowerCase().includes("appointment")) {
        botResponse += "You can schedule an appointment on our quote page. Would you like me to direct you there?";
      } else {
        botResponse += "For detailed information, our team is ready to assist. Call 780-860-3191 or email hello@estatenest.ca.";
      }
      
      setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);
    }, 800);

    setInput("");
  };

  const handleQuickReply = (reply: string) => {
    setInput(reply);
    handleSend();
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-accent rounded-full shadow-glow flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-accent-foreground" />
        ) : (
          <MessageCircle className="w-6 h-6 text-accent-foreground" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-card rounded-2xl shadow-elegant border border-border flex flex-col animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-primary text-primary-foreground p-4 rounded-t-2xl">
            <h3 className="font-semibold">Estate Nest Assistant</h3>
            <p className="text-xs text-primary-foreground/80">
              We typically reply instantly
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    message.type === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Replies */}
          <div className="p-3 border-t border-border">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="bg-gradient-accent hover:shadow-glow"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
