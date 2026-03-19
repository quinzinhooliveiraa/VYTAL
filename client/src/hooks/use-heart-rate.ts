import { useState, useRef, useCallback } from "react";

export type HRStatus = "idle" | "connecting" | "connected" | "unsupported" | "error" | "disconnected";

export function useHeartRate() {
  const isSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  const [status, setStatus] = useState<HRStatus>(isSupported ? "idle" : "unsupported");
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [maxBpm, setMaxBpm] = useState<number>(0);
  const [deviceName, setDeviceName] = useState<string>("");

  const bpmSamplesRef = useRef<number[]>([]);
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const handleHRMeasurement = useCallback((event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value) return;
    const flags = value.getUint8(0);
    const is16bit = flags & 0x1;
    const bpm = is16bit ? value.getUint16(1, true) : value.getUint8(1);
    if (bpm > 20 && bpm < 250) {
      setCurrentBpm(bpm);
      setMaxBpm(prev => Math.max(prev, bpm));
      bpmSamplesRef.current.push(bpm);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isSupported) { setStatus("unsupported"); return; }
    try {
      setStatus("connecting");
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }],
        optionalServices: ["heart_rate"],
      });
      deviceRef.current = device;
      setDeviceName(device.name || "Monitor de FC");

      device.addEventListener("gattserverdisconnected", () => {
        setStatus("disconnected");
        setCurrentBpm(null);
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic("heart_rate_measurement");
      charRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", handleHRMeasurement);

      setStatus("connected");
    } catch (err: any) {
      if (err.name === "NotFoundError" || err.name === "AbortError") {
        setStatus("idle");
      } else {
        setStatus("error");
      }
    }
  }, [isSupported, handleHRMeasurement]);

  const disconnect = useCallback(async () => {
    try {
      if (charRef.current) {
        charRef.current.removeEventListener("characteristicvaluechanged", handleHRMeasurement);
        await charRef.current.stopNotifications().catch(() => {});
      }
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
    } catch {}
    setStatus("idle");
    setCurrentBpm(null);
  }, [handleHRMeasurement]);

  const getAvgBpm = useCallback(() => {
    const samples = bpmSamplesRef.current;
    if (samples.length === 0) return null;
    return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  }, []);

  const reset = useCallback(() => {
    bpmSamplesRef.current = [];
    setCurrentBpm(null);
    setMaxBpm(0);
  }, []);

  return {
    status,
    currentBpm,
    maxBpm: maxBpm > 0 ? maxBpm : null,
    deviceName,
    getAvgBpm,
    connect,
    disconnect,
    reset,
  };
}
