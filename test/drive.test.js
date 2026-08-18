// test/drive.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { extrairDriveId, buildDriveImageUrl } = require('../shared/drive.js');

test('extrai ID de um link de compartilhamento do Drive', () => {
  assert.equal(
    extrairDriveId('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrSt/view?usp=sharing'),
    '1AbCdEfGhIjKlMnOpQrSt'
  );
});

test('extrai ID de um link com parâmetro id=', () => {
  assert.equal(
    extrairDriveId('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrSt'),
    '1AbCdEfGhIjKlMnOpQrSt'
  );
});

test('aceita o ID puro, sem link', () => {
  assert.equal(extrairDriveId('1AbCdEfGhIjKlMnOpQrSt'), '1AbCdEfGhIjKlMnOpQrSt');
});

test('retorna vazio para valor vazio ou nulo', () => {
  assert.equal(extrairDriveId(''), '');
  assert.equal(extrairDriveId(null), '');
});

test('buildDriveImageUrl monta URL de thumbnail', () => {
  assert.equal(
    buildDriveImageUrl('1AbCdEfGhIjKlMnOpQrSt'),
    'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrSt&sz=w500'
  );
});

test('buildDriveImageUrl aceita tamanho customizado', () => {
  assert.equal(
    buildDriveImageUrl('1AbCdEfGhIjKlMnOpQrSt', 200),
    'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrSt&sz=w200'
  );
});

test('buildDriveImageUrl retorna vazio sem ID válido', () => {
  assert.equal(buildDriveImageUrl(''), '');
});
