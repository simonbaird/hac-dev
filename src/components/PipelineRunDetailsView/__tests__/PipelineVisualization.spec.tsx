import * as React from 'react';
import '@testing-library/jest-dom';
import { configure, render, screen } from '@testing-library/react';
import { SCAN_TASK } from '../../../hooks/useClairScanResults';
import { CustomError } from '../../../shared/utils/error/custom-error';
import { testPipelineRun } from '../../topology/__data__/pipeline-test-data';
import { mockPipelineRun, mockTaskRuns } from '../__data__/mockVisualizationData';
import PipelineRunVisualization from '../PipelineRunVisualization';

jest.mock('@openshift/dynamic-plugin-sdk-utils', () => ({
  useK8sWatchResource: jest.fn(),
  getActiveWorkspace: jest.fn(() => 'test-ws'),
}));

configure({ testIdAttribute: 'data-test' });

beforeEach(() => {
  const createElement = document.createElement.bind(document);
  document.createElement = (tagName) => {
    if (tagName === 'canvas') {
      return {
        getContext: () => ({
          measureText: () => ({}),
        }),
      };
    }
    return createElement(tagName);
  };

  (window.SVGElement as any).prototype.getBBox = () => ({
    x: 100,
    y: 100,
  });
});
afterEach(() => {
  (window.SVGElement as any).prototype.getBBox = undefined;
});

configure({ testIdAttribute: 'data-id' });

describe('PipelineRunVisualization', () => {
  it('should not render the pipelinerun graph', () => {
    render(<PipelineRunVisualization pipelineRun={null} taskRuns={[]} error={null} />);
    expect(screen.queryByTestId('pipelinerun-graph')).not.toBeInTheDocument();
  });

  it('should not render the pipelinerun graph if the pipelinerun status is not available yet', () => {
    const plrWithoutStatus = { ...testPipelineRun, status: undefined };
    render(<PipelineRunVisualization pipelineRun={plrWithoutStatus} taskRuns={[]} error={null} />);
    expect(screen.queryByTestId('pipelinerun-graph')).not.toBeInTheDocument();
  });

  it('should surface the api error message', () => {
    render(
      <PipelineRunVisualization
        taskRuns={[]}
        pipelineRun={null}
        error={new CustomError('Model does not exist')}
      />,
    );
    expect(screen.queryByText('Model does not exist')).toBeInTheDocument();
  });

  it('should render the correct number of task runs', () => {
    render(
      <PipelineRunVisualization
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
        error={null}
      />,
    );
    const graph = screen.getByTestId('pipelinerun-vis-graph');

    const taskNodes = graph.querySelectorAll('[data-type="pipelinerun-task-node"]');
    const finallyNodes = graph.querySelectorAll('[data-type="finally-node"]');
    expect(taskNodes).toHaveLength(12);
    expect(finallyNodes).toHaveLength(1);
  });

  it('should render the HACBS_TEST_OUTPUT correctly on the task runs', () => {
    render(
      <PipelineRunVisualization
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
        error={null}
      />,
    );
    const sanityCheck = screen.getByTestId('sanity-optional-label-check');

    const warningNodes = sanityCheck.querySelectorAll('.pipelinerun-node.pf-m-warning');
    expect(warningNodes).toHaveLength(1);

    const warningBadges = sanityCheck.querySelectorAll(
      '.pipelinerun-node__test-status-badge--warning > text',
    );
    expect(warningBadges[0].textContent).toBe('2');
  });

  it('should render the Clair scan results correctly on the task runs', () => {
    render(
      <PipelineRunVisualization
        pipelineRun={mockPipelineRun}
        taskRuns={mockTaskRuns}
        error={null}
      />,
    );
    const clairScan = screen.getByTestId(SCAN_TASK);

    const warningNodes = clairScan.querySelectorAll('.pipelinerun-node.pf-m-warning');
    expect(warningNodes).toHaveLength(1);

    const warningBadges = clairScan.querySelectorAll(
      '.pipelinerun-node__test-status-badge--warning > text',
    );
    expect(warningBadges[0].textContent).toBe('4');
  });
});
