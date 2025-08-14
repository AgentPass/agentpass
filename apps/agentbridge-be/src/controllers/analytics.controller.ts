import { type AnalyticsDataPoint, TimeSeriesData } from "@agentbridge/api";
import { v2 } from "@datadog/datadog-api-client";
import { Request, Response } from "express";
import { Logger } from "winston";
import { queryTimeseriesData } from "../services/datadog.service.js";
import { isAppRequest, TypeGuardError } from "../utils/req-guards.js";

const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;

const METRICS = {
  EXECUTION_COUNT: "agentbridge.tool.execution.count",
  EXECUTION_DURATION: "agentbridge.tool.execution.duration",
};

const TAGS = {
  TOOL_ID: "toolid",
  SERVER_ID: "serverid",
  FAILED: "failed",
};

type Analytics = {
  total: AnalyticsDataPoint;
  timeSeriesData: TimeSeriesData[];
};

const seriesValue = (
  timeseriesResponse: v2.TimeseriesResponse,
  seriesIndex: number | null,
  pointIndex: number,
): number =>
  seriesIndex !== null ? ((timeseriesResponse.attributes?.values?.[seriesIndex][pointIndex] || 0) as number) : 0;

const aggregateResults = (seriesResponse: v2.TimeseriesResponse): Analytics => {
  const analytics: Analytics = {
    total: {
      requests: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0,
    },
    timeSeriesData: [],
  };

  let successCountIndex: number | null = null,
    failureCountIndex: number | null = null,
    durationIndex: number | null = null;

  seriesResponse.attributes?.series?.forEach((series, index) => {
    const isCounter = series.queryIndex === 0;
    if (isCounter) {
      const isSuccess = series.groupTags?.includes(`${TAGS.FAILED}:false`);
      if (isSuccess) {
        successCountIndex = index;
      } else {
        failureCountIndex = index;
      }
    } else {
      durationIndex = index;
    }
  });

  seriesResponse.attributes?.times?.forEach((ts, index) => {
    const successValue = seriesValue(seriesResponse, successCountIndex, index);
    const failureValue = seriesValue(seriesResponse, failureCountIndex, index);
    const durationValue = seriesValue(seriesResponse, durationIndex, index);
    analytics.timeSeriesData.push({
      avgResponseTime: durationValue,
      failureCount: failureValue,
      requests: failureValue + successValue,
      successCount: successValue,
      date: new Date(ts).toISOString(),
    });
    analytics.total.requests += successValue + failureValue;
    analytics.total.successCount += successValue;
    analytics.total.failureCount += failureValue;
    analytics.total.avgResponseTime += durationValue * (successValue + failureValue);
  });

  analytics.total.avgResponseTime =
    analytics.total.requests > 0 ? analytics.total.avgResponseTime / analytics.total.requests : 0;

  return analytics;
};

async function fetchMetrics(
  logger: Logger,
  serverId: string,
  toolId: string | null,
  fromTime: number, // epoch time in milliseconds
  toTime: number, // epoch time in milliseconds
): Promise<Analytics> {
  try {
    const tagFilters: Record<string, string> = {
      [TAGS.SERVER_ID]: serverId,
      ...(toolId ? { [TAGS.TOOL_ID]: toolId } : {}),
    };
    const timeSeriesResponse = await queryTimeseriesData(
      [
        {
          metric: METRICS.EXECUTION_COUNT,
          aggregator: "sum",
          tagFilters,
          by: [TAGS.FAILED],
        },
        {
          metric: METRICS.EXECUTION_DURATION,
          aggregator: "avg",
          tagFilters,
          by: null,
        },
      ],
      fromTime,
      toTime,
    );
    return aggregateResults(timeSeriesResponse);
  } catch (error) {
    logger.error("Error fetching metrics from Datadog", error);
  }
  return {
    total: {
      requests: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0,
    },
    timeSeriesData: [],
  };
}

const getTimeFrame = (req: Request<unknown, object, object, { from: string; to: string }>) => {
  const fromTime = req.query.from ? new Date(req.query.from).getTime() : Date.now() - 30 * ONE_DAY_IN_MS;
  const toTime = req.query.to ? new Date(req.query.to).getTime() : Date.now();
  return { fromTime, toTime };
};

export const getServerAnalytics = async (
  req: Request<{ serverId: string }, object, object, { from: string; to: string }>,
  res: Response,
) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.debug("Getting server analytics", {
    serverId: req.params.serverId,
    timeRange: `${req.query.from}-${req.query.to}`,
  });

  const { fromTime, toTime } = getTimeFrame(req);
  const analytics = await fetchMetrics(req.logger, req.params.serverId, null, fromTime, toTime);
  res.json(analytics);
};

export const getToolAnalytics = async (
  req: Request<{ serverId: string; toolId: string }, object, object, { from: string; to: string }>,
  res: Response,
) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Getting tool analytics", {
    serverId: req.params.serverId,
    toolId: req.params.toolId,
    timeRange: `${req.query.from}-${req.query.to}`,
  });

  const { fromTime, toTime } = getTimeFrame(req);
  const analytics = await fetchMetrics(req.logger, req.params.serverId, req.params.toolId, fromTime, toTime);
  res.json(analytics);
};
