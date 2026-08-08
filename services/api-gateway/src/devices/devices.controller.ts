import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DevicesService } from './devices.service';
import { BindDeviceDto } from './devices.dto';
import { DeviceResponse } from '@app/shared';

function toDeviceResponse(device: any): DeviceResponse {
  return {
    id: device.id,
    serial: device.serial,
    name: device.name,
    firmwareVersion: device.firmwareVersion,
    isConnected: device.isConnected,
    isBound: device.isBound,
    lastSeenAt: device.lastSeenAt,
  };
}

@Controller('devices')
@UseGuards(AuthGuard('jwt'))
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('bind')
  bind(
    @Request() req: { user: { userId: string } },
    @Body() dto: BindDeviceDto,
  ): DeviceResponse {
    const device = this.devicesService.bindDevice(
      req.user.userId,
      dto.serial,
      dto.name,
      dto.firmwareVersion,
    );
    return toDeviceResponse(device);
  }

  @Get('status')
  status(@Request() req: { user: { userId: string } }): DeviceResponse | null {
    const device = this.devicesService.getDeviceStatus(req.user.userId);
    return device ? toDeviceResponse(device) : null;
  }

  @Delete(':id')
  unbind(
    @Request() req: { user: { userId: string } },
    @Param('id') deviceId: string,
  ): { success: boolean } {
    this.devicesService.unbindDevice(req.user.userId, deviceId);
    return { success: true };
  }
}
