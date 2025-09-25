import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect, useState } from "react";

import type { Route } from "./+types/root";
import "./types/webusb";  // Import WebUSB type declarations
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export default function App() {
  const [device, setDevice] = useState<USBDevice | null>(null);
  const [isWebUSBSupported, setIsWebUSBSupported] = useState(false);

  const connectDevice = async () => {
    try {
      console.log('Requesting USB device...');
      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x2708 }]
      });

      console.log('Device selected:', device);

      try {
        // Make sure device is closed first
        if (device.opened) {
          await device.close();
        }

        // Open device
        await device.open();
        console.log('Device opened');

        // Select configuration
        if (!device.configuration || device.configuration.configurationValue !== 1) {
          await device.selectConfiguration(1);
          console.log('Configuration selected');
        }

        // Try to claim the audio control interface
        await device.claimInterface(0);
        console.log('Interface claimed');

        setDevice(device);
        console.log('Device connected and ready');
      } catch (err) {
        console.error('Error during device initialization:', err);
        if (device.opened) {
          await device.close();
        }
        throw err;
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  useEffect(() => {
    // We need to wait for the document to be ready
    if (typeof window !== 'undefined' && document.readyState === 'complete') {
      // Check if WebUSB is supported in the browser
      if ('usb' in navigator) {
        console.log('WebUSB is supported');
        setIsWebUSBSupported(true);

        // Set up device connection listeners
        const handleConnect = (event: USBConnectionEvent) => {
          console.log('Device connected:', event.device);
          setDevice(event.device);
        };

        const handleDisconnect = (event: USBConnectionEvent) => {
          console.log('Device disconnected:', event.device);
          if (device === event.device) {
            setDevice(null);
          }
        };

        // Add event listeners
        navigator.usb.addEventListener('connect', handleConnect);
        navigator.usb.addEventListener('disconnect', handleDisconnect);

        // Check for already connected devices
        navigator.usb.getDevices()
          .then(devices => {
            if (devices.length > 0) {
              console.log('Found previously authorized device');
              setDevice(devices[0]);
            }
          })
          .catch(error => console.error('Error getting devices:', error));

        // Cleanup function
        return () => {
          navigator.usb.removeEventListener('connect', handleConnect);
          navigator.usb.removeEventListener('disconnect', handleDisconnect);
        };
      } else {
        console.log('WebUSB is not supported in this browser');
        setIsWebUSBSupported(false);
      }
    } else {
      // Wait for the document to be ready
      const handleReady = () => {
        if ('usb' in navigator) {
          console.log('WebUSB is supported (after document ready)');
          setIsWebUSBSupported(true);
        } else {
          console.log('WebUSB is not supported (after document ready)');
          setIsWebUSBSupported(false);
        }
      };

      window.addEventListener('load', handleReady);
      return () => window.removeEventListener('load', handleReady);
    }

    // Cleanup listeners on unmount
    return () => {
      if (device) {
        device.close().catch(console.error);
      }
    };
  }, [device]);

  return (
    <div>
      {!isWebUSBSupported ? (
        <div style={{ padding: '20px', color: 'red' }}>
          WebUSB is not supported in this browser. Please use Chrome or Edge.
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <button
            onClick={connectDevice}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {device ? 'Reconnect Device' : 'Connect to EVO'}
          </button>
          {device && (
            <div style={{ marginTop: '10px' }}>
              Connected to: {device.productName}
            </div>
          )}
        </div>
      )}
      <Outlet />
    </div>
  );
}
