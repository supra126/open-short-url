import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { IStorageProvider } from './interfaces/storage-provider.interface';
import { S3StorageProvider } from './providers/s3-storage.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: (configService: ConfigService): IStorageProvider => {
        const provider = configService.get<string>('STORAGE_PROVIDER', 's3');

        switch (provider.toLowerCase()) {
          case 's3':
            return new S3StorageProvider(configService);
          default:
            throw new Error(`Unknown storage provider: ${provider}`);
        }
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule implements OnModuleInit {
  constructor(
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageProvider
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.storageProvider.onModuleInit) {
      await this.storageProvider.onModuleInit();
    }
  }
}
