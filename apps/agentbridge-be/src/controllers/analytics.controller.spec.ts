import { v2 } from "@datadog/datadog-api-client";
import { Request, Response } from "express";
import { Logger } from "winston";
import { queryTimeseriesData } from "../services/datadog.service.js";
import { Database } from "../utils/connection.js";
import { TypeGuardError } from "../utils/req-guards.js";
import { getServerAnalytics, getToolAnalytics } from "./analytics.controller.js";

jest.mock("../services/datadog.service.js", () => ({
  queryTimeseriesData: jest.fn(),
}));

const EPSILON = 0.00001;

describe("Analytics Controller", () => {
  let mockRequest: Request<
    { serverId: string; toolId: string | undefined },
    object,
    object,
    { from: string; to: string }
  > & { logger: Logger; db: Database };
  let mockResponse: Partial<Response>;
  let mockTimeseriesResponse: v2.TimeseriesResponse;

  beforeEach(() => {
    mockRequest = {
      params: {
        serverId: "test-server-id",
        toolId: "test-tool-id",
      },
      query: {
        from: "2025-05-10T00:00:00.000Z",
        to: "2025-05-11T00:00:00.000Z",
      },
      logger: {
        debug: jest.fn(),
        error: jest.fn(),
      } as unknown as Logger,
      db: {} as Database,
    } as unknown as typeof mockRequest;

    mockResponse = {
      json: jest.fn(),
    };

    mockTimeseriesResponse = {
      type: "timeseries_response",
      attributes: {
        series: [
          {
            groupTags: ["failed:false"],
            queryIndex: 0,
          },
          {
            groupTags: ["failed:true"],
            queryIndex: 0,
          },
          {
            groupTags: [],
            queryIndex: 1,
          },
        ],
        times: [1746921600000],
        values: [[5], [16], [115.047619]],
      },
    };

    (queryTimeseriesData as jest.Mock).mockResolvedValue(mockTimeseriesResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getServerAnalytics", () => {
    it("should throw TypeGuardError if request is not an AppRequest", async () => {
      const invalidRequest = {} as Request;

      await expect(
        getServerAnalytics(
          invalidRequest as Request<{ serverId: string }, object, object, { from: string; to: string }>,
          mockResponse as Response,
        ),
      ).rejects.toThrow(TypeGuardError);
    });

    it("should fetch and return server analytics", async () => {
      await getServerAnalytics(mockRequest, mockResponse as Response);

      expect(queryTimeseriesData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            metric: "agentbridge.tool.execution.count",
            tagFilters: { serverid: "test-server-id" },
          }),
          expect.objectContaining({
            metric: "agentbridge.tool.execution.duration",
            tagFilters: { serverid: "test-server-id" },
          }),
        ]),
        expect.any(Number),
        expect.any(Number),
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: expect.objectContaining({
            requests: 21,
            successCount: 5,
            failureCount: 16,
            avgResponseTime: expect.closeTo(115.04761, EPSILON),
          }),
          timeSeriesData: [
            expect.objectContaining({
              requests: 21,
              successCount: 5,
              failureCount: 16,
              avgResponseTime: expect.closeTo(115.04761, EPSILON),
              date: expect.any(String),
            }),
          ],
        }),
      );
    });

    it("should use default timeframe if not provided", async () => {
      mockRequest.query = { from: "", to: "" };

      await getServerAnalytics(
        mockRequest as Request<{ serverId: string }, object, object, { from: string; to: string }>,
        mockResponse as Response,
      );

      expect(queryTimeseriesData).toHaveBeenCalledWith(expect.any(Array), expect.any(Number), expect.any(Number));

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe("getToolAnalytics", () => {
    it("should throw TypeGuardError if request is not an AppRequest", async () => {
      const invalidRequest = {} as Request;

      await expect(
        getToolAnalytics(
          invalidRequest as Request<{ serverId: string; toolId: string }, object, object, { from: string; to: string }>,
          mockResponse as Response,
        ),
      ).rejects.toThrow(TypeGuardError);
    });

    it("should fetch and return tool analytics", async () => {
      await getToolAnalytics(
        mockRequest as Request<{ serverId: string; toolId: string }, object, object, { from: string; to: string }>,
        mockResponse as Response,
      );

      expect(queryTimeseriesData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            metric: "agentbridge.tool.execution.count",
            tagFilters: {
              serverid: "test-server-id",
              toolid: "test-tool-id",
            },
          }),
          expect.objectContaining({
            metric: "agentbridge.tool.execution.duration",
            tagFilters: {
              serverid: "test-server-id",
              toolid: "test-tool-id",
            },
          }),
        ]),
        expect.any(Number),
        expect.any(Number),
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: expect.objectContaining({
            requests: 21,
            successCount: 5,
            failureCount: 16,
            avgResponseTime: expect.closeTo(115.04761, EPSILON),
          }),
          timeSeriesData: [
            expect.objectContaining({
              requests: 21,
              successCount: 5,
              failureCount: 16,
              avgResponseTime: expect.closeTo(115.04761, EPSILON),
              date: expect.any(String),
            }),
          ],
        }),
      );
    });
  });
});
