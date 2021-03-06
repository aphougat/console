import React from 'react';
import { render, wait } from '@testing-library/react';

import {
  withApolloMockProvider,
  lambdaMock,
} from 'components/Lambdas/helpers/testing';

import {
  EVENT_TRIGGER_EVENT_SUBSCRIPTION_MOCK,
  SERVICE_BINDING_USAGE_EVENT_SUBSCRIPTION_MOCK,
} from 'components/Lambdas/gql/hooks/queries/testMocks';
import { API_RULE_EVENT_SUBSCRIPTION_MOCK } from 'components/ApiRules/gql/mocks/useApiRulesQuery';

import { BACKEND_MODULES } from 'components/Lambdas/helpers/misc';
import { createSubscriberRef } from 'components/Lambdas/helpers/eventTriggers';
import { SERVICE_BINDINGS_PANEL } from 'components/Lambdas/constants';
import { EVENT_TRIGGERS_PANEL } from 'shared/constants';
import { PANEL } from 'components/ApiRules/constants';

import { CONFIG } from 'components/Lambdas/config';

import ConfigurationTab from '../ConfigurationTab';

// remove it after add 'mutationobserver-shim' to jest config https://github.com/jsdom/jsdom/issues/639
const mutationObserverMock = jest.fn(function MutationObserver(callback) {
  this.observe = jest.fn();
  this.disconnect = jest.fn();
  // Optionally add a trigger() method to manually trigger a change
  this.trigger = mockedMutationsList => {
    callback(mockedMutationsList, this);
  };
});
global.MutationObserver = mutationObserverMock;

jest.mock('@kyma-project/common', () => ({
  getApiUrl: () => 'kyma.cluster.com',
}));

describe('ConfigurationTab', () => {
  it('should not render panels for Event Triggers, Service Bindings and API Rules - any required backendModules', async () => {
    const { queryByText } = render(<ConfigurationTab lambda={lambdaMock} />);

    expect(queryByText(PANEL.LIST.TITLE)).not.toBeInTheDocument();
    expect(
      queryByText(EVENT_TRIGGERS_PANEL.LIST.TITLE),
    ).not.toBeInTheDocument();
    expect(
      queryByText(SERVICE_BINDINGS_PANEL.LIST.TITLE),
    ).not.toBeInTheDocument();
  });

  it('should render panel for Event Triggers - eventing and application backendModule exists', async () => {
    const eventTriggersVariables = {
      subscriber: createSubscriberRef(lambdaMock),
      namespace: lambdaMock.namespace,
    };
    const subscriptionMock = EVENT_TRIGGER_EVENT_SUBSCRIPTION_MOCK(
      eventTriggersVariables,
    );
    const { queryByText } = render(
      withApolloMockProvider({
        component: (
          <ConfigurationTab
            lambda={lambdaMock}
            backendModules={[
              BACKEND_MODULES.EVENTING,
              BACKEND_MODULES.APPLICATION,
            ]}
          />
        ),
        mocks: [subscriptionMock],
      }),
    );

    await wait(() => {
      expect(queryByText(PANEL.LIST.TITLE)).not.toBeInTheDocument();
      expect(
        queryByText(SERVICE_BINDINGS_PANEL.LIST.TITLE),
      ).not.toBeInTheDocument();
      expect(queryByText(EVENT_TRIGGERS_PANEL.LIST.TITLE)).toBeInTheDocument();
    });
  });

  it('should render panel for Event Triggers - servicecatalog and servicecatalogaddons backendModule exists', async () => {
    const variables = {
      namespace: lambdaMock.namespace,
      resourceKind: CONFIG.functionUsageKind,
      resourceName: lambdaMock.name,
    };
    const subscriptionMock = SERVICE_BINDING_USAGE_EVENT_SUBSCRIPTION_MOCK(
      variables,
    );
    const { queryByText } = render(
      withApolloMockProvider({
        component: (
          <ConfigurationTab
            lambda={lambdaMock}
            backendModules={[
              BACKEND_MODULES.SERVICE_CATALOG,
              BACKEND_MODULES.SERVICE_CATALOG_ADDONS,
            ]}
          />
        ),
        mocks: [subscriptionMock],
      }),
    );

    await wait(() => {
      expect(queryByText(PANEL.LIST.TITLE)).not.toBeInTheDocument();
      expect(
        queryByText(EVENT_TRIGGERS_PANEL.LIST.TITLE),
      ).not.toBeInTheDocument();
      expect(
        queryByText(SERVICE_BINDINGS_PANEL.LIST.TITLE),
      ).toBeInTheDocument();
    });
  });

  it('should render panel for API Rules - apigateway backendModule exists', async () => {
    const variables = {
      namespace: lambdaMock.namespace,
      serviceName: lambdaMock.name,
    };
    const subscriptionMock = API_RULE_EVENT_SUBSCRIPTION_MOCK(variables);
    const { queryByText } = render(
      withApolloMockProvider({
        component: (
          <ConfigurationTab
            lambda={lambdaMock}
            backendModules={[BACKEND_MODULES.API_GATEWAY]}
          />
        ),
        mocks: [subscriptionMock],
      }),
    );

    await wait(() => {
      expect(queryByText(PANEL.LIST.TITLE)).toBeInTheDocument();
      expect(
        queryByText(EVENT_TRIGGERS_PANEL.LIST.TITLE),
      ).not.toBeInTheDocument();
      expect(
        queryByText(SERVICE_BINDINGS_PANEL.LIST.TITLE),
      ).not.toBeInTheDocument();
    });
  });
});
