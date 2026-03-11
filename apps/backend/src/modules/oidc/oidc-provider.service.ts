import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { OidcClientFactory } from './oidc-client.factory';
import {
  CreateOidcProviderDto,
  UpdateOidcProviderDto,
  OidcProviderResponseDto,
  OidcProviderPublicDto,
} from './dto/oidc-provider.dto';
import type { OidcProvider } from '@prisma/client';

@Injectable()
export class OidcProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly oidcClientFactory: OidcClientFactory,
  ) {}

  async findAll(): Promise<OidcProviderResponseDto[]> {
    const providers = await this.prisma.oidcProvider.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return providers.map((p) => this.toResponseDto(p));
  }

  async findBySlugAsDto(slug: string): Promise<OidcProviderResponseDto> {
    const provider = await this.findBySlug(slug);
    return this.toResponseDto(provider);
  }

  async findBySlug(slug: string): Promise<OidcProvider> {
    const provider = await this.prisma.oidcProvider.findUnique({
      where: { slug },
    });
    if (!provider) {
      throw new NotFoundException(`OIDC provider "${slug}" not found`);
    }
    return provider;
  }

  async findActiveProviders(): Promise<OidcProviderPublicDto[]> {
    const providers = await this.prisma.oidcProvider.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { slug: true, name: true },
    });
    return providers;
  }

  async create(
    dto: CreateOidcProviderDto,
    adminId: string,
  ): Promise<OidcProviderResponseDto> {
    // Check slug uniqueness
    const existing = await this.prisma.oidcProvider.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already in use`);
    }

    const provider = await this.prisma.oidcProvider.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        discoveryUrl: dto.discoveryUrl,
        clientId: dto.clientId,
        clientSecret: dto.clientSecret,
        scopes: dto.scopes ?? 'openid email profile',
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditLogService.create({
      userId: adminId,
      action: 'OIDC_PROVIDER_CREATED',
      entityType: 'oidc_provider',
      entityId: provider.id,
      newValue: { name: provider.name, slug: provider.slug },
    });

    return this.toResponseDto(provider);
  }

  async update(
    slug: string,
    dto: UpdateOidcProviderDto,
    adminId: string,
  ): Promise<OidcProviderResponseDto> {
    const provider = await this.findBySlug(slug);

    const updated = await this.prisma.oidcProvider.update({
      where: { id: provider.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.discoveryUrl !== undefined && {
          discoveryUrl: dto.discoveryUrl,
        }),
        ...(dto.clientId !== undefined && { clientId: dto.clientId }),
        ...(dto.clientSecret !== undefined && {
          clientSecret: dto.clientSecret,
        }),
        ...(dto.scopes !== undefined && { scopes: dto.scopes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    // Invalidate cached client if config changed
    this.oidcClientFactory.invalidateClient(slug);

    await this.auditLogService.create({
      userId: adminId,
      action: 'OIDC_PROVIDER_UPDATED',
      entityType: 'oidc_provider',
      entityId: provider.id,
      oldValue: { name: provider.name, slug: provider.slug },
      newValue: { name: updated.name, slug: updated.slug },
    });

    return this.toResponseDto(updated);
  }

  async delete(slug: string, adminId: string): Promise<void> {
    const provider = await this.findBySlug(slug);

    await this.prisma.oidcProvider.delete({
      where: { id: provider.id },
    });

    this.oidcClientFactory.invalidateClient(slug);

    await this.auditLogService.create({
      userId: adminId,
      action: 'OIDC_PROVIDER_DELETED',
      entityType: 'oidc_provider',
      entityId: provider.id,
      oldValue: { name: provider.name, slug: provider.slug },
    });
  }

  private toResponseDto(provider: OidcProvider): OidcProviderResponseDto {
    return {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      isActive: provider.isActive,
      discoveryUrl: provider.discoveryUrl,
      clientId: provider.clientId,
      hasClientSecret: !!provider.clientSecret,
      scopes: provider.scopes,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}
