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

import React, { Component } from "react";
import { EuiFlexGrid, EuiSpacer, EuiFlexItem, EuiText, EuiBasicTable } from "@elastic/eui";
import { ContentPanel, ContentPanelActions } from "../../../../components/ContentPanel";
import { ModalConsumer } from "../../../../components/Modal";
import { ISMTemplate } from "../../../../../models/interfaces";

interface PolicySettingsProps {
  policyId: string;
  channelId: string;
  primaryTerm: number;
  lastUpdated: string;
  description: string;
  sequenceNumber: number;
  schemaVersion: number;
  ismTemplate: ISMTemplate;
}

export default class PolicySettings extends Component<PolicySettingsProps> {
  constructor(props: PolicySettingsProps) {
    super(props);
  }

  // TODO: Needs to be updated to handle template array
  getTemplates = (ismTemplate: ISMTemplate): object[] => {
    const templateArray = [];
    templateArray.push({
      indexPatterns: ismTemplate.index_patterns,
      priority: ismTemplate.priority,
    })
    return templateArray;
  }

  render() {
    const {
      policyId,
      channelId,
      primaryTerm,
      lastUpdated,
      description,
      sequenceNumber,
      schemaVersion,
      ismTemplate,
    } = this.props;

    const updatedDate = new Date(lastUpdated);

    const columns = [
      {
        field: 'indexPatterns',
        name: 'Index patterns',
        truncateText: false
      },
      {
        field: 'priority',
        name: "Priority",
        truncateText: false
      }
    ]
    const items = this.getTemplates(ismTemplate);

    const infoItems = [
      { term: "Policy name", value: policyId },
      { term: "channel ID", value: channelId || "-" },
      { term: "Primary term", value: primaryTerm },
      { term: "Last updated", value: updatedDate.toLocaleString() },
      { term: "Policy description", value: description || "-" },
      { term: "Sequence number", value: sequenceNumber },
      { term: "Schema version", value: schemaVersion },
    ];

    return(
      <ContentPanel
        actions={
          <ModalConsumer>
            {() => (
              <ContentPanelActions
                actions={[
                  {
                    text: "Edit",
                    buttonProps: {
                      onClick: {},
                    },
                  },
                ]}
              />
            )}
          </ModalConsumer>
        }
        panelStyles={{ padding: "20px 20px" }}
        bodyStyles={{ padding: "10px" }}
        title="Policy settings"
        titleSize="s"
      >
        <div style={{ paddingLeft: "10px" }}>
          <EuiSpacer size="s" />
          <EuiFlexGrid columns={4}>
            {infoItems.map((item) => (
              <EuiFlexItem key={`${item.term}#${item.value}`}>
                <EuiText size="xs">
                  <dt>{item.term}</dt>
                  <dd>{item.value}</dd>
                </EuiText>
              </EuiFlexItem>
            ))}
          </EuiFlexGrid>
          <EuiSpacer size="s" />
          <ContentPanel
            panelStyles={{ padding: "20px 20px" }}
            bodyStyles={{ padding: "10px" }}
            title="ISM Templates"
            titleSize="s"
          >
            <EuiBasicTable
              items={items}
              columns={columns}
            />
          </ContentPanel>
        </div>
      </ContentPanel>
    );
  }
}
