import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service.js';

@Injectable()
export class IdentityService {
  constructor(private readonly database: DatabaseService) {}

  async findUserById(userId: string) {
    return this.database.client.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        identities: true,
      },
    });
  }
}
