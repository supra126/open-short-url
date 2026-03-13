/**
 * Routing Rules MCP Tools
 */

import type { ApiClient } from '../utils/api-client.js';
import { handleTool } from '../utils/tool-handler.js';

const conditionTypeEnum = [
  'COUNTRY', 'REGION', 'CITY', 'DEVICE', 'OS', 'BROWSER', 'LANGUAGE',
  'REFERER', 'TIME', 'DAY_OF_WEEK',
  'UTM_SOURCE', 'UTM_MEDIUM', 'UTM_CAMPAIGN', 'UTM_TERM', 'UTM_CONTENT',
];

const conditionOperatorEnum = [
  'EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS',
  'IN', 'NOT_IN', 'STARTS_WITH', 'ENDS_WITH',
  'BETWEEN', 'BEFORE', 'AFTER',
];

const conditionsSchema = {
  type: 'object',
  description: 'Routing conditions with logical operator and condition items',
  properties: {
    operator: {
      type: 'string',
      enum: ['AND', 'OR'],
      description: 'Logical operator to combine conditions',
    },
    conditions: {
      type: 'array',
      description: 'Array of condition items (max 20)',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: conditionTypeEnum,
            description: 'Condition type',
          },
          operator: {
            type: 'string',
            enum: conditionOperatorEnum,
            description: 'Comparison operator',
          },
          value: {
            description: 'Condition value (string, string array, or time range object with start/end/timezone)',
          },
        },
        required: ['type', 'operator', 'value'],
      },
    },
  },
  required: ['operator', 'conditions'],
};

export function registerRoutingTools(apiClient: ApiClient) {
  return {
    create_routing_rule: {
      description: 'Create a smart routing rule for a short URL. Routes visitors to different targets based on conditions like country, device, browser, time, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          name: { type: 'string', description: 'Rule name (1-100 characters)' },
          targetUrl: { type: 'string', description: 'Target URL when conditions match' },
          priority: { type: 'number', description: 'Rule priority (0-10000, higher = evaluated first, optional)' },
          isActive: { type: 'boolean', description: 'Enable the rule (optional, defaults to true)' },
          conditions: conditionsSchema,
        },
        required: ['urlId', 'name', 'targetUrl', 'conditions'],
      },
      handler: handleTool((args) => {
        const { urlId, ...data } = args;
        return apiClient.createRoutingRule(urlId, data);
      }),
    },

    create_routing_rule_from_template: {
      description: 'Create a routing rule from a predefined template (e.g., mobile redirect, geo-targeting).',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          templateKey: { type: 'string', description: 'Template key (use list_routing_templates to see available templates)' },
          targetUrl: { type: 'string', description: 'Target URL when template conditions match' },
          name: { type: 'string', description: 'Custom rule name (optional, 1-100 characters)' },
          priority: { type: 'number', description: 'Rule priority (0-10000, optional)' },
        },
        required: ['urlId', 'templateKey', 'targetUrl'],
      },
      handler: handleTool((args) => {
        const { urlId, ...data } = args;
        return apiClient.createRoutingRuleFromTemplate(urlId, data);
      }),
    },

    list_routing_rules: {
      description: 'List all routing rules for a short URL with match statistics.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
        },
        required: ['urlId'],
      },
      handler: handleTool((args) => apiClient.listRoutingRules(args.urlId)),
    },

    get_routing_rule: {
      description: 'Get detailed information about a specific routing rule.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          ruleId: { type: 'string', description: 'Routing rule ID' },
        },
        required: ['urlId', 'ruleId'],
      },
      handler: handleTool((args) =>
        apiClient.getRoutingRule(args.urlId, args.ruleId)
      ),
    },

    update_routing_rule: {
      description: 'Update a routing rule including its name, target URL, priority, conditions, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          ruleId: { type: 'string', description: 'Routing rule ID' },
          name: { type: 'string', description: 'New rule name (optional)' },
          targetUrl: { type: 'string', description: 'New target URL (optional)' },
          priority: { type: 'number', description: 'New priority (optional)' },
          isActive: { type: 'boolean', description: 'Enable/disable the rule (optional)' },
          conditions: { ...conditionsSchema, description: 'New conditions (optional)' },
        },
        required: ['urlId', 'ruleId'],
      },
      handler: handleTool((args) => {
        const { urlId, ruleId, ...data } = args;
        return apiClient.updateRoutingRule(urlId, ruleId, data);
      }),
    },

    delete_routing_rule: {
      description: '[DESTRUCTIVE] Delete a routing rule from a short URL. Always confirm with the user before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          ruleId: { type: 'string', description: 'Routing rule ID' },
        },
        required: ['urlId', 'ruleId'],
      },
      handler: handleTool(
        (args) => apiClient.deleteRoutingRule(args.urlId, args.ruleId),
        (args) => `Routing rule ${args.ruleId} has been successfully deleted`
      ),
    },

    update_smart_routing_settings: {
      description: 'Update smart routing settings for a short URL (enable/disable smart routing, set default URL).',
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'string', description: 'Short URL ID' },
          isSmartRouting: { type: 'boolean', description: 'Enable/disable smart routing (optional)' },
          defaultUrl: { type: 'string', description: 'Default URL when no rules match (optional, set to null to remove)' },
        },
        required: ['urlId'],
      },
      handler: handleTool((args) => {
        const { urlId, ...data } = args;
        return apiClient.updateSmartRoutingSettings(urlId, data);
      }),
    },

    list_routing_templates: {
      description: 'List all available routing rule templates (predefined conditions for common use cases).',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: handleTool(() => apiClient.getRoutingTemplates()),
    },
  };
}
