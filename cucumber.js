module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['tests/e2e/steps/**/*.ts'],
    format: [
      'progress-bar',
      'html:tests/e2e/reports/cucumber.html',
      'json:tests/e2e/reports/cucumber.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true
  }
}
