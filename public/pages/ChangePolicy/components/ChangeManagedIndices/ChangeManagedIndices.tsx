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

import React, { Component } from "react";
import { EuiSpacer, EuiComboBox, EuiFormRow } from "@elastic/eui";
import { ContentPanel } from "../../../../components/ContentPanel";
import { ManagedIndexService } from "../../../../services";
import { ManagedIndexItem, State } from "../../../../../models/interfaces";
import { CoreServicesContext } from "../../../../components/core_services";

interface ChangeManagedIndicesProps {
  managedIndexService: ManagedIndexService;
  selectedManagedIndices: { label: string; value?: ManagedIndexItem }[];
  selectedStateFilters: { label: string }[];
  onChangeManagedIndices: (selectedManagedIndices: { label: string; value?: ManagedIndexItem }[]) => void;
  onChangeStateFilters: (stateFilter: { label: string }[]) => void;
  managedIndicesError: string;
}

interface ChangeManagedIndicesState {
  managedIndicesIsLoading: boolean;
  managedIndices: { label: string; value?: ManagedIndexItem }[];
  stateFilterSearchValue: string;
}

export default class ChangeManagedIndices extends Component<ChangeManagedIndicesProps, ChangeManagedIndicesState> {
  static contextType = CoreServicesContext;
  state = {
    managedIndicesIsLoading: false,
    managedIndices: [],
    stateFilterSearchValue: "",
  };

  async componentDidMount(): Promise<void> {
    await this.onManagedIndexSearchChange("");
  }

  onManagedIndexSearchChange = async (searchValue: string): Promise<void> => {
    const { managedIndexService } = this.props;
    this.setState({ managedIndicesIsLoading: true, managedIndices: [] });
    try {
      // only bring back the first 10 results descending by name
      const queryObject = { from: 0, size: 10, search: searchValue, sortDirection: "desc", sortField: "name", showDataStreams: true };
      const managedIndicesResponse = await managedIndexService.getManagedIndices(queryObject);
      if (managedIndicesResponse.ok) {
        const options = searchValue.trim() ? [{ label: `${searchValue}*` }] : [];
        const managedIndices = managedIndicesResponse.response.managedIndices.map((managedIndex: ManagedIndexItem) => ({
          label: managedIndex.index,
          value: managedIndex,
        }));
        this.setState({ managedIndices: options.concat(managedIndices) });
      } else {
        if (managedIndicesResponse.error.startsWith("[index_not_found_exception]")) {
          this.context.notifications.toasts.addDanger("You have not created a managed index yet");
        } else {
          this.context.notifications.toasts.addDanger(managedIndicesResponse.error);
        }
      }
    } catch (err) {
      this.context.notifications.toasts.addDanger(err.message);
    }

    this.setState({ managedIndicesIsLoading: false });
  };

  onStateFilterSearchChange = (searchValue: string): void => {
    this.setState({ stateFilterSearchValue: searchValue });
  };

  render() {
    const { managedIndices, managedIndicesIsLoading, stateFilterSearchValue } = this.state;
    const { selectedManagedIndices, selectedStateFilters, managedIndicesError } = this.props;

    const uniqueStates = selectedManagedIndices.reduce(
      (accu: Set<any>, selectedManagedIndex: { label: string; value?: ManagedIndexItem }) => {
        if (!selectedManagedIndex.value) return accu;
        const policy = selectedManagedIndex.value.policy;
        if (!policy) return accu;
        policy.states.forEach((state: State) => {
          accu.add(state.name);
        });
        return accu;
      },
      new Set()
    );

    const options = stateFilterSearchValue.trim() ? [{ label: `${stateFilterSearchValue}*` }] : [];
    const stateOptions = options.concat([...uniqueStates].map((stateName: string) => ({ label: stateName })));

    return (
      <ContentPanel bodyStyles={{ padding: "initial" }} title="Choose managed indices" titleSize="s">
        <div style={{ paddingLeft: "10px" }}>
          <EuiSpacer size="m" />
          <EuiFormRow
            label="Managed indices"
            helpText="You can use * as wildcards to form index patterns."
            isInvalid={!!managedIndicesError}
            error={managedIndicesError}
          >
            <EuiComboBox
              placeholder=""
              async
              options={managedIndices}
              isInvalid={!!managedIndicesError}
              selectedOptions={selectedManagedIndices}
              isLoading={managedIndicesIsLoading}
              // @ts-ignore
              onChange={this.props.onChangeManagedIndices}
              onSearchChange={this.onManagedIndexSearchChange}
            />
          </EuiFormRow>

          <EuiFormRow label="State filters" helpText="Apply new policy only on managed indices in these states.">
            <EuiComboBox
              isDisabled={!selectedManagedIndices.length}
              placeholder="Choose state filters"
              options={stateOptions}
              selectedOptions={selectedStateFilters}
              // @ts-ignore
              onChange={this.props.onChangeStateFilters}
              onSearchChange={this.onStateFilterSearchChange}
            />
          </EuiFormRow>
        </div>
      </ContentPanel>
    );
  }
}
