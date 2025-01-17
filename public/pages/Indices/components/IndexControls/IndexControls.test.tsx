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

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render, fireEvent, waitFor } from "@testing-library/react";
// @ts-ignore
import userEvent from "@testing-library/user-event";
import IndexControls from "./IndexControls";

describe("<IndexControls /> spec", () => {
  it("renders the component", async () => {
    const { container } = render(
      <IndexControls
        activePage={0}
        pageCount={1}
        search={"testing"}
        onSearchChange={() => {}}
        onPageClick={() => {}}
        onRefresh={async () => {}}
        showDataStreams={false}
        getDataStreams={async () => []}
        toggleShowDataStreams={() => {}}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("calls onSearchChange when typing", async () => {
    const onSearchChange = jest.fn();
    const { getByPlaceholderText } = render(
      <IndexControls
        activePage={0}
        pageCount={1}
        search={""}
        onSearchChange={onSearchChange}
        onPageClick={() => {}}
        onRefresh={async () => {}}
        showDataStreams={false}
        getDataStreams={async () => []}
        toggleShowDataStreams={() => {}}
      />
    );

    userEvent.type(getByPlaceholderText("Search"), "four");

    expect(onSearchChange).toHaveBeenCalledTimes(4);
  });

  it("calls onRefresh on an interval", async () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <IndexControls
        activePage={0}
        pageCount={2}
        search={""}
        onSearchChange={() => {}}
        onPageClick={() => {}}
        onRefresh={onRefresh}
        showDataStreams={false}
        getDataStreams={async () => []}
        toggleShowDataStreams={() => {}}
      />
    );

    fireEvent.click(getByTestId("superDatePickerToggleQuickMenuButton"));

    expect(getByTestId("superDatePickerToggleRefreshButton")).toBeDisabled();

    userEvent.type(getByTestId("superDatePickerRefreshIntervalInput"), "1");

    expect(getByTestId("superDatePickerToggleRefreshButton")).toBeEnabled();

    fireEvent.click(getByTestId("superDatePickerToggleRefreshButton"));

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(2), { timeout: 10000 });
  });

  it("calls toggleShowDataStreams when clicked", async () => {
    const toggleShowDataStreams = jest.fn();
    const { getByTestId } = render(
      <IndexControls
        activePage={0}
        pageCount={2}
        search={""}
        onSearchChange={() => {}}
        onPageClick={() => {}}
        onRefresh={async () => {}}
        showDataStreams={false}
        getDataStreams={async () => []}
        toggleShowDataStreams={toggleShowDataStreams}
      />
    );

    fireEvent.click(getByTestId("toggleShowDataStreams"));
    expect(toggleShowDataStreams).toHaveBeenCalledTimes(1);
  });

  it("renders data streams selection field", async () => {
    const getDataStreams = jest.fn();
    const { container, getByText } = render(
      <IndexControls
        activePage={0}
        pageCount={1}
        search={"testing"}
        onSearchChange={() => {}}
        onPageClick={() => {}}
        onRefresh={async () => {}}
        showDataStreams={true}
        getDataStreams={getDataStreams}
        toggleShowDataStreams={() => {}}
      />
    );

    expect(container.firstChild).toMatchSnapshot();

    const dataStreamsSelection = getByText("Data streams");
    expect(dataStreamsSelection).not.toBeNull();

    fireEvent.click(dataStreamsSelection);
    await waitFor(() => expect(getDataStreams).toHaveBeenCalledTimes(1), { timeout: 10000 });
  });
});
