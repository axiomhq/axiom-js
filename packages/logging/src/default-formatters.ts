import { Formatter, LogEvent } from 'src/logger';
import { environment, getEnv, isNetlify, isVercel, region } from 'src/platform';
import { isEdgeRuntime } from 'src/runtime';

interface BasePlatform {
  environment?: string;
  region?: string;
  source?: string;
}

type VercelLogEvent = LogEvent & {
  vercel: {
    deploymentId?: string;
    deploymentUrl?: string;
    project?: string;
  } & BasePlatform;
  git: {
    commit?: string;
    repo?: string;
    ref?: string;
  };
};

type NetlifyLogEvent = LogEvent & {
  netlify: {
    siteId?: string;
    buildId?: string;
    context?: string;
    deploymentId?: string;
    deploymentUrl?: string;
  } & BasePlatform;
};

type GenericLogEvent = LogEvent & {
  platform: BasePlatform;
};

type PlatformLogEvent = VercelLogEvent | NetlifyLogEvent | GenericLogEvent;

export const injectPlatform: Formatter = (logEvent): PlatformLogEvent => {
  // logEvent.source = source; @TODO

  if (isVercel) {
    const vercelLogEvent = logEvent as VercelLogEvent;

    vercelLogEvent.vercel = {
      environment: getEnv('VERCEL_ENV') ?? environment,
      region: getEnv('VERCEL_REGION'),
      deploymentId: getEnv('VERCEL_DEPLOYMENT_ID'),
      deploymentUrl: getEnv('NEXT_PUBLIC_VERCEL_URL'),
      project: getEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL'),
      source: logEvent.source,
    };

    vercelLogEvent.git = {
      commit: getEnv('NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA'),
      repo: getEnv('NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG'),
      ref: getEnv('NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF'),
    };

    return vercelLogEvent;
  }

  if (isNetlify) {
    const netlifyLogEvent = logEvent as NetlifyLogEvent;
    netlifyLogEvent.netlify = {
      environment: environment,
      region: isEdgeRuntime ? getEnv('DENO_REGION') : getEnv('AWS_REGION'),
      siteId: getEnv('SITE_ID'),
      buildId: getEnv('BUILD_ID'),
      context: getEnv('CONTEXT'),
      deploymentUrl: getEnv('DEPLOYMENT_URL'),
      deploymentId: isEdgeRuntime ? getEnv('DENO_DEPLOYMENT_ID') : getEnv('NETLIFY_DEPLOYMENT_ID'),
      source: logEvent.source,
    };

    return netlifyLogEvent;
  }

  const genericLogEvent = logEvent as GenericLogEvent;
  genericLogEvent.platform = {
    environment: environment,
    region: region,
    source: logEvent.source,
  };

  return genericLogEvent;
};

export const defaultFormatters = [injectPlatform];
