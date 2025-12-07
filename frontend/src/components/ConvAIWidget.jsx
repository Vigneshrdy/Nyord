import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';

const SCRIPT_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
const AGENT_ID = 'agent_7201kbwejrdkepvre24vca87srz1';

export default function ConvAIWidget() {
  const scriptRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Script is loaded globally in index.html; no dynamic injection needed here.
    // Keep this hook in case we need lifecycle in future.
    return () => {};
  }, []);

  return (
    <div>
      {/* Floating toggle button */}
      <div className="fixed right-6 bottom-6 z-50">
        {open && (
          <div className="w-80 h-112 md:w-96 md:h-[520px] bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden mb-3">
            <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm font-semibold">Assistant</div>
              <button onClick={() => setOpen(false)} className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700">Close</button>
            </div>
            <div className="p-2 h-[calc(100%-40px)] overflow-auto">
              {/* Custom element used by the ElevenLabs widget */}
              <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          title="Open assistant"
          className="w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-lg"
        >
          <MessageCircle size={20} />
        </button>
      </div>
    </div>
  );
}
