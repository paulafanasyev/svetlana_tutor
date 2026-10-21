import test from 'node:test';
import assert from 'node:assert/strict';
import { provenance, staticSource, PROVENANCE } from './fopProvenance.js';

const sec = [{ title: 'Р', topics: ['т'] }];
test('статичный файл из КонсультантПлюс действующей редакции = копия ФОП', () => {
  assert.equal(staticSource({ source_url: 'https://www.consultant.ru/document/cons_doc_LAW_452180/a0fc/', source_doc: 'ФОП ООО (ред. от 10.11.2025)' }), 'fop');
});
test('корпус ЕДСОО или старая редакция = не сверено', () => {
  assert.equal(staticSource({ source_url: 'https://edsoo.ru/x.pdf', source_doc: 'ФРП 2023' }), 'corpus');
  assert.equal(staticSource({ source_url: 'https://www.consultant.ru/document/cons_doc_LAW_452180/x/', source_doc: 'ред. от 2023' }), 'corpus');
  assert.equal(staticSource({}), 'corpus');
});
test('содержание и результаты маркируются отдельно', () => {
  assert.deepEqual(provenance({ sections: sec, results: ['р'], content_src: 'live' }), { content: 'live', results: 'corpus' });
  assert.deepEqual(provenance({ sections: sec, results: ['р'], content_src: 'corpus', results_src: 'live' }), { content: 'corpus', results: 'live' });
  assert.deepEqual(provenance({ sections: [], results: [] }), { content: 'none', results: 'none' });
  assert.deepEqual(provenance({ sections: sec, results: ['р'], results_src: 'что-то' }), { content: 'corpus', results: 'corpus' });
  for (const k of Object.keys(PROVENANCE)) assert.ok(PROVENANCE[k].label && PROVENANCE[k].icon);
});
