import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PromoMessage = () => {
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    { text: "FREE DELIVERY ON ALL PREPAID ORDERS!" },
    { text: "New Arrivals - Fresh Styles Just In! Grab them before stock runs out!" },
  ];

  // Auto scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const nextMessage = () =>
    setCurrentMessage((prev) => (prev + 1) % messages.length);

  const prevMessage = () =>
    setCurrentMessage((prev) => (prev - 1 + messages.length) % messages.length);

  return (
    <div className="max-w-full h-[36px] bg-[#333333] text-white overflow-hidden relative sx:top-[10px] sx:h-[35.59px] md:top-[-95px] lg:top-[-106px]">
      <div className="flex items-center justify-between max-w-7xl mx-auto sm:px-6 py-2 overflow-hidden sx:h-[35.59px]">
        
        {/* Previous button */}
        <button
          onClick={prevMessage}
          className="p-1 sm:p-2 hover:bg-white/20 "
          aria-label="Previous message"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>

        {/* Message content */}
        <div className="flex-1 text-center px-2 overflow-hidden">
          <p className="text-[12px] sm:text-sm md:text-base font-medium truncate">
            {messages[currentMessage].text}
          </p>
        </div>

        {/* Next button */}
        <button
          onClick={nextMessage}
          className="p-1 sm:p-2 hover:bg-white/20 rounded-full transition duration-200 flex-shrink-0"
          aria-label="Next message"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};

export default PromoMessage;
