import test from 'node:test';
import assert from 'node:assert/strict';
import { activeSectionId } from '../web/blog.js';

test('Blog reading location follows down, up, long sections and gaps', () => {
  const bounds = offset => [
    {id:'why', top:100-offset}, {id:'research', top:1200-offset},
    {id:'version-history', top:3000-offset}, {id:'start', top:4200-offset},
  ];
  for (const [offset, expected] of [[0,'why'],[900,'why'],[1150,'research'],[2500,'research'],[3000,'version-history'],[4300,'start'],[1900,'research'],[0,'why']]) {
    assert.equal(activeSectionId(bounds(offset), 120), expected);
  }
  assert.equal(activeSectionId([],120),undefined);
});
