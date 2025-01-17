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
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import { DefaultHeaders, IndexManagementApi } from "../models/interfaces";

export const API_ROUTE_PREFIX = "/_plugins/_ism";
export const API_ROUTE_PREFIX_ROLLUP = "/_plugins/_rollup";
export const TRANSFORM_ROUTE_PREFIX = "/_plugins/_transform";
export const NOTIFICATIONS_API_ROUTE_PREFIX = "/_plugins/_notifications";

export const API: IndexManagementApi = {
  POLICY_BASE: `${API_ROUTE_PREFIX}/policies`,
  EXPLAIN_BASE: `${API_ROUTE_PREFIX}/explain`,
  RETRY_BASE: `${API_ROUTE_PREFIX}/retry`,
  ADD_POLICY_BASE: `${API_ROUTE_PREFIX}/add`,
  REMOVE_POLICY_BASE: `${API_ROUTE_PREFIX}/remove`,
  CHANGE_POLICY_BASE: `${API_ROUTE_PREFIX}/change_policy`,
  ROLLUP_JOBS_BASE: `${API_ROUTE_PREFIX_ROLLUP}/jobs`,
  TRANSFORM_BASE: `${TRANSFORM_ROUTE_PREFIX}`,
};

export const DEFAULT_HEADERS: DefaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export enum CLUSTER {
  ADMIN = "admin",
  ISM = "opendistro_ism",
  DATA = "data",
}

export enum INDEX {
  OPENDISTRO_ISM_CONFIG = ".opendistro-ism-config",
}

export enum Setting {
  RolloverAlias = "plugins.index_state_management.rollover_alias",
}

export const SECURITY_EXCEPTION_PREFIX = "[security_exception]";
