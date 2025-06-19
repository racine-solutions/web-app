const { resolve, relative } = require('path');
const { writeFileSync } = require('fs-extra');
const moment = require('moment');

let gitInfo;
try {
  const { gitDescribeSync } = require('git-describe');
  gitInfo = gitDescribeSync({
    dirtyMark: false,
    dirtySemver: false
  });
} catch (error) {
  console.log('Warning: Unable to get git information. Using fallback values.');
  gitInfo = {
    hash: 'unknown',
    raw: 'unknown'
  };
}

gitInfo.version = moment().format('YYMMDD');

const file = resolve(__dirname, '.', 'src', 'environments', '.env.ts');
writeFileSync(
  file,
  `// IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!
/* tslint:disable */
export default {
  'mifos_x': {
    'version': '${gitInfo.version}',
    'hash': '${gitInfo.hash}'
  },
  'allow_switching_backend_instance': true
};
/* tslint:enable */
`,
  { encoding: 'utf-8' }
);

console.log(`Wrote version info ${gitInfo.raw} to ${relative(resolve(__dirname, '..'), file)}`);
