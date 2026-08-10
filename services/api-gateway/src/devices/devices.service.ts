import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DeviceBinding } from '@app/shared';

@Injectable()
export class DevicesService {
  private devices: DeviceBinding[] = [];

  findByUser(userId: string): DeviceBinding | undefined {
    return this.devices.find((d) => d.userId === userId && d.isBound);
  }

  findById(deviceId: string): DeviceBinding | undefined {
    return this.devices.find((d) => d.id === deviceId);
  }

  bindDevice(
    userId: string,
    serial: string,
    name?: string,
    firmwareVersion?: string,
  ): DeviceBinding {
    const existing = this.devices.find(
      (d) => d.serial === serial && d.isBound,
    );
    if (existing && existing.userId !== userId) {
      throw new ConflictException('Device already bound to another account');
    }

    this.devices = this.devices.map((d) =>
      d.userId === userId ? { ...d, isBound: false, isConnected: false } : d,
    );

    const now = new Date().toISOString();
    const device: DeviceBinding = {
      id: uuidv4(),
      userId,
      serial,
      name: name || `TI Device ${serial.slice(-4)}`,
      firmwareVersion: firmwareVersion || 'unknown',
      isConnected: true,
      isBound: true,
      lastSeenAt: now,
      boundAt: now,
    };

    this.devices.push(device);
    return device;
  }

  unbindDevice(userId: string, deviceId: string): void {
    const device = this.findById(deviceId);
    if (!device || device.userId !== userId) {
      throw new NotFoundException('Device not found');
    }

    this.devices = this.devices.map((d) =>
      d.id === deviceId ? { ...d, isBound: false, isConnected: false } : d,
    );
  }

  getDeviceStatus(userId: string): DeviceBinding | null {
    return this.findByUser(userId) || null;
  }
}
