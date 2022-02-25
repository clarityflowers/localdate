/**
 * Classes for manipulating days, weeks, and months without needing to worry
 * about time zones.
 */

/**
 * Get a list of incremental numbers with a given start and end.
 *
 * @param from - the starting number, inclusive.
 * @param to - the ending number, exclusive.
 */
function range(from: number, to: number): number[];

/**
 * Get a list of incremental numbers, starting at zero.
 *
 * @param to – the number of items in the list.
 */
function range(to: number): number[];

function range(...args: [number] | [number, number]) {
    let from = 0,
        to = 0;
    if (args.length === 1) {
        to = args[0];
    } else {
        from = args[0];
        to = args[1];
    }
    const result: number[] = [];
    for (let i = from; i < to; i++) {
        result.push(i);
    }
    return result;
}

export class DateFormatError extends Error {
    constructor(date: any) {
        super(`Date is not in a valid format: ${date}`);
    }
}

/** A range of calendary days, without any knowledge of time of day or timezones.*/
export interface LocalDatePeriod {
    start: LocalDate;
    end: LocalDate;
}

/**
 * Represents a day in time, without any knowledge of attached timezones. Allows us
 * to safely manipulate the idea of a "report date" without worrying about confusing
 * these date-only objects with specific datetimes.
 *
 * A lot of this involves taking advantage of the `toLocaleDateString` function,
 * which is the only browser built-in that understands timezones.
 */
export class LocalDate implements LocalDatePeriod {
    private readonly date: Date;

    constructor(year: number, month: number, day: number) {
        this.date = new Date(2000, 1, 1);
        this.date.setFullYear(year, month - 1, day);
    }

    get year() {
        return this.date.getFullYear();
    }
    /**
     * Gets the month, 1-indexed so 1 is January
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
        return new Quarter(
            this.year,
            (Math.trunc((this.month - 1) / 3) + 1) as QuarterNumber
        );
    }
    /** Get an array of dates from this date to the target, inclusive */
    range(to: LocalDate) {
        const greater = to.toString() > this.toString();
        let current: LocalDate = this;
        const result: LocalDate[] = [];
        while (!current.equals(to)) {
            result.push(current);
            current = greater ? current.plusDays(1) : current.minusDays(1);
        }
        result.push(to);
        return result;
    }

    plusDays(days: number) {
        // js dates roll the days over, so the 35th of January is converted
        // to the 4th of February
        return new LocalDate(this.year, this.month, this.day + days);
    }
    minusDays(days: number) {
        return this.plusDays(-days);
    }

    equals(date: LocalDate) {
        return (
            date.year === this.year &&
            date.month === this.month &&
            date.day === this.day
        );
    }

    isBefore(date: LocalDate) {
        return this.toString() < date.toString();
    }

    isAfter(date: LocalDate) {
        return this.toString() > date.toString();
    }

    static fromDateString(date: string) {
        const parts = date.split("-");
        if (parts.length !== 3) throw new DateFormatError(date);
        const [year, month, day] = parts.map((n) => parseInt(n, 10));
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw new DateFormatError(date);
        }
        return new LocalDate(year, month, day);
    }
    static fromDateInTz(date: Date, timeZone: string) {
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
    static todayInTz(timeZone: string) {
        return LocalDate.fromDateInTz(new Date(), timeZone);
    }
    static fromDate(date: Date) {
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

const formatToTwoDigits = (number: number) => {
    return ("" + number).padStart(2, "0");
};

/**
 * Represents a week without a timezone attached.
 */
export class LocalWeek implements LocalDatePeriod {
    readonly monday: LocalDate;

    /**
     * There's no standard representation of a week, so we accept any day
     * from that week as a valid reference to it
     */
    constructor(date: LocalDate) {
        this.monday = date.plusDays(-date.weekday);
    }

    get sunday() {
        return this.monday.plusDays(6);
    }

    plusWeeks(weeks: number) {
        return new LocalWeek(this.monday.plusDays(7 * weeks));
    }
    minusWeeks(weeks: number) {
        return this.plusWeeks(-weeks);
    }

    isBefore(date: LocalWeek) {
        return this.monday.isBefore(date.monday);
    }

    isAfter(date: LocalWeek) {
        return this.monday.isAfter(date.monday);
    }

    toDays() {
        return range(7).map((i) => this.monday.plusDays(i));
    }
    toString() {
        return `${this.monday.toString()}--${this.sunday.toString()}`;
    }

    get start(): LocalDate {
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
 */
export class LocalMonth implements LocalDatePeriod {
    private readonly date: LocalDate;

    /**
     * This handles weird entries for month, so "0" will be the December
     * of the previous year, and "15" will the March of the next year
     */
    constructor(year: number, month: number) {
        this.date = new LocalDate(year, month, 1);
    }

    get year() {
        return this.date.year;
    }

    get month() {
        return this.date.month;
    }

    get first() {
        return this.date;
    }

    get last() {
        return this.plusMonths(1).first.minusDays(1);
    }

    plusMonths(months: number) {
        return new LocalMonth(this.year, this.month + months);
    }
    minusMonths(months: number) {
        return this.plusMonths(-months);
    }

    numberOfDays() {
        return this.last.day;
    }

    weekdayStart() {
        return this.first.weekday;
    }

    isAfter(month: LocalMonth) {
        return this.toString() > month.toString();
    }
    isBefore(month: LocalMonth) {
        return this.toString() < month.toString();
    }

    equals(month: LocalMonth) {
        return this.year === month.year && this.month === month.month;
    }

    /**
     * Generates an iterable of weeks in the month. A week is included if any
     * days of that week are in the month.
     */
    toWeeks() {
        const result: LocalWeek[] = [];
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

    static fromLocalDate(date: LocalDate) {
        return new LocalMonth(date.year, date.month);
    }

    static fromString(date: string) {
        const parts = date.split("-");
        if (parts.length !== 2) throw new DateFormatError(date);
        const [year, month] = parts.map((s) => parseInt(s, 10));
        if (isNaN(year) || isNaN(month)) throw new DateFormatError(date);
        return new LocalMonth(year, month);
    }

    static listForYear(year: number) {
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

type QuarterNumber = 1 | 2 | 3 | 4;

export class Quarter implements LocalDatePeriod {
    readonly year: number;
    readonly quarter: QuarterNumber;

    constructor(year: number, quarter: QuarterNumber) {
        this.year = year;
        this.quarter = quarter;
    }

    get start(): LocalDate {
        return new LocalDate(this.year, (this.quarter - 1) * 3 + 1, 1);
    }
    get end(): LocalDate {
        return this.plusQuarters(1).start.minusDays(1);
    }

    plusQuarters(quarters: number) {
        const count = this.year * 4 + this.quarter + quarters;
        // This will not handle negative years correctly
        return new Quarter(Math.trunc(count / 4), (count % 4) as QuarterNumber);
    }

    minusQuarters(quarters: number) {
        return this.plusQuarters(-quarters);
    }

    toString() {
        return `Q${this.quarter} ${this.year}`;
    }
}
