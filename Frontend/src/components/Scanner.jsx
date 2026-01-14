import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const Scanner = ({ onScan, onError }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // ID of the element
    const scannerId = "reader";

    const scanner = new Html5QrcodeScanner(
      scannerId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText, decodedResult) => {
        // Success callback
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // Error callback
        if (onError) onError(errorMessage);
      }
    );

    scannerRef.current = scanner;

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
    <div
      id="reader"
      className="w-[300px] h-[300px] mx-auto bg-black border-2 border-white"
    ></div>
  );
};

export default Scanner;
