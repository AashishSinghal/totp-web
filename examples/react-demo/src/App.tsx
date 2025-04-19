import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateTOTP, verifyTOTP, getTOTPAuthUri } from "totp-web";

function App() {
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [qrUri, setQrUri] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [copyMessage, setCopyMessage] = useState<string>("");

  useEffect(() => {
    // Generate a new secret when the component mounts
    const generateNewSecret = async () => {
      try {
        const result = await generateTOTP({});
        setSecret(result.secret);
        setRemainingSeconds(result.remainingSeconds);
        setQrUri(
          getTOTPAuthUri({
            secret: result.secret,
            accountName: "demo@example.com",
            issuer: "TOTP Web Demo",
          })
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate secret"
        );
      }
    };

    generateNewSecret();
  }, []);

  // Update token and countdown every second
  useEffect(() => {
    const updateToken = async () => {
      if (!secret) return;
      try {
        const result = await generateTOTP({ secret });
        setToken(result.token);
        setRemainingSeconds(result.remainingSeconds);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate token"
        );
      }
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  const handleVerify = async () => {
    if (!secret || !verificationToken) return;
    try {
      const result = await verifyTOTP(verificationToken, { secret });
      setIsValid(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify token");
    }
  };

  // Helper function to format the countdown
  const formatCountdown = (seconds: number) => {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyMessage(message);
        setTimeout(() => setCopyMessage(""), 2000);
      })
      .catch((err) => {
        setError("Failed to copy: " + err);
      });
  };

  return (
    <div
      className="App"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "20px",
          textAlign: "center",
          borderBottom: "1px solid #eee",
          backgroundColor: "#f8f9fa",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>TOTP Web Demo</h1>
        <a
          href="https://github.com/AashishSinghal/totp-web"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "#24292e",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2f363d"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#24292e"}
        >
          <svg
            height="16"
            width="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ marginRight: "4px" }}
          >
            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
          </svg>
          Star on GitHub
        </a>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          padding: "20px",
          gap: "20px",
        }}
      >
        {/* Left column */}
        <div style={{ flex: 1, maxWidth: "50%" }}>
          {error && (
            <div style={{ color: "red", marginBottom: "20px" }}>
              Error: {error}
            </div>
          )}

          <div style={{ marginBottom: "30px" }}>
            <h2>Current Secret</h2>
            <div style={{ position: "relative" }}>
              <code
                style={{
                  padding: "15px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                  display: "block",
                  wordBreak: "break-all",
                  marginBottom: "10px",
                }}
              >
                {secret}
              </code>
              <button
                onClick={() => copyToClipboard(secret, "Secret copied!")}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  border: "none",
                  background: "#007bff",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <h2>QR Code</h2>
            {qrUri && (
              <div
                style={{
                  padding: "20px",
                  background: "white",
                  display: "inline-block",
                  borderRadius: "8px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                <QRCodeSVG value={qrUri} size={200} />
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ flex: 1, maxWidth: "50%" }}>
          <div style={{ marginBottom: "30px" }}>
            <h2>Current Token</h2>
            <div
              style={{
                position: "relative",
                padding: "20px",
                background: "#f5f5f5",
                borderRadius: "4px",
                textAlign: "center",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ position: "relative" }}>
                <code
                  style={{
                    fontSize: "24px",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  {token}
                </code>
                <button
                  onClick={() => copyToClipboard(token, "Token copied!")}
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    border: "none",
                    background: "#007bff",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: remainingSeconds <= 5 ? "#ff4444" : "#666",
                  transition: "color 0.3s ease",
                }}
              >
                Expires in {formatCountdown(remainingSeconds)}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: "4px",
                  backgroundColor:
                    remainingSeconds <= 5 ? "#ff4444" : "#4CAF50",
                  width: `${(remainingSeconds / 30) * 100}%`,
                  transition: "width 1s linear, background-color 0.3s ease",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <h2>Verify Token</h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                type="text"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                placeholder="Enter token to verify"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              <button
                onClick={handleVerify}
                style={{
                  padding: "10px 20px",
                  borderRadius: "4px",
                  border: "none",
                  background: "#007bff",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Verify
              </button>
            </div>
            {isValid !== null && (
              <div
                style={{
                  marginTop: "10px",
                  color: isValid ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {isValid ? "Token is valid!" : "Token is invalid!"}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Copy message */}
      {copyMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "10px 20px",
            background: "#4CAF50",
            color: "white",
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            animation: "fadeInOut 2s forwards",
          }}
        >
          {copyMessage}
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          padding: "20px",
          textAlign: "center",
          borderTop: "1px solid #eee",
          backgroundColor: "#f8f9fa",
        }}
      >
        <p style={{ margin: 0 }}>
          Made with ❤️ by{" "}
          <a
            href="https://github.com/AashishSinghal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Aashish Singhal
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
