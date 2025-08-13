import { client, v2 } from "@datadog/datadog-api-client";
import { isLocalRun } from "../utils/config.js";
import { getAppSecrets } from "./secrets.service.js";

const datadogMetricsClient = (async () => {
  const appSecrets = await getAppSecrets();
  return new v2.MetricsApi(
    client.createConfiguration({
      authMethods: {
        apiKeyAuth: appSecrets.datadogApiKey,
        appKeyAuth: appSecrets.datadogAppKey,
      },
    }),
  );
})();

export const queryTimeseriesData = async (
  formulas: {
    metric: string;
    aggregator: "sum" | "avg";
    tagFilters: Record<string, string>;
    by: string[] | null;
  }[],
  fromMillis: number,
  toMillis: number,
): Promise<v2.TimeseriesResponse> => {
  const request: v2.MetricsApiQueryTimeseriesDataRequest = {
    body: {
      data: {
        type: "timeseries_request",
        attributes: {
          from: fromMillis,
          to: toMillis,
          interval: 60 * 60 * 24 * 1000, // 1 day
          formulas: formulas.map(({ metric, aggregator, tagFilters, by }) => ({
            formula: `${aggregator}:${metric}{${
              isLocalRun
                ? "*"
                : Object.entries(tagFilters)
                    .map(([k, v]) => `${k}:"${v}"`)
                    .join(" AND ")
            }} ${by ? `by {${by.join(",")}}` : ""}`,
          })),
          queries: [],
        },
      },
    },
  };
  const res = await (await datadogMetricsClient).queryTimeseriesData(request);
  if (!res.data) {
    throw new Error(`Datadog API request failed: ${JSON.stringify(res)}`);
  }
  return res.data;
};
