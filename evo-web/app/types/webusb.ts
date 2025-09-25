interface USBConfiguration {
  configurationValue: number;
  interfaces: USBInterface[];
}

interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
  alternates: USBAlternateInterface[];
  claimed: boolean;
}

interface USBAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  endpoints: USBEndpoint[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
  type: "bulk" | "interrupt" | "isochronous";
  packetSize: number;
}

declare interface USBDevice {
  productName: string;
  manufacturerName: string;
  serialNumber: string;
  vendorId: number;
  productId: number;
  configurations: USBConfiguration[];
  configuration?: USBConfiguration;
  opened: boolean;
  interfaces: USBInterface[];
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  selectAlternateInterface(
    interfaceNumber: number,
    alternateSetting: number
  ): Promise<void>;
  reset(): Promise<void>;
}

declare interface USBConnectionEvent extends Event {
  device: USBDevice;
}

declare interface Navigator {
  usb: {
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options: {
      filters: Array<{
        vendorId?: number;
        productId?: number;
        classCode?: number;
        subclassCode?: number;
        protocolCode?: number;
        serialNumber?: string;
      }>;
    }): Promise<USBDevice>;
    addEventListener(
      type: "connect",
      listener: (event: USBConnectionEvent) => void
    ): void;
    addEventListener(
      type: "disconnect",
      listener: (event: USBConnectionEvent) => void
    ): void;
    removeEventListener(
      type: "connect",
      listener: (event: USBConnectionEvent) => void
    ): void;
    removeEventListener(
      type: "disconnect",
      listener: (event: USBConnectionEvent) => void
    ): void;
  };
}
