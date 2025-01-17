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

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/react";
import Actions from "./Actions";
import { UIAction } from "../../../../../models/interfaces";
import { CloseUIAction, RolloverUIAction } from "../../components/UIActions";
import { DEFAULT_CLOSE, DEFAULT_ROLLOVER } from "../../utils/constants";

describe("<Actions /> spec", () => {
  it("renders the component", () => {
    const actions: UIAction<any>[] = [new RolloverUIAction(DEFAULT_ROLLOVER, "some_id_1"), new CloseUIAction(DEFAULT_CLOSE, "some_id_2")];
    const { container } = render(
      <Actions
        actions={actions}
        onClickDeleteAction={() => {}}
        onClickEditAction={() => {}}
        onDragEndActions={() => {}}
        onClickAddAction={() => {}}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
