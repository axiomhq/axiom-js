import { Formatter, LogEvent } from 'src/logger';
import { environment, isNetlify, isVercel, region } from 'src/platform';
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
      environment: process.env.VERCEL_ENV ?? environment,
      region: process.env.VERCEL_REGION,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
      deploymentUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
      project: process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
      source: logEvent.source,
    };

    vercelLogEvent.git = {
      commit: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      repo: process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG,
      ref: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF,
    };

    return vercelLogEvent;
  }

  if (isNetlify) {
    const netlifyLogEvent = logEvent as NetlifyLogEvent;
    netlifyLogEvent.netlify = {
      environment: environment,
      region: isEdgeRuntime ? process.env.DENO_REGION : process.env.AWS_REGION,
      siteId: process.env.SITE_ID,
      buildId: process.env.BUILD_ID,
      context: process.env.CONTEXT,
      deploymentUrl: process.env.DEPLOYMENT_URL,
      deploymentId: isEdgeRuntime ? process.env.DENO_DEPLOYMENT_ID : process.env.NETLIFY_DEPLOYMENT_ID,
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
