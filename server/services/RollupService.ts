/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import _ from "lodash";
import {
  ILegacyCustomClusterClient,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  IOpenSearchDashboardsResponse,
  ResponseError,
  RequestHandlerContext,
} from "opensearch-dashboards/server";
import { DeleteRollupParams, DeleteRollupResponse, GetRollupsResponse, PutRollupParams, PutRollupResponse } from "../models/interfaces";
import { ServerResponse } from "../models/types";
import { DocumentRollup, Rollup } from "../../models/interfaces";

export default class RollupService {
  osDriver: ILegacyCustomClusterClient;

  constructor(osDriver: ILegacyCustomClusterClient) {
    this.osDriver = osDriver;
  }

  /**
   * Calls backend Put Rollup API
   */
  putRollup = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<PutRollupResponse> | ResponseError>> => {
    try {
      const { id } = request.params as { id: string };
      const { seqNo, primaryTerm } = request.query as { seqNo?: string; primaryTerm?: string };
      let method = "ism.putRollup";
      let params: PutRollupParams = {
        rollupId: id,
        if_seq_no: seqNo,
        if_primary_term: primaryTerm,
        body: JSON.stringify(request.body),
      };
      if (seqNo === undefined || primaryTerm === undefined) {
        method = "ism.createRollup";
        params = { rollupId: id, body: JSON.stringify(request.body) };
      }
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const putRollupResponse: PutRollupResponse = await callWithRequest(method, params);
      return response.custom({
        statusCode: 200,
        body: {
          ok: true,
          response: putRollupResponse,
        },
      });
    } catch (err) {
      console.error("Index Management - RollupService - putRollup", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };

  /**
   * Calls backend Delete Rollup API
   */
  deleteRollup = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<boolean> | ResponseError>> => {
    try {
      const { id } = request.params as { id: string };
      const params: DeleteRollupParams = { rollupId: id };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const deleteRollupResponse: DeleteRollupResponse = await callWithRequest("ism.deleteRollup", params);
      if (deleteRollupResponse.result !== "deleted") {
        return response.custom({
          statusCode: 200,
          body: {
            ok: false,
            error: deleteRollupResponse.result,
          },
        });
      }
      return response.custom({
        statusCode: 200,
        body: {
          ok: true,
          response: true,
        },
      });
    } catch (err) {
      console.error("Index Management - RollupService - deleteRollup:", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };

  startRollup = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<boolean>>> => {
    try {
      const { id } = request.params as { id: string };
      const params = { rollupId: id };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const startResponse = await callWithRequest("ism.startRollup", params);
      const acknowledged = _.get(startResponse, "acknowledged");
      if (acknowledged) {
        return response.custom({
          statusCode: 200,
          body: { ok: true, response: true },
        });
      } else {
        return response.custom({
          statusCode: 200,
          body: { ok: false, error: "Failed to start rollup" },
        });
      }
    } catch (err) {
      console.error("Index Management - RollupService - startRollup:", err);
      return response.custom({
        statusCode: 200,
        body: { ok: false, error: err.message },
      });
    }
  };

  stopRollup = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<boolean>>> => {
    try {
      const { id } = request.params as { id: string };
      const params = { rollupId: id };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const stopResponse = await callWithRequest("ism.stopRollup", params);
      const acknowledged = _.get(stopResponse, "acknowledged");
      if (acknowledged) {
        return response.custom({
          statusCode: 200,
          body: { ok: true, response: true },
        });
      } else {
        return response.custom({
          statusCode: 200,
          body: { ok: false, error: "Failed to stop rollup" },
        });
      }
    } catch (err) {
      console.error("Index Management - RollupService - stopRollup:", err);
      return response.custom({
        statusCode: 200,
        body: { ok: false, error: err.message },
      });
    }
  };

  /**
   * Calls backend Get Rollup API
   */
  getRollup = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<DocumentRollup>>> => {
    try {
      const { id } = request.params as { id: string };
      const params = { rollupId: id };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const getResponse = await callWithRequest("ism.getRollup", params);
      const metadata = await callWithRequest("ism.explainRollup", params);
      const rollup = _.get(getResponse, "rollup", null);
      const seqNo = _.get(getResponse, "_seq_no");
      const primaryTerm = _.get(getResponse, "_primary_term");

      //Form response
      if (rollup) {
        if (metadata) {
          return response.custom({
            statusCode: 200,
            body: {
              ok: true,
              response: {
                _id: id,
                _seqNo: seqNo as number,
                _primaryTerm: primaryTerm as number,
                rollup: rollup as Rollup,
                metadata: metadata,
              },
            },
          });
        } else
          return response.custom({
            statusCode: 200,
            body: {
              ok: false,
              error: "Failed to load metadata",
            },
          });
      } else {
        return response.custom({
          statusCode: 200,
          body: {
            ok: false,
            error: "Failed to load rollup",
          },
        });
      }
    } catch (err) {
      console.error("Index Management - RollupService - getRollup:", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };

  getMappings = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<any>>> => {
    try {
      const { index } = request.body as { index: string };
      const params = { index: index };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const mappings = await callWithRequest("indices.getMapping", params);
      return response.custom({
        statusCode: 200,
        body: {
          ok: true,
          response: mappings,
        },
      });
    } catch (err) {
      console.error("Index Management - RollupService - getMapping:", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };
  /**
   * Performs a fuzzy search request on rollup id
   */
  getRollups = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<GetRollupsResponse>>> => {
    try {
      const { from, size, search, sortDirection, sortField } = request.query as {
        from: string;
        size: string;
        search: string;
        sortDirection: string;
        sortField: string;
      };

      const rollupSortMap: { [key: string]: string } = {
        _id: "rollup.rollup_id.keyword",
        "rollup.source_index": "rollup.source_index.keyword",
        "rollup.target_index": "rollup.target_index.keyword",
        "rollup.rollup.enabled": "rollup.enabled",
      };

      const params = {
        from: parseInt(from, 10),
        size: parseInt(size, 10),
        search,
        sortField: rollupSortMap[sortField] || rollupSortMap._id,
        sortDirection,
      };

      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const getRollupResponse = await callWithRequest("ism.getRollups", params);
      const totalRollups = getRollupResponse.total_rollups;
      const rollups = getRollupResponse.rollups.map((rollup: DocumentRollup) => ({
        _seqNo: rollup._seqNo as number,
        _primaryTerm: rollup._primaryTerm as number,
        _id: rollup._id,
        rollup: rollup.rollup,
        metadata: null,
      }));

      // Call getExplain if any rollup job exists
      if (totalRollups) {
        // Concat rollup job ids
        const ids = rollups.map((rollup: DocumentRollup) => rollup._id).join(",");
        const explainResponse = await callWithRequest("ism.explainRollup", { rollupId: ids });
        if (!explainResponse.error) {
          rollups.map((rollup: DocumentRollup) => {
            rollup.metadata = explainResponse[rollup._id];
          });
          return response.custom({
            statusCode: 200,
            body: { ok: true, response: { rollups: rollups, totalRollups: totalRollups, metadata: explainResponse } },
          });
        } else
          return response.custom({
            statusCode: 200,
            body: {
              ok: false,
              error: explainResponse ? explainResponse.error : "An error occurred when calling getExplain API.",
            },
          });
      }
      return response.custom({
        statusCode: 200,
        body: { ok: true, response: { rollups: rollups, totalRollups: totalRollups, metadata: {} } },
      });
    } catch (err) {
      if (err.statusCode === 404 && err.body.error.type === "index_not_found_exception") {
        return response.custom({
          statusCode: 200,
          body: { ok: true, response: { rollups: [], totalRollups: 0, metadata: null } },
        });
      }
      console.error("Index Management - RollupService - getRollups", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: "Error in getRollups " + err.message,
        },
      });
    }
  };
}
