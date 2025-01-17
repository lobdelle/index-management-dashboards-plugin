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
import { EuiDragDropContext, EuiDroppable } from "@elastic/eui";
import DraggableItem from "./DraggableItem";
import { DEFAULT_ROLLOVER } from "../../utils/constants";
import { RolloverUIAction } from "../UIActions";
import { UIAction } from "../../../../../models/interfaces";
import { fireEvent } from "@testing-library/dom";

describe("<DraggableItem /> spec", () => {
  it("renders the component", () => {
    const action: UIAction<any> = new RolloverUIAction(DEFAULT_ROLLOVER);
    const content = action.content();
    const { container } = render(
      <EuiDragDropContext onDragEnd={() => {}}>
        <EuiDroppable droppableId="STATE_ACTIONS_DROPPABLE_AREA">
          <DraggableItem
            content={content}
            id={action.id}
            idx={0}
            isLast={true}
            onClickDelete={() => {}}
            onClickEdit={() => {}}
            draggableType="action"
          />
        </EuiDroppable>
      </EuiDragDropContext>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("calls onclickdeleteaction when clicking delete button", () => {
    const action: UIAction<any> = new RolloverUIAction(DEFAULT_ROLLOVER);
    const onClickDelete = jest.fn();
    const content = action.content();
    const { getByTestId } = render(
      <EuiDragDropContext onDragEnd={() => {}}>
        <EuiDroppable droppableId="STATE_ACTIONS_DROPPABLE_AREA">
          <DraggableItem
            content={content}
            id={action.id}
            idx={0}
            isLast={true}
            onClickDelete={onClickDelete}
            onClickEdit={() => {}}
            draggableType="action"
          />
        </EuiDroppable>
      </EuiDragDropContext>
    );

    fireEvent.click(getByTestId("draggable-item-delete-button-" + action.id));
    expect(onClickDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onclickeditaction when clicking edit button", () => {
    const action: UIAction<any> = new RolloverUIAction(DEFAULT_ROLLOVER);
    const onClickEdit = jest.fn();
    const content = action.content();
    const { getByTestId } = render(
      <EuiDragDropContext onDragEnd={() => {}}>
        <EuiDroppable droppableId="STATE_ACTIONS_DROPPABLE_AREA">
          <DraggableItem
            content={content}
            id={action.id}
            idx={0}
            isLast={true}
            onClickDelete={() => {}}
            onClickEdit={onClickEdit}
            draggableType="action"
          />
        </EuiDroppable>
      </EuiDragDropContext>
    );

    fireEvent.click(getByTestId("draggable-item-edit-button-" + action.id));
    expect(onClickEdit).toHaveBeenCalledTimes(1);
  });
});
