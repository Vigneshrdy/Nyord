import React from 'react';

const AGENT_ID = "agent_7201kbwejrdkepvre24vca87srz1";

export default function ConvAIWidget() {
  return (
    <elevenlabs-convai
      agent-id={AGENT_ID}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999
      }}
    ></elevenlabs-convai>
  );
}
