import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateTOTP, verifyTOTP, getTOTPAuthUri, RateLimiter, TOTPOptions } from "totp-web";

function App() {
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [qrUri, setQrUri] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [copyMessage, setCopyMessage] = useState<string>("");

  // TOTP Configuration State
  const [algorithm, setAlgorithm] = useState<'SHA-1' | 'SHA-256' | 'SHA-512'>('SHA-1');
  const [digits, setDigits] = useState<number>(6);
  const [period, setPeriod] = useState<number>(30);
  const [charSet, setCharSet] = useState<string>('0123456789');
  const [window, setWindow] = useState<number>(1);

  // Create a rate limiter instance
  const [rateLimiter] = useState(() => new RateLimiter(5, 60000)); // 5 attempts per minute
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);

  // Function to handle configuration changes
  const handleConfigChange = async (
    key: keyof TOTPOptions,
    value: string | number
  ) => {
    // Update the state
    switch (key) {
      case 'algorithm':
        setAlgorithm(value as 'SHA-1' | 'SHA-256' | 'SHA-512');
        break;
      case 'digits':
        setDigits(value as number);
        break;
      case 'period':
        setPeriod(value as number);
        break;
      case 'charSet':
        setCharSet(value as string);
        break;
      case 'window':
        setWindow(value as number);
        break;
    }

    // Generate new TOTP with updated configuration
    try {
      const result = await generateTOTP({
        secret,
        algorithm: key === 'algorithm' ? value as 'SHA-1' | 'SHA-256' | 'SHA-512' : algorithm,
        digits: key === 'digits' ? value as number : digits,
        period: key === 'period' ? value as number : period,
        charSet: key === 'charSet' ? value as string : charSet,
        window: key === 'window' ? value as number : window
      });
      setToken(result.token);
      setRemainingSeconds(result.remainingSeconds);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate token"
      );
    }
  };

  useEffect(() => {
    // Generate a new secret when the component mounts
    const generateNewSecret = async () => {
      try {
        const result = await generateTOTP({
          algorithm,
          digits,
          period,
          charSet,
          window
        });
        setSecret(result.secret);
        setRemainingSeconds(result.remainingSeconds);
        setQrUri(
          getTOTPAuthUri({
            secret: result.secret,
            accountName: "demo@example.com",
            issuer: "TOTP Web Demo",
            algorithm,
            digits,
            period
          })
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate secret"
        );
      }
    };

    generateNewSecret();
  }, [algorithm, digits, period, charSet, window]);

  // Update token and countdown every second
  useEffect(() => {
    const updateToken = async () => {
      if (!secret) return;
      try {
        const result = await generateTOTP({ 
          secret,
          algorithm,
          digits,
          period,
          charSet,
          window
        });
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
  }, [secret, algorithm, digits, period, charSet, window]);

  const handleVerify = async () => {
    if (!secret || !verificationToken) return;
    
    // Check rate limiting
    if (rateLimiter.isRateLimited('verify')) {
      const timeUntilReset = Math.ceil(rateLimiter.getTimeUntilReset('verify') / 1000);
      setError(`Too many attempts. Please try again in ${timeUntilReset} seconds.`);
      return;
    }

    try {
      const result = await verifyTOTP(verificationToken, { 
        secret,
        algorithm,
        digits,
        period,
        charSet,
        window
      });
      setIsValid(result);
      
      // Reset rate limiter on successful verification
      if (result) {
        rateLimiter.reset('verify');
      }

      // Update remaining attempts
      setRemainingAttempts(rateLimiter.getRemainingAttempts('verify'));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify token");
    }
  };

  // Update remaining attempts display
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingAttempts(rateLimiter.getRemainingAttempts('verify'));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimiter]);

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
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "20px",
          textAlign: "center",
          borderBottom: "1px solid #333",
          backgroundColor: "#242424",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <h1 style={{ margin: 0, color: "#ffffff" }}>TOTP Web Demo</h1>
        <a
          href="https://github.com/AashishSinghal/totp-web"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "#2d333b",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#373e47"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2d333b"}
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
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {/* Left column - Secret and Configuration */}
        <div style={{ flex: 1, maxWidth: "45%" }}>
          {error && (
            <div style={{ 
              color: "#ff4444", 
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#2d2d2d",
              borderRadius: "4px",
              border: "1px solid #ff4444"
            }}>
              Error: {error}
            </div>
          )}

          <div style={{ 
            marginBottom: "20px",
            backgroundColor: "#242424",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
          }}>
            <h2 style={{ marginTop: 0, color: "#ffffff", fontSize: "1.2em" }}>Current Secret</h2>
            <div style={{ position: "relative" }}>
              <code
                style={{
                  padding: "12px",
                  background: "#2d2d2d",
                  borderRadius: "4px",
                  display: "block",
                  wordBreak: "break-all",
                  marginBottom: "10px",
                  color: "#ffffff",
                  border: "1px solid #333"
                }}
              >
                {secret}
              </code>
              <button
                onClick={() => copyToClipboard(secret, "Secret copied!")}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "none",
                  background: "#0366d6",
                  color: "white",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0256b4"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0366d6"}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{ 
            backgroundColor: "#242424",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
          }}>
            <h2 style={{ marginTop: 0, color: "#ffffff", fontSize: "1.2em" }}>TOTP Configuration</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#ffffff" }}>
                  Algorithm:
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => handleConfigChange('algorithm', e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #333",
                    background: "#2d2d2d",
                    color: "#ffffff"
                  }}
                >
                  <option value="SHA-1">SHA-1</option>
                  <option value="SHA-256">SHA-256</option>
                  <option value="SHA-512">SHA-512</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#ffffff" }}>
                  Digits: {digits}
                </label>
                <input
                  type="range"
                  min="4"
                  max="8"
                  value={digits}
                  onChange={(e) => handleConfigChange('digits', Number(e.target.value))}
                  style={{ 
                    width: "100%",
                    accentColor: "#0366d6"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#ffffff" }}>
                  Period (seconds): {period}
                </label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="15"
                  value={period}
                  onChange={(e) => handleConfigChange('period', Number(e.target.value))}
                  style={{ 
                    width: "100%",
                    accentColor: "#0366d6"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#ffffff" }}>
                  Window: {window}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  value={window}
                  onChange={(e) => handleConfigChange('window', Number(e.target.value))}
                  style={{ 
                    width: "100%",
                    accentColor: "#0366d6"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#ffffff" }}>
                  Character Set:
                </label>
                <select
                  value={charSet}
                  onChange={(e) => handleConfigChange('charSet', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #333",
                    background: "#2d2d2d",
                    color: "#ffffff"
                  }}
                >
                  <option value="0123456789">Numeric (0-9)</option>
                  <option value="0123456789ABCDEF">Hexadecimal (0-9, A-F)</option>
                  <option value="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567">Base32 (A-Z, 2-7)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - QR Code, Token and Verification */}
        <div style={{ flex: 1, maxWidth: "55%" }}>
          <div style={{ 
            marginBottom: "20px",
            backgroundColor: "#242424",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h2 style={{ marginTop: 0, color: "#ffffff", fontSize: "1.2em" }}>QR Code</h2>
            {qrUri && (
              <div
                style={{
                  padding: "15px",
                  background: "white",
                  display: "inline-block",
                  borderRadius: "8px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                <QRCodeSVG value={qrUri} size={180} />
              </div>
            )}
          </div>

          <div style={{ 
            display: "flex",
            gap: "15px"
          }}>
            {/* Current Token Section */}
            <div style={{ 
              flex: 1,
              backgroundColor: "#242424",
              padding: "15px",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
            }}>
              <h2 style={{ marginTop: 0, color: "#ffffff", fontSize: "1.2em" }}>Current Token</h2>
              <div
                style={{
                  position: "relative",
                  padding: "12px",
                  background: "#2d2d2d",
                  borderRadius: "4px",
                  textAlign: "center",
                  marginBottom: "8px",
                  border: "1px solid #333"
                }}
              >
                <div style={{ position: "relative" }}>
                  <code
                    style={{
                      fontSize: "18px",
                      display: "block",
                      marginBottom: "8px",
                      color: "#ffffff"
                    }}
                  >
                    {token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(token, "Token copied!")}
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "none",
                      background: "#0366d6",
                      color: "white",
                      cursor: "pointer",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0256b4"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0366d6"}
                  >
                    Copy
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: remainingSeconds <= 5 ? "#ff4444" : "#888",
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
                    height: "3px",
                    backgroundColor:
                      remainingSeconds <= 5 ? "#ff4444" : "#0366d6",
                    width: `${(remainingSeconds / period) * 100}%`,
                    transition: "width 1s linear, background-color 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Verify Token Section */}
            <div style={{ 
              flex: 1,
              backgroundColor: "#242424",
              padding: "15px",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
            }}>
              <h2 style={{ marginTop: 0, color: "#ffffff", fontSize: "1.2em" }}>Verify Token</h2>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Enter token to verify"
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #333",
                    background: "#2d2d2d",
                    color: "#ffffff"
                  }}
                />
                <button
                  onClick={handleVerify}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "none",
                    background: "#0366d6",
                    color: "white",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    whiteSpace: "nowrap"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0256b4"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0366d6"}
                >
                  Verify
                </button>
              </div>
              <div style={{ fontSize: "13px", color: "#888" }}>
                Remaining attempts: {remainingAttempts}
              </div>
              {isValid !== null && (
                <div
                  style={{
                    marginTop: "8px",
                    color: isValid ? "#4CAF50" : "#ff4444",
                    fontWeight: "bold",
                    fontSize: "13px"
                  }}
                >
                  {isValid ? "Token is valid!" : "Token is invalid!"}
                </div>
              )}
            </div>
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
          borderTop: "1px solid #333",
          backgroundColor: "#242424",
        }}
      >
        <p style={{ margin: 0, color: "#888" }}>
          Made with ❤️ by{" "}
          <a
            href="https://github.com/AashishSinghal"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0366d6", textDecoration: "none" }}
          >
            Aashish Singhal
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
