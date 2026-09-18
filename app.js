const fs = require("fs");

let students;

try {
    const data = fs.readFileSync("students.json", "utf8");
    students = JSON.parse(data);

    if (!Array.isArray(students)) {
        throw new Error("students.json must contain an array of students.");
    }
} catch (error) {
    console.error("Error loading students.json:", error.message);
    process.exit(1);
}

function getAverageGrade(student) {
    if (!student || !Array.isArray(student.grades)) {
        return 0;
    }

    if (student.grades.length === 0) {
        return 0;
    }

    return student.grades.reduce((total, grade) => {
        return total + grade;
    }, 0) / student.grades.length;
}

function getTopStudents(students, n) {
    if (!Array.isArray(students)) {
        throw new Error("Students must be an array.");
    }

    if (typeof n !== "number" || !Number.isInteger(n)) {
        throw new Error("The number of top students must be an integer.");
    }

    if (n < 0) {
        throw new Error("The number of top students cannot be negative.");
    }

    return students
        .map(student => ({
            ...student,
            averageGrade: getAverageGrade(student)
        }))
        .sort((a, b) => b.averageGrade - a.averageGrade)
        .slice(0, n);
}

function groupByCourse(students) {
    if (!Array.isArray(students)) {
        throw new Error("Students must be an array.");
    }

    return students.reduce((groups, student) => {
        const course = student.course || "Unknown";

        if (!groups[course]) {
            groups[course] = [];
        }

        groups[course].push({ ...student });

        return groups;
    }, {});
}

function getEnrolledCount(students) {
    if (!Array.isArray(students)) {
        throw new Error("Students must be an array.");
    }

    const enrolled = students.filter(
        student => student.enrolled === true
    ).length;

    const notEnrolled = students.filter(
        student => student.enrolled === false
    ).length;

    return {
        enrolled: enrolled,
        notEnrolled: notEnrolled
    };
}

function findStudent(students, name) {
    if (!Array.isArray(students)) {
        throw new Error("Students must be an array.");
    }

    if (typeof name !== "string") {
        throw new Error("Student name must be a string.");
    }

    const searchName = name.trim().toLowerCase();

    if (searchName === "") {
        return null;
    }

    const student = students.find(student => {
        return (
            typeof student.name === "string" &&
            student.name.toLowerCase() === searchName
        );
    });

    return student ? { ...student } : null;
}

function getCourseAverages(students) {
    if (!Array.isArray(students)) {
        throw new Error("Students must be an array.");
    }

    const grouped = groupByCourse(students);

    return Object.entries(grouped)
        .map(([course, courseStudents]) => {
            const studentsWithGrades = courseStudents.filter(
                student =>
                    Array.isArray(student.grades) &&
                    student.grades.length > 0
            );

            const totalGrades = studentsWithGrades.reduce(
                (total, student) => {
                    return (
                        total +
                        student.grades.reduce(
                            (sum, grade) => sum + grade,
                            0
                        )
                    );
                },
                0
            );

            const gradeCount = studentsWithGrades.reduce(
                (count, student) => {
                    return count + student.grades.length;
                },
                0
            );

            const average =
                gradeCount > 0 ? totalGrades / gradeCount : 0;

            return {
                course: course,
                averageGrade: average
            };
        })
        .sort((a, b) => b.averageGrade - a.averageGrade);
}

function exportSummary(students) {
    if (!Array.isArray(students)) {
        throw new Error("Students must be an array.");
    }

    const studentsWithGrades = students.filter(student => {
        return Array.isArray(student.grades) && student.grades.length > 0;
    });

    const totalGradePoints = studentsWithGrades.reduce(
        (total, student) => {
            return (
                total +
                student.grades.reduce(
                    (sum, grade) => sum + grade,
                    0
                )
            );
        },
        0
    );

    const totalGrades = studentsWithGrades.reduce(
        (count, student) => {
            return count + student.grades.length;
        },
        0
    );

    const overallAverage =
        totalGrades > 0 ? totalGradePoints / totalGrades : 0;

    const topStudents = getTopStudents(students, 1);

    return {
        totalStudents: students.length,
        overallAverageGrade: Number(overallAverage.toFixed(2)),
        topPerformingStudent:
            topStudents.length > 0
                ? {
                      id: topStudents[0].id,
                      name: topStudents[0].name,
                      averageGrade: Number(
                          topStudents[0].averageGrade.toFixed(2)
                      )
                  }
                : null,
        breakdownByCourse: getCourseAverages(students)
    };
}

function main() {
    console.log("==========================================");
    console.log("       STUDENT RECORDS DATA REPORT");
    console.log("==========================================");

    const summary = exportSummary(students);

    console.log("\n--- TOTAL STUDENTS ---");
    console.log(`Total Students: ${students.length}`);

    console.log("\n--- OVERALL AVERAGE GRADE ---");
    console.log(
        `Overall Average: ${summary.overallAverageGrade.toFixed(2)}`
    );

    const enrollment = getEnrolledCount(students);

    console.log("\n--- ENROLLMENT ---");
    console.log(`Enrolled: ${enrollment.enrolled}`);
    console.log(`Not Enrolled: ${enrollment.notEnrolled}`);

    console.log("\n--- TOP 5 STUDENTS ---");

    const topStudents = getTopStudents(students, 5);

    if (topStudents.length === 0) {
        console.log("No students found.");
    } else {
        topStudents.forEach((student, index) => {
            console.log(
                `${index + 1}. ${student.name} - ${student.averageGrade.toFixed(2)}`
            );
        });
    }

    console.log("\n--- AVERAGE GRADE BY COURSE ---");

    const courseAverages = getCourseAverages(students);

    if (courseAverages.length === 0) {
        console.log("No course data available.");
    } else {
        courseAverages.forEach(course => {
            console.log(
                `${course.course}: ${course.averageGrade.toFixed(2)}`
            );
        });
    }

    console.log("\n--- STUDENTS GROUPED BY COURSE ---");

    const groupedStudents = groupByCourse(students);

    Object.entries(groupedStudents).forEach(
        ([course, courseStudents]) => {
            console.log(`\n${course}:`);

            courseStudents.forEach(student => {
                console.log(`  - ${student.name}`);
            });
        }
    );

    console.log("\n--- STUDENT SEARCH ---");

    const searchResult = findStudent(students, "maria santos");

    if (searchResult) {
        console.log(
            `Found: ${searchResult.name} (ID: ${searchResult.id})`
        );
    } else {
        console.log("Student not found.");
    }

    console.log("\n--- SUMMARY OBJECT ---");
    console.log(JSON.stringify(summary, null, 2));

    try {
        fs.writeFileSync(
            "report.json",
            JSON.stringify(summary, null, 2),
            "utf8"
        );

        console.log("\n--- REPORT FILE ---");
        console.log("report.json was created successfully.");
    } catch (error) {
        console.error(
            "Could not create report.json:",
            error.message
        );
    }

    console.log("\n==========================================");
    console.log("              REPORT COMPLETE");
    console.log("==========================================");
}

main();