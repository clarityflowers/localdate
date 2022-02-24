// @ts-check

/**
 * Classes for manipulating days, weeks, and months without needing to worry
 * about time zones.
 * @module @ridereport/localdate
 */

/** @param {number[]} args */
function range(...args) {
    let from = 0,
        to = 0;
    if (args.length === 1) {
        to = args[0];
    } else {
        from = args[0];
        to = args[1];
    }
    const result = [];
    for (let i = from; i < to; i++) {
        result.push(i);
    }
    return result;
}

class DateFormatError extends Error {
    constructor(date) {
        super(`Date is not in a valid format: ${date}`);
    }
}

/**
 * @typedef {{start: LocalDate, end: LocalDate}} LocalDatePeriod
 */

/**
 * Represents a day in time, without any knowledge of attached timezones. Allows us
 * to safely manipulate the idea of a "report date" without worrying about confusing
 * these date-only objects with specific datetimes.
 *
 * A lot of this involves taking advantage of the `toLocaleDateString` function,
 * which is the only browser built-in that understands timezones.
 *
 * @class
 * @implements LocalDatePeriod
 * @typicalname date
 * @name LocalDate
 */
class LocalDate {
    /**
     * @type {Date}
     * @private
     * @readonly
     */
    date;

    /**
     * @param {number} year
     * @param {number} month
     * @param {number} day
     */
    constructor(year, month, day) {
        this.date = new Date(2000, 1, 1);
        this.date.setFullYear(year, month - 1, day);
    }

    get year() {
        return this.date.getFullYear();
    }
    /**
     * Get the month, 1-indexed so 1 is January
     */
    get month() {
        return this.date.getMonth() + 1;
    }
    get day() {
        return this.date.getDate();
    }
    /**
     * Get the day of the week. 0-indexed so 0 is Monday
     */
    get weekday() {
        return (this.date.getDay() + 6) % 7;
    }

    toString() {
        return `${this.year}-${formatToTwoDigits(
            this.month
        )}-${formatToTwoDigits(this.day)}`;
    }
    toDate() {
        // copy it so the LocalDate internals can't be changed
        return new Date(this.date);
    }
    toLocalWeek() {
        return new LocalWeek(this);
    }
    toLocalMonth() {
        return new LocalMonth(this.year, this.month);
    }
    toQuarter() {
        return new Quarter(this.year, Math.trunc((this.month - 1) / 3) + 1);
    }
    /**
     * Get an array of dates from this date to the target, inclusive
     * @param {LocalDate} to
     */
    range(to) {
        const greater = to.toString() > this.toString();
        /** @type LocalDate */
        let current = this;
        /** @type LocalDate[] */
        const result = [];
        while (!current.equals(to)) {
            result.push(current);
            current = greater ? current.plusDays(1) : current.minusDays(1);
        }
        result.push(to);
        return result;
    }

    /** @param {number} days */
    plusDays(days) {
        // js dates roll the days over, so the 35th of January is converted
        // to the 4th of February
        return new LocalDate(this.year, this.month, this.day + days);
    }
    /** @param {number} days */
    minusDays(days) {
        return this.plusDays(-days);
    }

    /** @param {LocalDate} date */
    equals(date) {
        return (
            date.year === this.year &&
            date.month === this.month &&
            date.day === this.day
        );
    }

    /** @param {LocalDate} date */
    isBefore(date) {
        return this.toString() < date.toString();
    }

    /** @param {LocalDate} date */
    isAfter(date) {
        return this.toString() > date.toString();
    }

    /** @param {string} date */
    static fromDateString(date) {
        const parts = date.split("-");
        if (parts.length !== 3) throw new DateFormatError(date);
        const [year, month, day] = parts.map((n) => parseInt(n, 10));
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw new DateFormatError(date);
        }
        return new LocalDate(year, month, day);
    }
    /**
     * @param {Date} date
     * @param {string} timeZone
     */
    static fromDateInTz(date, timeZone) {
        // yes, this is a weird hack
        // it works tho and is actually how most libraries that don't involve
        // 100mb imports do it too :(
        const year = parseInt(
            date.toLocaleDateString("en", { year: "numeric", timeZone }),
            10
        );
        const month = parseInt(
            date.toLocaleDateString("en", { month: "numeric", timeZone }),
            10
        );
        const day = parseInt(
            date.toLocaleDateString("en", { day: "numeric", timeZone }),
            10
        );
        return new LocalDate(year, month, day);
    }
    /** @param {string} timeZone */
    static todayInTz(timeZone) {
        return LocalDate.fromDateInTz(new Date(), timeZone);
    }
    /** @param {Date} date */
    static fromDate(date) {
        return new LocalDate(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );
    }

    get start() {
        /** Returns the date itself.
         *
         * Part of the {@link LocalDatePeriod} interface. **/
        return this;
    }
    get end() {
        /** Returns the date itself.
         *
         * Part of the {@link LocalDatePeriod} interface. **/
        return this;
    }
}

/** @param {number} number */
const formatToTwoDigits = (number) => {
    return ("" + number).padStart(2, "0");
};

/**
 * Represents a week without a timezone attached.
 *
 * @implements LocalDatePeriod
 * @typicalname week
 */
class LocalWeek {
    /**
     * @type LocalDate
     * @readonly
     */
    monday;

    /**
     * There's no standard representation of a week, so we accept any day
     * from that week as a valid reference to it
     *
     * @param {LocalDate} date
     */
    constructor(date) {
        this.monday = date.plusDays(-date.weekday);
    }

    get sunday() {
        return this.monday.plusDays(6);
    }

    /** @param {number} weeks */
    plusWeeks(weeks) {
        return new LocalWeek(this.monday.plusDays(7 * weeks));
    }
    /** @param {number} weeks */
    minusWeeks(weeks) {
        return this.plusWeeks(-weeks);
    }

    /** @param {LocalWeek} week */
    isBefore(week) {
        return this.monday.isBefore(week.monday);
    }

    /** @param {LocalWeek} week */
    isAfter(week) {
        return this.monday.isAfter(week.monday);
    }

    toDays() {
        return range(7).map((i) => this.monday.plusDays(i));
    }
    toString() {
        return `${this.monday.toString()}--${this.sunday.toString()}`;
    }

    get start() {
        /** The first day of the week.
         *
         * Part of the {@link LocalDatePeriod} interface.
         */
        return this.monday;
    }

    get end() {
        /** The last day of the week.
         *
         * Part of the {@link LocalDatePeriod} interface.
         */
        return this.sunday;
    }
}

/**
 * Represents a month from a specific year, without a timezone attached.
 *
 * @implements LocalDatePeriod
 * @typicalname month
 */
class LocalMonth {
    /**
     * @type LocalDate
     * @readonly
     */
    first;

    /**
     * This handles weird entries for month, so "0" will be the December
     * of the previous year, and "15" will the March of the next year
     *
     * @param {number} year
     * @param {number} month
     */
    constructor(year, month) {
        this.first = new LocalDate(year, month, 1);
    }

    get year() {
        return this.first.year;
    }

    get month() {
        return this.first.month;
    }

    get last() {
        return this.plusMonths(1).first.minusDays(1);
    }

    /** @param {number} months */
    plusMonths(months) {
        return new LocalMonth(this.year, this.month + months);
    }
    /** @param {number} months */
    minusMonths(months) {
        return this.plusMonths(-months);
    }

    numberOfDays() {
        return this.last.day;
    }

    weekdayStart() {
        return this.first.weekday;
    }

    /** @param {LocalMonth} month */
    isAfter(month) {
        return this.toString() > month.toString();
    }
    /** @param {LocalMonth} month */
    isBefore(month) {
        return this.toString() < month.toString();
    }

    /** @param {LocalMonth} month */
    equals(month) {
        return this.year === month.year && this.month === month.month;
    }

    /**
     * Generates an iterable of weeks in the month. A week is included if any
     * days of that week are in the month.
     */
    toWeeks() {
        /** @type LocalWeek[] */
        const result = [];
        let week = this.first.toLocalWeek();
        while (
            week.monday.toLocalMonth().equals(this) ||
            week.sunday.toLocalMonth().equals(this)
        ) {
            result.push(week);
            week = week.plusWeeks(1);
        }
        return result;
    }

    toString() {
        return `${this.year}-${formatToTwoDigits(this.month)}`;
    }

    /** @param {LocalDate} date */
    static fromLocalDate(date) {
        return new LocalMonth(date.year, date.month);
    }

    /** @param {string} date */
    static fromString(date) {
        const parts = date.split("-");
        if (parts.length !== 2) throw new DateFormatError(date);
        const [year, month] = parts.map((s) => parseInt(s, 10));
        if (isNaN(year) || isNaN(month)) throw new DateFormatError(date);
        return new LocalMonth(year, month);
    }

    /** @param {number} year */
    static listForYear(year) {
        return range(1, 13).map((month) => new LocalMonth(year, month));
    }

    get start() {
        /** The first day of the month.
         *
         * Part of the {@link LocalDatePeriod} interface.
         */
        return this.first;
    }

    get end() {
        /** The last day of the month.
         *
         * Part of the {@link LocalDatePeriod} interface.
         */
        return this.last;
    }
}

/**
 * @typedef {1 | 2 | 3 | 4} QuarterNumber

/**
 * @implements LocalDatePeriod
 * @typicalname quarter
 */
class Quarter {
    /**
     * @type number
     * @readonly */
    year;
    /**
     * @type number
     * @readonly
     */
    quarter;

    /**
     * @param {number} year
     * @param {number} quarter
     */
    constructor(year, quarter) {
        this.year = year;
        this.quarter = quarter;
    }

    get start() {
        return new LocalDate(this.year, (this.quarter - 1) * 3 + 1, 1);
    }
    get end() {
        return this.plusQuarters(1).start.minusDays(1);
    }

    /**
     * @param {number} quarters
     */
    plusQuarters(quarters) {
        const count = this.year * 4 + this.quarter + quarters;
        // This will not handle negative years correctly
        return new Quarter(Math.trunc(count / 4), count % 4);
    }

    /**
     * @param {number} quarters
     */
    minusQuarters(quarters) {
        return this.plusQuarters(-quarters);
    }

    toString() {
        return `Q${this.quarter} ${this.year}`;
    }
}

module.exports = {
    DateFormatError,
    LocalDate,
    LocalMonth,
    LocalWeek,
    Quarter,
};
