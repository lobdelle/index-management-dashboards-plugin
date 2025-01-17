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

import { HttpFetchQuery, HttpSetup } from "opensearch-dashboards/public";
import {
  AcknowledgedResponse,
  ApplyPolicyResponse,
  DataStream,
  GetDataStreamsAndIndicesNamesResponse,
  GetDataStreamsResponse,
  GetIndicesResponse,
  GetPoliciesResponse,
} from "../../server/models/interfaces";
import { ServerResponse } from "../../server/models/types";
import { NODE_API } from "../../utils/constants";
import { IndexItem } from "../../models/interfaces";
import { SECURITY_EXCEPTION_PREFIX } from "../../server/utils/constants";

export default class IndexService {
  httpClient: HttpSetup;

  constructor(httpClient: HttpSetup) {
    this.httpClient = httpClient;
  }

  getIndices = async (queryObject: HttpFetchQuery): Promise<ServerResponse<GetIndicesResponse>> => {
    let url = `..${NODE_API._INDICES}`;
    const response = (await this.httpClient.get(url, { query: queryObject })) as ServerResponse<GetIndicesResponse>;
    return response;
  };

  getDataStreams = async (queryObject: HttpFetchQuery): Promise<ServerResponse<GetDataStreamsResponse>> => {
    const url = `..${NODE_API._DATA_STREAMS}`;
    return await this.httpClient.get(url, { query: queryObject });
  };

  getDataStreamsAndIndicesNames = async (searchValue: string): Promise<ServerResponse<GetDataStreamsAndIndicesNamesResponse>> => {
    const [getIndicesResponse, getDataStreamsResponse] = await Promise.all([
      this.getIndices({ from: 0, size: 10, search: searchValue, sortDirection: "desc", sortField: "index", showDataStreams: true }),
      this.getDataStreams({ search: searchValue }),
    ]);

    if (!getIndicesResponse.ok) {
      return {
        ok: false,
        error: getIndicesResponse.error,
      };
    }

    if (!getDataStreamsResponse.ok) {
      // Data stream security exception shouldn't block this call totally
      if (getDataStreamsResponse.error.startsWith(SECURITY_EXCEPTION_PREFIX)) {
        return {
          ok: true,
          response: {
            dataStreams: [],
            indices: getIndicesResponse.response.indices.map((index: IndexItem) => index.index),
          },
        };
      }
      return {
        ok: false,
        error: getDataStreamsResponse.error,
      };
    }

    return {
      ok: true,
      response: {
        dataStreams: getDataStreamsResponse.response.dataStreams.map((ds: DataStream) => ds.name),
        indices: getIndicesResponse.response.indices.map((index: IndexItem) => index.index),
      },
    };
  };

  applyPolicy = async (indices: string[], policyId: string): Promise<ServerResponse<ApplyPolicyResponse>> => {
    const body = { indices, policyId };
    const url = `..${NODE_API.APPLY_POLICY}`;
    const response = (await this.httpClient.post(url, { body: JSON.stringify(body) })) as ServerResponse<ApplyPolicyResponse>;
    return response;
  };

  editRolloverAlias = async (index: string, alias: string): Promise<ServerResponse<AcknowledgedResponse>> => {
    const body = { index, alias };
    const url = `..${NODE_API.EDIT_ROLLOVER_ALIAS}`;
    const response = (await this.httpClient.post(url, { body: JSON.stringify(body) })) as ServerResponse<AcknowledgedResponse>;
    return response;
  };

  searchPolicies = async (searchValue: string, source: boolean = false): Promise<ServerResponse<GetPoliciesResponse>> => {
    const str = searchValue.trim();
    const queryObject = { from: 0, size: 10, search: str, sortDirection: "desc", sortField: "id" };
    const url = `..${NODE_API.POLICIES}`;
    const response = (await this.httpClient.get(url, { query: queryObject })) as ServerResponse<GetPoliciesResponse>;
    return response;
  };
}
