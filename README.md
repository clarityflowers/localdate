# @ridereport/localdate

Immutable objects for working with dates, weeks, and months independent of time

This module exports the following four classes:

-   `LocalDate`, representing a date without a time
-   `LocalWeek`, representing a week starting on monday
-   `LocalMonth`, representing a full month of dates
-   `LocalQuarter`, representing three-month periods of the year

## Developing

This library is written with no dependencies other than jest for testing, and the code doesn't need to undergo any transpilation to be useable anywhere, making it easy to test and publish new versions.

All of the code is contained in `index.js`. We use typescript to typecheck our jsdoc comments so we ge the full benefits of strong typing without need to run the typescript compiler.
