"use client";

import { useState } from "react";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  async function sendAirtime() {
    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      setResponse(null);

      const res = await fetch("/api/send-airtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        padding: 20,
      }}
    >
      <div
        style={{
          width: 400,
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 5px 20px rgba(0,0,0,.1)",
        }}
      >
        <h2>Send Airtime</h2>

        <p>Recipient: +256759997376</p>

        <input
          type="number"
          placeholder="Amount in UGX"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 10,
            marginBottom: 20,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />

        <button
          onClick={sendAirtime}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            background: "#16a34a",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          {loading ? "Sending..." : "Send Airtime"}
        </button>

        {response && (
          <div
            style={{
              marginTop: 20,
              background: "#f8f8f8",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 13,
              }}
            >
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}