import { afterEach, describe, expect, it, vi } from "vitest";
import { canListenToGyro, gyroAccess, onGyroGranted, requestGyro, resetGyroAccess } from "./gyro-permission";

const g = globalThis as unknown as { DeviceOrientationEvent?: unknown };
const original = g.DeviceOrientationEvent;

function fakeDOE(requestPermission?: () => Promise<string>) {
  g.DeviceOrientationEvent = Object.assign(function DeviceOrientationEvent() {}, requestPermission ? { requestPermission } : {});
}

afterEach(() => {
  g.DeviceOrientationEvent = original;
  resetGyroAccess();
});

describe("gyro permission", () => {
  it("Android: free, no prompt", async () => {
    fakeDOE();
    expect(gyroAccess()).toBe("free");
    expect(canListenToGyro()).toBe(true);
    expect(await requestGyro()).toBe(true);
  });

  it("no DeviceOrientationEvent: none", async () => {
    delete g.DeviceOrientationEvent;
    expect(gyroAccess()).toBe("none");
    expect(await requestGyro()).toBe(false);
  });

  it("iOS: asks once, then every waiting card starts", async () => {
    const ask = vi.fn(() => Promise.resolve("granted"));
    fakeDOE(ask);
    expect(gyroAccess()).toBe("ask");
    expect(canListenToGyro()).toBe(false);
    const a = vi.fn();
    const b = vi.fn();
    onGyroGranted(a);
    const stopB = onGyroGranted(b);
    stopB();
    const [r1, r2] = await Promise.all([requestGyro(), requestGyro()]);
    expect(r1 && r2).toBe(true);
    expect(ask).toHaveBeenCalledTimes(1);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    expect(gyroAccess()).toBe("granted");
    expect(canListenToGyro()).toBe(true);
  });

  it("iOS: denied or failed prompt keeps scroll-only tilt", async () => {
    fakeDOE(() => Promise.reject(new Error("not a gesture")));
    expect(await requestGyro()).toBe(false);
    expect(gyroAccess()).toBe("denied");
    expect(canListenToGyro()).toBe(false);
  });
});
