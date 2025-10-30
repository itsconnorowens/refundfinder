import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(
  err: Error,
  request: {
    path: string;
    method: string;
    headers: globalThis.Headers;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
  }
) {
  Sentry.captureException(err, (scope) => {
    scope.setContext('request', {
      path: request.path,
      method: request.method,
    });
    scope.setContext('router', {
      kind: context.routerKind,
      path: context.routePath,
      type: context.routeType,
    });
    return scope;
  });
}
