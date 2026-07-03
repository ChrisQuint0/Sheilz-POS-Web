import { UAParser } from "ua-parser-js";

/**
 * Formats a raw IP address for display.
 * Maps IPv6 loopback to "Localhost".
 */
export function formatIpAddress(ip: string | null | undefined): string {
  if (!ip) return "-";
  if (ip === "::1" || ip === "127.0.0.1") return "Localhost";
  return ip;
}

/**
 * Parses a raw user-agent string and returns a human-readable device/browser string.
 * Example: "Chrome on Windows" or "Safari on iOS"
 */
export function formatDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return "-";
  
  try {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    
    const browserName = browser.name || "Unknown Browser";
    const osName = os.name || "Unknown OS";
    
    if (browserName === "Unknown Browser" && osName === "Unknown OS") {
      // If parsing fails entirely, return the raw string truncated
      return userAgent.length > 30 ? userAgent.substring(0, 30) + "..." : userAgent;
    }
    
    return `${browserName} on ${osName}`;
  } catch (error) {
    return "-";
  }
}
