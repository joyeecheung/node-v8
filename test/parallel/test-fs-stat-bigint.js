'use strict';

require('../common');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const tmpdir = require('../common/tmpdir');
const { isDate } = require('util').types;

tmpdir.refresh();

const fn = path.join(tmpdir.path, 'test-file');
fs.writeFileSync(fn, 'test');

const link = path.join(tmpdir.path, 'symbolic-link');
fs.symlinkSync(fn, link);

function verifyStats(bigintStats, numStats) {
  for (const key of Object.keys(numStats)) {
    const val = numStats[key];
    if (isDate(val)) {
      const time = val.getTime();
      const time2 = bigintStats[key].getTime();
      assert(
        Math.abs(time - time2) < 2,
        `difference of ${key}.getTime() should < 2.\n` +
        `Number version ${time}, BigInt version ${time2}`);
    } else if (key === 'mode') {
      assert.strictEqual(
        bigintStats[key], BigInt(val),
        `${key} is a safe integer, should be the same as BigInt.\n` +
        `Number version ${val}, BigInt version ${bigintStats[key]}`);
      assert.strictEqual(
        bigintStats.isBlockDevice(),
        numStats.isBlockDevice(),
        'isBlockDevice'
      );
      assert.strictEqual(
        bigintStats.isCharacterDevice(),
        numStats.isCharacterDevice(),
        'isCharacterDevice');
      assert.strictEqual(
        bigintStats.isDirectory(),
        numStats.isDirectory(),
        'isDirectory');
      assert.strictEqual(
        bigintStats.isFIFO(),
        numStats.isFIFO(),
        'isFIFO');
      assert.strictEqual(
        bigintStats.isFile(),
        numStats.isFile(),
        'isFile');
      assert.strictEqual(
        bigintStats.isSocket(),
        numStats.isSocket(),
        'isSocket');
      assert.strictEqual(
        bigintStats.isSymbolicLink(),
        numStats.isSymbolicLink(),
        'isSymbolicLink');
    } else if (Number.isSafeInteger(val)) {
      assert.strictEqual(
        bigintStats[key], BigInt(val),
        `${key} is a safe integer, should be the same as BigInt.\n` +
        `Number version ${val}, BigInt version ${bigintStats[key]}`);
    } else {
      assert(
        Math.abs(Number(bigintStats[key]) - val) < 1,
        `${key} is not a safe integer, difference should < 1.\n` +
        `Number version ${val}, BigInt version ${bigintStats[key]}`);
    }
  }
}

{
  const bigintStats = fs.statSync(fn, { bigint: true });
  const numStats = fs.statSync(fn);
  verifyStats(bigintStats, numStats);
}

{
  const bigintStats = fs.lstatSync(link, { bigint: true });
  const numStats = fs.lstatSync(link);
  verifyStats(bigintStats, numStats);
}

{
  const fd = fs.openSync(fn, 'r');
  const bigintStats = fs.fstatSync(fd, { bigint: true });
  const numStats = fs.fstatSync(fd);
  verifyStats(bigintStats, numStats);
  fs.closeSync(fd);
}

{
  fs.stat(fn, { bigint: true }, (err, bigintStats) => {
    fs.stat(fn, (err, numStats) => {
      verifyStats(bigintStats, numStats);
    });
  });
}

{
  fs.lstat(link, { bigint: true }, (err, bigintStats) => {
    fs.lstat(link, (err, numStats) => {
      verifyStats(bigintStats, numStats);
    });
  });
}

{
  const fd = fs.openSync(fn, 'r');
  fs.fstat(fd, { bigint: true }, (err, bigintStats) => {
    fs.fstat(fd, (err, numStats) => {
      verifyStats(bigintStats, numStats);
      fs.closeSync(fd);
    });
  });
}
