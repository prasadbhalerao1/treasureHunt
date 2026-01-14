```javascript
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui";

const Scanner = ({ onScan, onError }) => {
  const [permError, setPermError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    // 1. Check for Secure Context (HTTPS)
    if (
      window.location.hostname !== "localhost" && 
      window.location.protocol !== "https:"
    ) {
      setPermError("Camera access requires HTTPS. Please access via the secure Vercel link.");
      return;
    }

    const scannerId = "reader";
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Prefer back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success
            // Stop scanning correctly to free resources
            html5QrCode.stop().then(() => {
                html5QrCode.clear();
                setIsScanning(false);
                onScan(decodedText);
            }).catch(err => console.error("Failed to stop", err));
          },
          (errorMessage) => {
            // Parse error, ignore to avoid spamming console
          }
        );
      } catch (err) {
        console.error("Scanner Start Error", err);
        setPermError("Camera failed to start. " + (err.message || err));
        if (onError) onError(err);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
         if(scannerRef.current.isScanning) {
             scannerRef.current.stop().then(() => {
                 scannerRef.current.clear();
             }).catch(err => console.warn("Cleanup error", err));
         } else {
             scannerRef.current.clear();
         }
      }
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto relative bg-black min-h-[300px] border-4 border-black">
        {permError ? (
            <div className="bg-red-500 text-white p-6 text-center font-bold h-full flex flex-col justify-center items-center">
                <h3 className="text-xl mb-2 uppercase">Camera Error</h3>
                <p>{permError}</p>
                <Button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 border-0">
                    Retry
                </Button>
            </div>
        ) : (
            <>
                <div id="reader" className="w-full h-full"></div> 
                {isScanning && (
                    <p className="absolute bottom-2 left-0 right-0 text-white text-xs text-center px-4 opacity-75 pointer-events-none">
                        Align QR Code within the frame
                    </p>
                )}
            </>
        )}
    </div>
  );
};

export default Scanner;
```;
