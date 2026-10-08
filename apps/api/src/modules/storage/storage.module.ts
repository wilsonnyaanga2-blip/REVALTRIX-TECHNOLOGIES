import { Global, Module } from '@nestjs/common';
import { PrivateObjectStorageService } from './private-object-storage.service.js';

@Global()
@Module({
  providers: [PrivateObjectStorageService],
  exports: [PrivateObjectStorageService],
})
export class StorageModule {}
