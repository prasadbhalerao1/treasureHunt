import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const Scanner = ({ onScan, onError }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // ID of the element
    const scannerId = "reader";

    // Clear any existing instance first
    try {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
          // Success callback
          // Optional: Stop scanning after success? User usually wants this.
          // html5QrcodeScanner.clear(); // We let the parent decide or the component unmount
          onScan(decodedText);
        },
        (errorMessage) => {
          // parse error, ignore commonly
          // console.warn(errorMessage);
          if (onError) onError(errorMessage);
        }
      );

      scannerRef.current = html5QrcodeScanner;
    } catch (e) {
      console.error("Scanner Init Error", e);
    }

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error("Failed to clear html5-qrcode scanner. ", error);
        });
      }
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* The library will render here. We give it full width. */}
      <div id="reader" className="w-full bg-black"></div>
      <p className="text-white text-xs text-center mt-2 px-4">
        If camera doesn't open: 1. Ensure you are on HTTPS (or localhost). 2.
        Check browser permissions.
      </p>
    </div>
  );
};

export default Scanner;
