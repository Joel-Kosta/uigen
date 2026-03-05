Run a security audit, fix vulnerabilities, and verify nothing broke.

1. Run `npm audit` and report what vulnerabilities were found
2. Run `npm audit fix` to automatically fix safe updates
3. If `npm audit fix` couldn't fix everything, ask me before running `npm audit fix --force`
4. Run `npm test` to make sure nothing broke
5. Report a summary of: vulnerabilities found, fixes applied, and test results
