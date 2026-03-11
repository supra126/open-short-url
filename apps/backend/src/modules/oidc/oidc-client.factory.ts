import { Injectable, Logger } from '@nestjs/common';
import type { OidcProvider } from '@prisma/client';

// openid-client v6 is ESM, use dynamic import
let openidClientModule: typeof import('openid-client') | null = null;

async function getOpenidClient() {
  if (!openidClientModule) {
    openidClientModule = await import('openid-client');
  }
  return openidClientModule;
}

export { getOpenidClient };

export interface OidcClientHandle {
  config: Awaited<ReturnType<typeof import('openid-client').discovery>>;
}

@Injectable()
export class OidcClientFactory {
  private readonly logger = new Logger(OidcClientFactory.name);
  private readonly clients = new Map<string, OidcClientHandle>();
  private readonly pendingDiscoveries = new Map<string, Promise<OidcClientHandle>>();

  async getClient(provider: OidcProvider): Promise<OidcClientHandle> {
    const cached = this.clients.get(provider.slug);
    if (cached) return cached;

    // Prevent duplicate concurrent discoveries
    const pending = this.pendingDiscoveries.get(provider.slug);
    if (pending) return pending;

    const discoveryPromise = this.discover(provider).finally(() => {
      this.pendingDiscoveries.delete(provider.slug);
    });
    this.pendingDiscoveries.set(provider.slug, discoveryPromise);

    return discoveryPromise;
  }

  private async discover(provider: OidcProvider): Promise<OidcClientHandle> {
    this.logger.log(
      `Discovering OIDC configuration for provider: ${provider.slug}`,
    );

    const oidc = await getOpenidClient();

    try {
      const isHttp = provider.discoveryUrl.startsWith('http://');
      const config = await oidc.discovery(
        new URL(provider.discoveryUrl),
        provider.clientId,
        provider.clientSecret,
        undefined,
        isHttp ? { execute: [oidc.allowInsecureRequests] } : undefined,
      );

      const handle: OidcClientHandle = { config };
      this.clients.set(provider.slug, handle);

      return handle;
    } catch (error) {
      this.logger.error(
        `OIDC discovery failed for provider "${provider.slug}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `Failed to connect to identity provider "${provider.name}"`,
      );
    }
  }

  invalidateClient(slug: string): void {
    this.clients.delete(slug);
    this.pendingDiscoveries.delete(slug);
  }
}
