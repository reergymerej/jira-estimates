#!/usr/bin/env node

import jiraQuery from 'jira-query';

const criteria = [
  'Sprint = 401',
  'issuetype = Sub-task',
  'assignee = currentUser()',
  'resolution = Unresolved',
];

const jql = criteria.join(' AND ');

function truncate(string, length) {
  if (string.length > length) {
    return string.substr(0, length - 3) + '...';
  } else {
    return string;
  }
}

function logIssue(issue) {
  const {remainingEstimate, subtaskSummary, key, parentIssueKey} = issue;
  const shortParentSummary = truncate(issue.parentIssueSummary, 42);
  console.log(`${remainingEstimate} - ${key} - ${subtaskSummary} (${parentIssueKey} - ${shortParentSummary})`);
  return issue;
}

function simplifyIssueData(issue) {
  const remainingEstimate = issue.fields.aggregatetimeestimate / 3600;
  const parentIssueSummary = issue.fields.parent.fields.summary;
  const subtaskSummary = issue.fields.summary;
  const parentIssueKey = issue.fields.parent.key;
  const key = issue.key;
  return {
    remainingEstimate,
    parentIssueSummary,
    subtaskSummary,
    key,
    parentIssueKey,
  };
}

function byRemainintEstimate(a, b) {
  return b.remainingEstimate - a.remainingEstimate;
}

function getTotalRemainingEstimate(issues) {
  return issues.reduce((prev, current) => {
    return prev + current.remainingEstimate;
  }, 0);
}

jiraQuery.jql(jql).then(issues => {
  const simplified = issues
    .map(simplifyIssueData)
    .sort(byRemainintEstimate)
    .map(logIssue);

  const remainingTotal = getTotalRemainingEstimate(simplified);

  console.log(`\nremaining hours: ${remainingTotal}\n`);
});
