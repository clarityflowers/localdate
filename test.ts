import { LocalDate, LocalWeek, LocalMonth, Quarter } from "./index";

// I don't know how to test LocalDate.fromDateInTz.
// If you figure out how to correctly mock date.protoType.toLocaleDateString()
// please add that in yourself :)

describe("LocalDate", () => {
    it("should have correct Y/M/D", () => {
        const date = new LocalDate(2014, 6, 14);
        expect(date.year).toEqual(2014);
        expect(date.month).toEqual(6);
        expect(date.day).toEqual(14);
    });

    it("should handle extra days", () => {
        const date = new LocalDate(2019, 12, 32); // December has 31 days
        expect(date.year).toEqual(2020);
        expect(date.month).toEqual(1);
        expect(date.day).toEqual(1);
    });

    it("should handle negative days", () => {
        const date = new LocalDate(2019, 1, -1); // two days before the first
        expect(date.year).toEqual(2018);
        expect(date.month).toEqual(12);
        expect(date.day).toEqual(30);
    });

    describe("weekday", () => {
        it("should treat monday as the 0th", () => {
            const monday = new LocalDate(2019, 8, 19);
            expect(monday.weekday).toEqual(0);
        });

        it("should treat sunday as the 6th", () => {
            const sunday = new LocalDate(2019, 8, 18);
            expect(sunday.weekday).toEqual(6);
        });
    });

    it("should convert to date correctly", () => {
        const date = new LocalDate(2019, 8, 19);
        // months are zero-indexed in js!
        expect(date.toDate()).toEqual(new Date(2019, 7, 19));
    });

    it("should handle adding days across years", () => {
        const date = new LocalDate(2019, 12, 30).plusDays(3);
        expect(date.year).toEqual(2020);
        expect(date.month).toEqual(1);
        expect(date.day).toEqual(2);
    });

    it("should handle subtracting days across months", () => {
        const date = new LocalDate(2019, 9, 6).minusDays(8);
        expect(date.year).toEqual(2019);
        expect(date.month).toEqual(8);
        expect(date.day).toEqual(29);
    });

    describe("range", () => {
        test("should go small to large", () => {
            const start = new LocalDate(2020, 2, 25);
            const end = new LocalDate(2020, 3, 1);
            expect(start.range(end)).toEqual([
                new LocalDate(2020, 2, 25),
                new LocalDate(2020, 2, 26),
                new LocalDate(2020, 2, 27),
                new LocalDate(2020, 2, 28),
                new LocalDate(2020, 2, 29),
                new LocalDate(2020, 3, 1),
            ]);
        });

        test("should go large to small", () => {
            const start = new LocalDate(2020, 1, 4);
            const end = new LocalDate(2019, 12, 28);
            expect(start.range(end)).toEqual([
                new LocalDate(2020, 1, 4),
                new LocalDate(2020, 1, 3),
                new LocalDate(2020, 1, 2),
                new LocalDate(2020, 1, 1),
                new LocalDate(2019, 12, 31),
                new LocalDate(2019, 12, 30),
                new LocalDate(2019, 12, 29),
                new LocalDate(2019, 12, 28),
            ]);
        });

        test("should return single date if inputs are the same", () => {
            const date = new LocalDate(2019, 8, 18);
            expect(date.range(date)).toEqual([date]);
        });
    });

    it("should convert from datestring effectively", () => {
        const date = LocalDate.fromDateString("2019-06-04");
        expect(date.year).toEqual(2019);
        expect(date.month).toEqual(6);
        expect(date.day).toEqual(4);
    });

    it("should convert from date correctly", () => {
        // months are zero-indexed in js!
        const date = LocalDate.fromDate(new Date(2021, 7, 18));
        expect(date.year).toEqual(2021);
        expect(date.month).toEqual(8);
        expect(date.day).toEqual(18);
    });

    it("should convert to month", () => {
        const month = new LocalDate(2020, 4, 24).toLocalMonth();
        expect(month.year).toEqual(2020);
        expect(month.month).toEqual(4);
        expect(month.first.day).toEqual(1);
    });

    it("should convert to week", () => {
        const thursday = new LocalDate(2019, 8, 29);
        const week = thursday.toLocalWeek();
        expect(week.monday).toEqual(thursday.minusDays(3));
        expect(week.sunday).toEqual(thursday.plusDays(3));
    });

    describe("equals", () => {
        it("should return true on equal days", () => {
            const date = new LocalDate(2019, 8, 5);
            const sameDate = new LocalDate(2019, 8, 6).minusDays(1);
            expect(date.equals(sameDate)).toBe(true);
        });
        it("should return false on different days", () => {
            const date = new LocalDate(2019, 8, 5);
            const sameDate = new LocalDate(2018, 8, 5);
            expect(date.equals(sameDate)).toBe(false);
        });
    });

    describe("isBefore", () => {
        it("should return true with tomorrow", () => {
            expect(
                new LocalDate(2019, 8, 5).isBefore(new LocalDate(2019, 8, 6))
            ).toBe(true);
        });
        it("should return false with today", () => {
            const date = new LocalDate(2019, 8, 5);
            expect(date.isBefore(date)).toBe(false);
        });
        it("should return false with last year", () => {
            expect(
                new LocalDate(2019, 8, 5).isBefore(new LocalDate(2018, 8, 5))
            ).toBe(false);
        });
    });

    describe("after", () => {
        it("should return false with tomorrow", () => {
            expect(
                new LocalDate(2019, 8, 5).isAfter(new LocalDate(2019, 8, 6))
            ).toBe(false);
        });
        it("should return false with today", () => {
            const date = new LocalDate(2019, 8, 5);
            expect(date.isAfter(date)).toBe(false);
        });
        it("should return true with last year", () => {
            expect(
                new LocalDate(2019, 8, 5).isAfter(new LocalDate(2018, 8, 5))
            ).toBe(true);
        });
    });

    describe("toString", () => {
        it("should format to string", () => {
            const date = new LocalDate(2019, 12, 25);
            expect(date.toString()).toEqual("2019-12-25");
        });
        it("should pad with zeros on single digit days and months", () => {
            const date = new LocalDate(2019, 4, 5);
            expect(date.toString()).toEqual("2019-04-05");
        });
    });

    describe("toQuarter", () => {
        it("should correctly assign quarters at date boundaries", () => {
            const jan1 = new LocalDate(2019, 1, 1);
            expect(jan1.toQuarter()).toEqual(new Quarter(2019, 1));
            const mar31 = new LocalDate(2019, 3, 31);
            expect(mar31.toQuarter()).toEqual(new Quarter(2019, 1));

            const apr1 = new LocalDate(2019, 4, 1);
            expect(apr1.toQuarter()).toEqual(new Quarter(2019, 2));
            const jun30 = new LocalDate(2019, 6, 30);
            expect(jun30.toQuarter()).toEqual(new Quarter(2019, 2));

            const jul1 = new LocalDate(2019, 7, 1);
            expect(jul1.toQuarter()).toEqual(new Quarter(2019, 3));
            const sep30 = new LocalDate(2019, 9, 30);
            expect(sep30.toQuarter()).toEqual(new Quarter(2019, 3));

            const oct1 = new LocalDate(2019, 10, 1);
            expect(oct1.toQuarter()).toEqual(new Quarter(2019, 4));
            const dec31 = new LocalDate(2019, 12, 31);
            expect(dec31.toQuarter()).toEqual(new Quarter(2019, 4));
        });
    });
});

describe("LocalWeek", () => {
    it("should have correct monday and sunday when given a monday", () => {
        const monday = new LocalDate(2019, 8, 26);
        const week = new LocalWeek(monday);
        expect(week.monday).toEqual(monday);
        expect(week.sunday).toEqual(monday.plusDays(6));
    });

    it("should have correct monday and sunday when given a sunday", () => {
        const sunday = new LocalDate(2019, 8, 25);
        const week = new LocalWeek(sunday);
        expect(week.monday).toEqual(sunday.minusDays(6));
        expect(week.sunday).toEqual(sunday);
    });

    it("should have correct monday and sunday when given a midweek date", () => {
        const friday = new LocalDate(2019, 8, 30);
        const week = new LocalWeek(friday);
        expect(week.monday).toEqual(friday.minusDays(4));
        expect(week.sunday).toEqual(friday.plusDays(2));
    });

    it("should add weeks", () => {
        const week = new LocalWeek(new LocalDate(2019, 8, 26));
        expect(week.plusWeeks(4).monday).toEqual(week.monday.plusDays(28));
    });

    it("should subtract weeks", () => {
        const week = new LocalWeek(new LocalDate(2019, 8, 26));
        expect(week.minusWeeks(2).monday).toEqual(week.monday.minusDays(14));
    });

    it("should convert to days", () => {
        const monday = new LocalDate(2019, 7, 29);
        const week = new LocalWeek(monday);
        expect(week.toDays()).toEqual([
            new LocalDate(2019, 7, 29),
            new LocalDate(2019, 7, 30),
            new LocalDate(2019, 7, 31),
            new LocalDate(2019, 8, 1),
            new LocalDate(2019, 8, 2),
            new LocalDate(2019, 8, 3),
            new LocalDate(2019, 8, 4),
        ]);
    });
    describe("toString", () => {
        it("should format to string", () => {
            const monday = new LocalDate(2019, 7, 29);
            const week = new LocalWeek(monday);
            expect(week.toString()).toEqual("2019-07-29--2019-08-04");
        });
    });
});

describe("LocalMonth", () => {
    it("should have correct year and month", () => {
        const month = new LocalMonth(2018, 8);
        expect(month.year).toEqual(2018);
        expect(month.month).toEqual(8);
    });

    it("should handle weird months", () => {
        const over = new LocalMonth(2018, 15);
        expect(over.year).toEqual(2019);
        expect(over.month).toEqual(3);

        const under = new LocalMonth(2018, -3);
        expect(under.year).toEqual(2017);
        expect(under.month).toEqual(9);
    });

    it("should return the correct date for the first", () => {
        const first = new LocalMonth(2018, 8).first;
        expect(first.year).toEqual(2018);
        expect(first.month).toEqual(8);
        expect(first.day).toEqual(1);
    });

    describe("plusMonths", () => {
        it("should add across years", () => {
            const month = new LocalMonth(2018, 8).plusMonths(5);
            expect(month.year).toEqual(2019);
            expect(month.month).toEqual(1);
        });

        it("should subtract across years", () => {
            const month = new LocalMonth(2018, 8).minusMonths(8);
            expect(month.year).toEqual(2017);
            expect(month.month).toEqual(12);
        });
    });

    describe("isBefore", () => {
        it("should return true with next month", () => {
            expect(
                new LocalMonth(2019, 8).isBefore(new LocalMonth(2019, 9))
            ).toBe(true);
        });
        it("should return false with this month", () => {
            const month = new LocalMonth(2019, 8);
            expect(month.isBefore(month)).toBe(false);
        });
        it("should return false with last year", () => {
            expect(
                new LocalMonth(2019, 8).isBefore(new LocalMonth(2018, 8))
            ).toBe(false);
        });
    });

    describe("after", () => {
        it("should return false with next month", () => {
            expect(
                new LocalMonth(2019, 8).isAfter(new LocalMonth(2019, 9))
            ).toBe(false);
        });
        it("should return false with this month", () => {
            const month = new LocalMonth(2019, 8);
            expect(month.isAfter(month)).toBe(false);
        });
        it("should return true with last year", () => {
            expect(
                new LocalMonth(2019, 8).isAfter(new LocalMonth(2018, 8))
            ).toBe(true);
        });
    });

    describe("numberOfDays", () => {
        it("should have correct number", () => {
            expect(new LocalMonth(2018, 8).numberOfDays()).toEqual(31);
            expect(new LocalMonth(2018, 6).numberOfDays()).toEqual(30);
            expect(new LocalMonth(2018, 2).numberOfDays()).toEqual(28);
        });

        it("should know about leap years", () => {
            expect(new LocalMonth(2016, 2).numberOfDays()).toEqual(29);
            expect(new LocalMonth(2000, 2).numberOfDays()).toEqual(29);
            expect(new LocalMonth(2100, 2).numberOfDays()).toEqual(28); // yes, this won't be a leap year
        });
    });

    it("should start on the correct weekday", () => {
        expect(new LocalMonth(2019, 8).weekdayStart()).toEqual(3);
        expect(new LocalMonth(2019, 7).weekdayStart()).toEqual(0);
        expect(new LocalMonth(2019, 12).weekdayStart()).toEqual(6);
    });

    it("should convert from localDate", () => {
        const month = LocalMonth.fromLocalDate(new LocalDate(2019, 8, 17));
        expect(month.year).toEqual(2019);
        expect(month.month).toEqual(8);
        expect(month.first.day).toEqual(1);
    });

    it("should convert to weeks", () => {
        expect(new LocalMonth(2019, 8).toWeeks()).toEqual([
            new LocalDate(2019, 7, 29).toLocalWeek(),
            new LocalDate(2019, 8, 5).toLocalWeek(),
            new LocalDate(2019, 8, 12).toLocalWeek(),
            new LocalDate(2019, 8, 19).toLocalWeek(),
            new LocalDate(2019, 8, 26).toLocalWeek(),
        ]);
    });

    it("should list for year", () => {
        expect(LocalMonth.listForYear(2014)).toEqual([
            new LocalMonth(2014, 1),
            new LocalMonth(2014, 2),
            new LocalMonth(2014, 3),
            new LocalMonth(2014, 4),
            new LocalMonth(2014, 5),
            new LocalMonth(2014, 6),
            new LocalMonth(2014, 7),
            new LocalMonth(2014, 8),
            new LocalMonth(2014, 9),
            new LocalMonth(2014, 10),
            new LocalMonth(2014, 11),
            new LocalMonth(2014, 12),
        ]);
    });
});

describe("Quarter", () => {
    it("should have correct starts", () => {
        const q1 = new Quarter(2021, 1);
        expect(q1.start).toEqual(new LocalDate(2021, 1, 1));
        const q2 = new Quarter(2021, 2);
        expect(q2.start).toEqual(new LocalDate(2021, 4, 1));
        const q3 = new Quarter(2021, 3);
        expect(q3.start).toEqual(new LocalDate(2021, 7, 1));
        const q4 = new Quarter(2021, 4);
        expect(q4.start).toEqual(new LocalDate(2021, 10, 1));
    });

    it("should have correct ends", () => {
        const q1 = new Quarter(2021, 1);
        expect(q1.end).toEqual(new LocalDate(2021, 3, 31));
        const q2 = new Quarter(2021, 2);
        expect(q2.end).toEqual(new LocalDate(2021, 6, 30));
        const q3 = new Quarter(2021, 3);
        expect(q3.end).toEqual(new LocalDate(2021, 9, 30));
        const q4 = new Quarter(2021, 4);
        expect(q4.end).toEqual(new LocalDate(2021, 12, 31));
    });
});
