  const [cleaningState, setCleaningState] = useState<string | null>(null);
  const [cleanedResults, setCleanedResults] = useState<any[]>([]);

  // This simulates the mobile money paywall trigger
  const handleCleanText = async (type: "ai_bypass" | "plagiarism_bypass", textsToClean: string[]) => {
    // 1. Trigger Payment Modal First
    const confirmed = window.confirm("Unlock Remediation Engine for UGX 25,000 via Mobile Money. Proceed?");
    if (!confirmed) return;

    // 2. If payment succeeds, run the engine
    setCleaningState(type);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flaggedTexts: textsToClean, type }),
      });
      
      const json = await res.json();
      if (json.success) {
        setCleanedResults(json.cleanedData);
      }
    } catch (error) {
      alert("Error running the remediation engine.");
    } finally {
      setCleaningState(null);
    }
  };
