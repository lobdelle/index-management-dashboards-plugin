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
import { RequestParams } from "@elastic/elasticsearch";
import {
  RequestHandlerContext,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  IOpenSearchDashboardsResponse,
  ILegacyCustomClusterClient,
} from "opensearch-dashboards/server";
import { INDEX } from "../utils/constants";
import { getSearchString, transformManagedIndexMetaData } from "../utils/helpers";
import {
  ChangePolicyResponse,
  ExplainAllResponse,
  ExplainAPIManagedIndexMetaData,
  GetManagedIndicesResponse,
  RemovePolicyResponse,
  RemoveResponse,
  RetryManagedIndexResponse,
  RetryParams,
  RetryResponse,
  SearchResponse,
} from "../models/interfaces";
import { ManagedIndicesSort, ServerResponse } from "../models/types";
import { ManagedIndexItem } from "../../models/interfaces";
import { getIndexToDataStreamMapping } from "./DataStreamService";

export default class ManagedIndexService {
  osDriver: ILegacyCustomClusterClient;

  constructor(osDriver: ILegacyCustomClusterClient) {
    this.osDriver = osDriver;
  }

  // TODO: Not finished, need UI page that uses this first
  getManagedIndex = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<any>>> => {
    try {
      const { id } = request.params as { id: string };
      const params: RequestParams.Get = { id, index: INDEX.OPENDISTRO_ISM_CONFIG };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const results: SearchResponse<any> = await callWithRequest("search", params);
      return response.custom({
        statusCode: 200,
        body: {
          ok: true,
          response: results,
        },
      });
    } catch (err) {
      console.error("Index Management - ManagedIndexService - getManagedIndex:", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };

  getManagedIndices = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<GetManagedIndicesResponse>>> => {
    try {
      const { from, size, sortDirection, sortField, terms, indices, dataStreams, showDataStreams } = request.query as {
        from: string;
        size: string;
        search: string;
        sortDirection: string;
        sortField: string;
        terms?: string[];
        indices?: string[];
        dataStreams?: string[];
        showDataStreams: boolean;
      };

      const managedIndexSorts: ManagedIndicesSort = { index: "managed_index.index", policyId: "managed_index.policy_id" };
      const explainParams = {
        sortField: sortField ? managedIndexSorts[sortField] : null,
        sortOrder: sortDirection,
        queryString: getSearchString(terms, indices, dataStreams),
      };

      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const [explainAllResponse, indexToDataStreamMapping] = await Promise.all([
        callWithRequest("ism.explainAll", explainParams) as Promise<ExplainAllResponse>,
        getIndexToDataStreamMapping({ callAsCurrentUser: callWithRequest }),
      ]);

      let totalCount = 0;
      const managedIndices: ManagedIndexItem[] = [];

      for (const indexName in explainAllResponse) {
        if (indexName == "total_managed_indices") continue;
        const metadata = explainAllResponse[indexName] as ExplainAPIManagedIndexMetaData;

        // If showDataStreams is not true, then skip the managed index if it belongs to a data stream.
        const parentDataStream = indexToDataStreamMapping[metadata.index] || null;
        if (!showDataStreams && parentDataStream !== null) continue;

        // Total count is the number of indices after being filtered.
        totalCount++;

        // Using the running totalCount, check if the managed index belongs to the current page.
        if (totalCount <= from || totalCount > from + size) continue;

        let policy, seqNo, primaryTerm, getResponse;
        try {
          getResponse = await callWithRequest("ism.getPolicy", { policyId: metadata.policy_id });
        } catch (err) {
          if (err.statusCode === 404 && err.body.error.reason === "Policy not found") {
            console.log("managed index with not existing policy");
          } else {
            throw err;
          }
        }
        policy = _.get(getResponse, "policy", null);
        seqNo = _.get(getResponse, "_seq_no", null);
        primaryTerm = _.get(getResponse, "_primary_term", null);
        managedIndices.push({
          index: metadata.index,
          indexUuid: metadata.index_uuid,
          dataStream: parentDataStream,
          policyId: metadata.policy_id,
          policySeqNo: seqNo,
          policyPrimaryTerm: primaryTerm,
          policy: policy,
          enabled: metadata.enabled,
          managedIndexMetaData: transformManagedIndexMetaData(metadata),
        });
      }

      return response.custom({
        statusCode: 200,
        body: {
          ok: true,
          response: { managedIndices: managedIndices, totalManagedIndices: totalCount },
        },
      });
    } catch (err) {
      if (err.statusCode === 404 && err.body.error.type === "index_not_found_exception") {
        return response.custom({
          statusCode: 200,
          body: {
            ok: true,
            response: { managedIndices: [], totalManagedIndices: 0 },
          },
        });
      }
      console.error("Index Management - ManagedIndexService - getManagedIndices", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };

  retryManagedIndexPolicy = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<RetryManagedIndexResponse>>> => {
    try {
      const { index, state = null } = request.body as { index: string[]; state?: string };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const params: RetryParams = { index: index.join(",") };
      if (state) params.body = { state };
      const retryResponse: RetryResponse = await callWithRequest("ism.retry", params);
      return response.custom({
        statusCode: 200,
        body: {
          ok: true,
          response: {
            failures: retryResponse.failures,
            updatedIndices: retryResponse.updated_indices,
            // TODO: remove ternary after fixing retry API to return empty array even if no failures
            failedIndices: retryResponse.failed_indices
              ? retryResponse.failed_indices.map((failedIndex) => ({
                  indexName: failedIndex.index_name,
                  indexUuid: failedIndex.index_uuid,
                  reason: failedIndex.reason,
                }))
              : [],
          },
        },
      });
    } catch (err) {
      console.error("Index Management - ManagedIndexService - retryManagedIndexPolicy:", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };

  changePolicy = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<ChangePolicyResponse>>> => {
    try {
      const { indices, policyId, include, state } = request.body as {
        indices: string[];
        policyId: string;
        state: string | null;
        include: { state: string }[];
      };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const params = { index: indices.join(","), body: { policy_id: policyId, include, state } };
      const changeResponse: RemoveResponse = await callWithRequest("ism.change", params);
      return response.custom({
        statusCode: 200,
        body: {
          ok: true,
          response: {
            failures: changeResponse.failures,
            updatedIndices: changeResponse.updated_indices,
            failedIndices: changeResponse.failed_indices.map((failedIndex) => ({
              indexName: failedIndex.index_name,
              indexUuid: failedIndex.index_uuid,
              reason: failedIndex.reason,
            })),
          },
        },
      });
    } catch (err) {
      console.error("Index Management - ManagedIndexService - changePolicy:", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };

  removePolicy = async (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<ServerResponse<RemovePolicyResponse>>> => {
    try {
      const { indices } = request.body as { indices: string[] };
      const { callAsCurrentUser: callWithRequest } = this.osDriver.asScoped(request);
      const params = { index: indices.join(",") };
      const addResponse: RemoveResponse = await callWithRequest("ism.remove", params);
      return response.custom({
        statusCode: 200,
        body: {
          ok: true,
          response: {
            failures: addResponse.failures,
            updatedIndices: addResponse.updated_indices,
            failedIndices: addResponse.failed_indices.map((failedIndex) => ({
              indexName: failedIndex.index_name,
              indexUuid: failedIndex.index_uuid,
              reason: failedIndex.reason,
            })),
          },
        },
      });
    } catch (err) {
      console.error("Index Management - ManagedIndexService - removePolicy:", err);
      return response.custom({
        statusCode: 200,
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };
}
