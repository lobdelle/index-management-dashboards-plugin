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

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render, waitFor } from "@testing-library/react";
import NewPolicy from "./NewPolicy";
import { browserServicesMock } from "../../../../../test/mocks";
import { Radio } from "../../containers/ChangePolicy/ChangePolicy";
import coreServicesMock from "../../../../../test/mocks/coreServicesMock";
import { CoreServicesContext } from "../../../../components/core_services";

describe("<NewPolicy /> spec", () => {
  it("renders the component", async () => {
    browserServicesMock.indexService.searchPolicies = jest.fn().mockResolvedValue({ ok: true, response: { policies: [] } });
    const { container } = render(
      <CoreServicesContext.Provider value={coreServicesMock}>
        <NewPolicy
          indexService={browserServicesMock.indexService}
          selectedPolicies={[]}
          stateRadioIdSelected={Radio.Current}
          stateSelected=""
          onChangePolicy={() => {}}
          onChangeStateRadio={() => {}}
          onStateSelectChange={() => {}}
          selectedPoliciesError=""
        />
      </CoreServicesContext.Provider>
    );

    await waitFor(() => {});

    expect(container.firstChild).toMatchSnapshot();
  });

  it("shows danger toaster when search fails", async () => {
    browserServicesMock.indexService.searchPolicies = jest.fn().mockRejectedValue(new Error("this is an error"));
    render(
      <CoreServicesContext.Provider value={coreServicesMock}>
        <NewPolicy
          indexService={browserServicesMock.indexService}
          selectedPolicies={[]}
          stateRadioIdSelected={Radio.Current}
          stateSelected=""
          onChangePolicy={() => {}}
          onChangeStateRadio={() => {}}
          onStateSelectChange={() => {}}
          selectedPoliciesError=""
        />
      </CoreServicesContext.Provider>
    );

    await waitFor(() => {});

    expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledTimes(1);
    expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledWith("this is an error");
  });

  it("shows danger toaster when search gracefully fails", async () => {
    browserServicesMock.indexService.searchPolicies = jest.fn().mockResolvedValue({ ok: false, error: "some error" });
    render(
      <CoreServicesContext.Provider value={coreServicesMock}>
        <NewPolicy
          indexService={browserServicesMock.indexService}
          selectedPolicies={[]}
          stateRadioIdSelected={Radio.Current}
          stateSelected=""
          onChangePolicy={() => {}}
          onChangeStateRadio={() => {}}
          onStateSelectChange={() => {}}
          selectedPoliciesError=""
        />
      </CoreServicesContext.Provider>
    );

    await waitFor(() => {});

    expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledTimes(1);
    expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledWith("some error");
  });

  it("shows danger toaster when search fails because of no config index", async () => {
    browserServicesMock.indexService.searchPolicies = jest
      .fn()
      .mockResolvedValue({ ok: false, error: "[index_not_found_exception]and other stuff" });
    render(
      <CoreServicesContext.Provider value={coreServicesMock}>
        <NewPolicy
          indexService={browserServicesMock.indexService}
          selectedPolicies={[]}
          stateRadioIdSelected={Radio.Current}
          stateSelected=""
          onChangePolicy={() => {}}
          onChangeStateRadio={() => {}}
          onStateSelectChange={() => {}}
          selectedPoliciesError=""
        />
      </CoreServicesContext.Provider>
    );

    await waitFor(() => {});

    expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledTimes(1);
    expect(coreServicesMock.notifications.toasts.addDanger).toHaveBeenCalledWith("You have not created a policy yet");
  });
});
