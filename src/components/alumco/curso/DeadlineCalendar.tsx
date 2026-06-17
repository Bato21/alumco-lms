'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CourseDeadline {
  id: string
  title: string
  deadline: string | null
  deadlineStatus: 'overdue' | 'soon' | 'ok' | null
  progressPct: number
  status: 'completed' | 'in_progress' | 'not_started'
}

interface DeadlineCalendarProps {
  courses: CourseDeadline[]
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function DeadlineCalendar({ courses }: DeadlineCalendarProps) {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Primer día del mes (0=Dom, ajustar a Lun=0)
  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  // Días en el mes
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Mapa de deadlines por día
  const deadlinesByDay = new Map<number, CourseDeadline[]>()
  courses.forEach(course => {
    if (!course.deadline) return
    const d = new Date(course.deadline)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!deadlinesByDay.has(day)) deadlinesByDay.set(day, [])
      deadlinesByDay.get(day)!.push(course)
    }
  })

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  // Celdas del grid: offset + días del mes
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - startOffset + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  return (
    <div className="bg-white rounded-2xl border overflow-hidden">

      {/* Header del calendario */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b">
        <button
          onClick={prevMonth}
          className="p-2 sm:p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-[#F5F5F5] transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" aria-hidden="true"/>
        </button>

        <h3 className="font-bold text-[#1A1A2E] text-sm sm:text-base">
          {MONTHS[month]} {year}
        </h3>

        <button
          onClick={nextMonth}
          className="p-2 sm:p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-[#F5F5F5] transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true"/>
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b">
        {DAYS.map(day => (
          <div
            key={day}
            className="py-2 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const deadlines = day ? deadlinesByDay.get(day) ?? [] : []
          const isCurrentDay = day ? isToday(day) : false

          return (
            <div
              key={i}
              className={`min-h-[60px] sm:min-h-[80px] p-1 sm:p-1.5 border-r border-b relative ${
                !day ? 'bg-[#F5F5F5]/50' : ''
              } ${i % 7 === 6 ? 'border-r-0' : ''}`}
            >
              {day && (
                <>
                  {/* Número del día */}
                  <div className="flex justify-end mb-1">
                    <span className={`text-[10px] sm:text-xs font-semibold h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full ${
                      isCurrentDay
                        ? 'bg-[#2B4FA0] text-white'
                        : 'text-muted-foreground'
                    }`}>
                      {day}
                    </span>
                  </div>

                  {/* Eventos del día */}
                  <div className="space-y-0.5">
                    {deadlines.slice(0, 2).map(course => {
                      const color =
                        course.deadlineStatus === 'overdue'
                          ? 'bg-[#FAECE7] text-[#E74C3C] border-[#E74C3C]/20'
                          : course.deadlineStatus === 'soon'
                          ? 'bg-[#FFF8E7] text-[#854F0B] border-[#F5A623]/20'
                          : 'bg-[#EAF3DE] text-[#27500A] border-[#27AE60]/20'

                      return (
                        <Link
                          key={course.id}
                          href={`/cursos/${course.id}`}
                          className={`block text-[9px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded border truncate leading-tight ${color} hover:opacity-80 transition-opacity min-h-[20px]`}
                          title={course.title}
                        >
                          {course.title}
                        </Link>
                      )
                    })}

                    {/* Si hay más de 2 */}
                    {deadlines.length > 2 && (
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground px-1">
                        +{deadlines.length - 2} más
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="px-4 sm:px-5 py-3 border-t flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#FAECE7] border border-[#E74C3C]/20"/>
          <span className="text-xs text-muted-foreground">Vencido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#FFF8E7] border border-[#F5A623]/20"/>
          <span className="text-xs text-muted-foreground">Por vencer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#EAF3DE] border border-[#27AE60]/20"/>
          <span className="text-xs text-muted-foreground">A tiempo</span>
        </div>
      </div>
    </div>
  )
}