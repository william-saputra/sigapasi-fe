export interface AcademicYear {
  id: string
  yearStart: string
  yearEnd: string
  isActive: boolean
}

export interface Semester {
  id: string
  name: string
  startDate: string
  endDate: string
  academicYearId: string
  isActive: boolean
}

export interface ActiveAcademicCalendar {
  academicYear: AcademicYear
  semester: Semester
}
